# Chat assistant

An "Ask us" button in the bottom corner of every main-site page opens a
chat with an AI assistant (Claude, from Anthropic). It:

- answers questions about APN Real Estate: services, offices, hours,
  the team, appraisals, switching property managers, and so on;
- passes a visitor's details to the team when they want an appraisal,
  a callback or anything else followed up. It writes a row to the same
  Google Sheet as the forms, so the lead email goes out as usual;
- helps briefly with general property questions (how bonds or auctions
  work in SA, for example) and steers back to how APN can help.

It isn't on the landlord campaign page (`/landlords/`), so ad visitors
stay on that page's form.

## What visitors see

- **The button** ("Ask APN", with APN's star mark as the assistant's
  picture) in the bottom corner. On phones it's just the picture, and it
  sits above the call bar.
- **A greeting** that pops up beside the button seven seconds into a
  visit, once per visit, with quick replies to tap. Both depend on the
  page: landlord questions on `/leasing/`, seller questions on
  `/selling/`, and so on (`TOPICS` in `ChatWidget.tsx`). It isn't shown
  on the appraisal, thank-you or privacy pages, or once someone has
  chatted.
- **A start screen** when the chat opens: a greeting, four topic tiles
  (`TILES`), that page's popular questions, and Call and WhatsApp
  buttons.
- **Follow-up buttons** under each reply. The assistant ends each reply
  with a hidden `[[suggest: … | … ]]` line (asked for in
  `chat-prompt.ts`), which `functions/api/chat.ts` takes out of the text
  and sends as buttons.
- **A "Details sent to the team" card** when a lead reaches the sheet.

## How it fits together

| Piece | File |
| --- | --- |
| The button and chat panel | `src/components/ChatWidget.tsx` (styles under "Chat assistant" in `src/index.css`), added to every page by `src/components/Layout.tsx` |
| The server side, which calls Claude and writes leads to the sheet | `functions/api/chat.ts` |
| The assistant's instructions: tone, what it may and mustn't say, how it takes details | `functions/_lib/chat-prompt.ts` |
| The facts it answers from | `public/llms.txt`, read at request time, plus the instructions above |
| On/off switch | `CHAT_ASSISTANT_ENABLED` in `src/data/business.ts` |

The conversation is kept in the visitor's browser (sessionStorage), so it
carries on from page to page and is gone when they close the tab.
Nothing is stored on the server; only details the visitor agrees to send
reach the sheet.

**Keep its facts current.** When the offices, hours, team or a holiday
closure change, update `public/llms.txt` as well as
`src/data/business.ts` (already the rule for llms.txt). If the FAQs on
`/selling/`, `/leasing/` or the client hubs change, update the "Common
questions" section of `functions/_lib/chat-prompt.ts` to match.

## Setup

1. Create an API key at [console.anthropic.com](https://console.anthropic.com/)
   → **API keys**, in an organisation with billing set up. Under
   **Limits**, set a monthly spend limit you're comfortable with.
2. In the Cloudflare Pages project → **Settings → Environment
   variables**, add `ANTHROPIC_API_KEY` (as a secret, Production and
   Preview). `SHEETS_WEBHOOK_URL` is already set for the forms; the
   assistant uses the same one.
3. Redeploy. Until the key is set, the chat answers with the phone
   number and contact page instead.

To take the assistant off the site, set `CHAT_ASSISTANT_ENABLED` to
`false` in `src/data/business.ts`.

## Protecting against abuse

Each message costs a little (see below), and `/api/chat` is a public
endpoint, so:

- **Rate limiting rule (in place since 24 October 2026).** Cloudflare
  dashboard → the `apnre.com.au` zone → **Security → WAF → Rate limiting
  rules** → "Chat assistant: 3 messages per 10 seconds per visitor": URI
  path equals `/api/chat`, 3 requests per 10 seconds per IP, then Block
  for 10 seconds. That's the free plan's one rule, and its only window
  and block length. A blocked visitor sees the chat's "something went
  wrong, please try again" message.
- **Spend limit.** Set one in the Anthropic console (step 1 above).
- Built in: the endpoint only takes requests from the site itself,
  limits message length and conversation length (30 messages), and
  makes at most four model calls per message.
- **AI Gateway (required).** Anthropic refuses requests sent straight
  from Cloudflare's servers (403 "Request not allowed"), so the chat goes
  through the `apnre-chat`
  [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/):
  `ANTHROPIC_BASE_URL` in the Pages project's Production variables is
  `https://gateway.ai.cloudflare.com/v1/<account>/apnre-chat/anthropic`.
  The gateway passes the site's own Anthropic key through (no stored keys,
  no Cloudflare-billed credit), keeps no logs, and caps all traffic at 120
  requests a minute. Without that variable the chat answers with the
  phone number.

## Cost

It uses Claude Sonnet 5.5 (`MODEL` in `functions/api/chat.ts`) at low
effort, which keeps replies quick. Each message sends the instructions
and llms.txt (about 3,000 tokens) plus the conversation so far, so a
typical message costs about 1 cent (US). A thousand chat messages a
month would be in the order of US$10. For a cheaper assistant, change
`MODEL` to `claude-haiku-5-5` and remove the `betas` and `fallbacks`
lines, which only apply to the larger models.

The model must be allowed in the **APNRE** workspace's limits in the
Anthropic console (Settings → Workspaces → APNRE → Limits). A model whose
requests-per-minute limit is 0 there (Opus, as of October 2026) fails
with a 429, and the chat answers with the phone number.

## What lands in the sheet

| Column | Contents |
| --- | --- |
| Name / Email / Phone | From the chat, checked like the forms |
| Address | The property address, for appraisals |
| Message | `[Chat assistant \| Rental appraisal \| Page: /leasing/] <the assistant's summary> — Visitor wrote: <everything the visitor typed>` |
| Source | `apnre agency site / Chat assistant / <type>`: Sales appraisal, Rental appraisal, Buyer register, Tenant register or General enquiry |

The type names match the forms', so the lead email script
(`docs/lead-notifications.md`) routes each one to the same inbox as the
matching form. Filter on "Chat assistant" to see every chat lead.

The assistant always reads the details back and asks the visitor to
confirm before it sends them.

## Analytics

Opening the chat pushes `chat_open`, with `source` set to `launcher`
(the button) or `teaser` (a quick reply in the greeting); a lead sent from the chat pushes
`generate_lead` with `event_category: chat_assistant` and `form_name` set
to the type, plus a Meta Pixel `Lead` (appraisals) or `Contact`. See
`docs/gtm-events.md`.

## Testing

`npm run dev` has no Pages Functions, so the chat shows its error
message locally. To test the full thing, run the built site with
Wrangler:

```bash
npm run build
npx wrangler pages dev dist --binding ANTHROPIC_API_KEY=sk-ant-... --binding SHEETS_WEBHOOK_URL=<a test sheet's webhook>
```

Or deploy a preview with the key set. Then try a few questions, ask for
an appraisal with a name like "TEST — ignore", and check the sheet row
and email.
