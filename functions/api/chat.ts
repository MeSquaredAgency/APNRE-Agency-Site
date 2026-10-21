// Cloudflare Pages Function: the chat assistant (src/components/ChatWidget.tsx).
// The browser sends the conversation so far; this asks Claude for the
// next reply and streams it back as it's written. When a visitor asks to
// be contacted, Claude calls the submit_enquiry tool, which writes a row
// to the same Google Sheet as every other form, so the lead email goes
// out exactly as it does for them (docs/lead-notifications.md).
//
// The browser keeps the conversation (in sessionStorage), not the
// server, so there's nothing to store or clean up here. See
// docs/chat-assistant.md for setup and costs.
//
// Response: newline-delimited JSON, one event per line:
//   {"type":"text","text":"..."}   part of the reply
//   {"type":"lead","kind":"..."}   the visitor's details reached the sheet
//   {"type":"error","error":"..."} something went wrong; shown as-is
//   {"type":"done"}

import Anthropic from '@anthropic-ai/sdk';
import { OPENING_HOURS, PHONE_DISPLAY } from '../../src/data/business';
import { adelaideToday } from '../../src/lib/bookings';
import { CHAT_INSTRUCTIONS } from '../_lib/chat-prompt';
import { isEmail, isPhone, json, postToSheet, sheetSafe } from '../_lib/forms';

interface Env {
  /** From console.anthropic.com → API keys. Without it the assistant
   *  answers with the phone number instead (UNAVAILABLE). */
  ANTHROPIC_API_KEY?: string;
  /** Optional: send requests through Cloudflare AI Gateway (for logs,
   *  rate limits and spend caps), e.g.
   *  https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/anthropic */
  ANTHROPIC_BASE_URL?: string;
  SHEETS_WEBHOOK_URL?: string;
  /** Pages' own binding to the site's static files, for public/llms.txt. */
  ASSETS: Fetcher;
}

const MODEL = 'claude-opus-5-5';

/** Caps on what a visitor can send, so one conversation can't run up a
 *  large bill. The widget trims older messages to stay under them. */
const MAX_MESSAGES = 30;
const MAX_USER_CHARS = 2000;
const MAX_ASSISTANT_CHARS = 6000;
const MAX_TOTAL_CHARS = 40_000;
/** Model calls per visitor message: a reply, a tool call, and the reply
 *  after it, with one spare. */
const MAX_TURNS = 4;

const UNAVAILABLE = `Sorry, the chat isn’t available right now. Please call us on ${PHONE_DISPLAY} (${OPENING_HOURS.display}) or send a message from the [contact page](/contact/).`;

/** The enquiry types the assistant can send, with the label each gets in
 *  the sheet's Source column. The labels match functions/api/enquiry.ts,
 *  so the lead email script routes them the same way. */
const LEAD_TYPES: Record<string, string> = {
  'sales-appraisal': 'Sales appraisal',
  'rental-appraisal': 'Rental appraisal',
  'buyer-register': 'Buyer register',
  'tenant-register': 'Tenant register',
  general: 'General enquiry',
};

const SUBMIT_ENQUIRY: Anthropic.Beta.BetaTool = {
  name: 'submit_enquiry',
  description:
    'Sends the visitor’s contact details and enquiry to the APN Real Estate team, who will get back to them. Only call this after reading the details back to the visitor and getting their clear agreement.',
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The visitor’s full name.' },
      email: { type: 'string', description: 'The visitor’s email address.' },
      phone: { type: 'string', description: 'The visitor’s phone number, as they gave it.' },
      enquiry_type: { type: 'string', enum: Object.keys(LEAD_TYPES) },
      address: {
        type: 'string',
        description: 'The property address, for appraisals. An empty string if there isn’t one.',
      },
      summary: {
        type: 'string',
        description: 'One to three sentences for the team: what the visitor wants and anything useful they mentioned.',
      },
    },
    required: ['name', 'email', 'phone', 'enquiry_type', 'address', 'summary'],
    additionalProperties: false,
  },
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** The conversation from the browser, or why it was turned away. It must
 *  alternate, starting and ending with the visitor. */
function readConversation(body: unknown): ChatMessage[] | string {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return 'No message to answer.';
  if (messages.length > MAX_MESSAGES) return 'This conversation is too long. Please start a new one.';
  let total = 0;
  const out: ChatMessage[] = [];
  for (const [i, m] of messages.entries()) {
    const role = (m as ChatMessage)?.role;
    const content = (m as ChatMessage)?.content;
    if (role !== (i % 2 === 0 ? 'user' : 'assistant') || typeof content !== 'string' || !content.trim()) {
      return 'Invalid conversation.';
    }
    if (content.length > (role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) {
      return 'That message is too long. Please shorten it.';
    }
    total += content.length;
    out.push({ role, content });
  }
  if (out[out.length - 1].role !== 'user') return 'Invalid conversation.';
  if (total > MAX_TOTAL_CHARS) return 'This conversation is too long. Please start a new one.';
  return out;
}

/** public/llms.txt: the offices, hours, team and pages. Kept for the life
 *  of the worker, so it's read once rather than on every message. */
let reference: Promise<string> | undefined;
function loadReference(env: Env, requestUrl: string): Promise<string> {
  reference ??= env.ASSETS.fetch(new URL('/llms.txt', requestUrl))
    .then((res) => {
      if (!res.ok) throw new Error(`llms.txt responded ${res.status}`);
      return res.text();
    })
    .catch((err) => {
      console.error('Could not load llms.txt for the chat assistant:', err);
      reference = undefined; // try again next time
      return '';
    });
  return reference;
}

/** Checks the tool's input and writes the row. Returns what to tell the
 *  model: a confirmation, or a problem for it to sort out with the
 *  visitor. */
async function submitEnquiry(
  input: unknown,
  conversation: ChatMessage[],
  page: string,
  env: Env,
): Promise<{ ok: true; kind: string; result: string } | { ok: false; result: string }> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const get = (key: string, max = 500) => (typeof raw[key] === 'string' ? (raw[key] as string).trim().slice(0, max) : '');
  const lead = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    kind: get('enquiry_type'),
    address: get('address'),
    summary: get('summary', 1000),
  };
  // Own keys only, so "constructor" and the like don't match.
  if (!Object.prototype.hasOwnProperty.call(LEAD_TYPES, lead.kind)) {
    return { ok: false, result: `enquiry_type must be one of: ${Object.keys(LEAD_TYPES).join(', ')}.` };
  }
  if (!lead.name) return { ok: false, result: 'The name is missing. Ask the visitor for it.' };
  if (!isEmail(lead.email)) return { ok: false, result: 'That email address isn’t valid. Ask the visitor to check it.' };
  if (!isPhone(lead.phone)) return { ok: false, result: 'That phone number isn’t valid. Ask the visitor to check it.' };
  if (!lead.summary) return { ok: false, result: 'The summary is missing.' };

  if (!env.SHEETS_WEBHOOK_URL) {
    console.error('SHEETS_WEBHOOK_URL is not set, so the chat lead was not recorded.');
    return { ok: false, result: `The details couldn’t be sent. Ask the visitor to call ${PHONE_DISPLAY} instead.` };
  }

  // The visitor's own words go in too, so staff aren't relying on the
  // model's summary alone. Capped like the other forms' Message column.
  const said = conversation
    .filter((m) => m.role === 'user')
    .map((m) => m.content.replace(/\s+/g, ' '))
    .join(' / ');
  const label = LEAD_TYPES[lead.kind];
  const message = `[Chat assistant | ${label} | Page: ${page}] ${lead.summary} — Visitor wrote: ${said}`.slice(0, 3000);

  try {
    await postToSheet(env.SHEETS_WEBHOOK_URL, {
      name: sheetSafe(lead.name),
      email: sheetSafe(lead.email),
      phone: lead.phone,
      address: sheetSafe(lead.address),
      message: sheetSafe(message),
      // The type comes last: the lead email takes its subject from the
      // last part, and routes on it like the matching form.
      source: `apnre agency site / Chat assistant / ${label}`,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to forward chat lead to sheet webhook:', err);
    return { ok: false, result: `The details couldn’t be sent. Ask the visitor to try again or call ${PHONE_DISPLAY}.` };
  }
  return { ok: true, kind: lead.kind, result: 'Sent. The team has the visitor’s details.' };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Same-origin only: the widget is the only intended caller.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: 'Forbidden.' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }
  const conversation = readConversation(body);
  if (typeof conversation === 'string') return json({ ok: false, error: conversation }, 400);

  const pageRaw = (body as { page?: unknown }).page;
  const page = typeof pageRaw === 'string' && /^\/[\w\-/]{0,200}$/.test(pageRaw) ? pageRaw : '/';

  if (!env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set, so the chat assistant is off.');
    return json({ ok: false, error: UNAVAILABLE }, 503);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined });
  const llms = await loadReference(env, request.url);
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    {
      type: 'text',
      text: llms ? `${CHAT_INSTRUCTIONS}\n\n## Reference information (public/llms.txt)\n\n${llms}` : CHAT_INSTRUCTIONS,
      cache_control: { type: 'ephemeral' },
    },
    // After the cached block, so the date doesn't stop it being reused.
    { type: 'text', text: `Today in Adelaide is ${adelaideToday()}. The visitor is on the page ${page}.` },
  ];
  const messages: Anthropic.Beta.BetaMessageParam[] = conversation.map((m) => ({ role: m.role, content: m.content }));

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  // A visitor who closes the chat mid-reply closes the stream; the reply
  // just stops being sent.
  const send = (event: Record<string, unknown>) =>
    writer.write(encoder.encode(`${JSON.stringify(event)}\n`)).catch(() => {});

  const run = async () => {
    let wroteText = false;
    let jsonRetries = 0;
    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 16000,
          // A chat reply rarely needs deep reasoning; low keeps it quick.
          output_config: { effort: 'low' },
          // If Claude's safety checks decline a message, the API retries
          // it on Anthropic's recommended fallback model instead.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system,
          tools: [SUBMIT_ENQUIRY],
          messages,
        });
        let separated = !wroteText;
        stream.on('text', (delta) => {
          // A blank line between what was said before and after a tool call.
          if (!separated) {
            separated = true;
            send({ type: 'text', text: '\n\n' });
          }
          wroteText = true;
          send({ type: 'text', text: delta });
        });

        let message: Anthropic.Beta.BetaMessage;
        try {
          message = await stream.finalMessage();
          jsonRetries = 0;
        } catch (err) {
          // Only a tool input that couldn't be parsed is retried.
          if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
          console.warn('Chat tool input was not valid JSON; asking again.');
          turn--;
          continue;
        }

        if (message.stop_reason === 'refusal') {
          send({
            type: 'text',
            text: `${wroteText ? '\n\n' : ''}Sorry, I can’t help with that. For anything about APN Real Estate, call us on ${PHONE_DISPLAY}.`,
          });
          break;
        }
        const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
        if (toolUses.length === 0) break;
        // A tool input cut off at max_tokens can still look complete.
        if (message.stop_reason === 'max_tokens') throw new Error('Chat tool input truncated at max_tokens');

        messages.push({ role: 'assistant', content: message.content });
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const use of toolUses) {
          const outcome =
            use.name === SUBMIT_ENQUIRY.name
              ? await submitEnquiry(use.input, conversation, page, env)
              : { ok: false as const, result: `Unknown tool ${use.name}.` };
          if (outcome.ok) send({ type: 'lead', kind: outcome.kind });
          results.push({ type: 'tool_result', tool_use_id: use.id, content: outcome.result, is_error: !outcome.ok });
        }
        messages.push({ role: 'user', content: results });
      }
      await send({ type: 'done' });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) console.warn('Chat assistant rate limited:', err.message);
      else if (err instanceof Anthropic.APIError) console.error(`Chat assistant API error ${err.status}:`, err.message);
      else console.error('Chat assistant failed:', err);
      await send({ type: 'error', error: UNAVAILABLE });
    } finally {
      await writer.close().catch(() => {});
    }
  };
  context.waitUntil(run());

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
