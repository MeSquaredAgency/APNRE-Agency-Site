import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick, trackChatLead, trackChatOpen } from '../lib/analytics';
import Icon from './Icon';

// The chat assistant: a button in the bottom corner that opens a chat
// panel. Replies come from functions/api/chat.ts (Claude), streamed in
// as they're written. See docs/chat-assistant.md.

const ENDPOINT = '/api/chat';

/** The conversation lives in sessionStorage, so it carries on from page
 *  to page (the site is separate pages) and is gone when the tab closes. */
const STORAGE_KEY = 'apn-chat';

/** Under the caps in functions/api/chat.ts, so a long conversation drops
 *  its oldest messages instead of being turned away. */
const SEND_MESSAGES = 20;
const SEND_CHARS = 30_000;
const MAX_INPUT = 2000;

const WELCOME =
  'Hi! I’m APN Real Estate’s AI assistant. Ask me about selling, renting, property management or our team, or I can pass your details on to the team.';

const SUGGESTIONS = [
  'What’s my property worth?',
  'How does switching property managers work?',
  'I’m looking for a rental',
  'What does property management include?',
];

/** A message from the server written for the visitor, shown as-is. */
class ServerMessage extends Error {}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** An error shown in place of a reply. Left out of what's sent, along
   *  with the question it failed to answer. */
  error?: boolean;
}

/** The conversation to send: complete question-and-answer pairs (no
 *  failed ones), trimmed from the front to fit the server's caps. */
function history(messages: Message[], question: string): { role: string; content: string }[] {
  const pairs: Message[][] = [];
  for (let i = 0; i + 1 < messages.length; i += 2) {
    const [q, a] = [messages[i], messages[i + 1]];
    if (q.role === 'user' && a.role === 'assistant' && !a.error && a.content.trim()) pairs.push([q, a]);
  }
  const out = [...pairs.flat(), { role: 'user' as const, content: question }];
  const size = () => out.reduce((n, m) => n + m.content.length, 0);
  while (out.length > 1 && (out.length > SEND_MESSAGES || size() > SEND_CHARS)) out.splice(0, 2);
  return out.map(({ role, content }) => ({ role, content }));
}

/** Only links the assistant should be giving out: the site's own pages,
 *  web addresses, phone numbers and email. */
function safeHref(href: string): string | undefined {
  if (/^\/(?!\/)/.test(href) || /^(https?:|tel:|mailto:)/i.test(href)) return href;
  if (/^[a-z0-9.-]+\.(com\.au|gov\.au|org\.au|com)(\/\S*)?$/i.test(href)) return `https://${href}`;
  return undefined;
}

/** Inline Markdown the assistant may use: [links](/path), bare URLs and
 *  **bold**. Everything else is plain text (React escapes it). */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+[^\s).,!?])/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[3]) {
      out.push(<strong key={m.index}>{m[3]}</strong>);
    } else {
      const label = m[1] ?? m[4];
      const href = safeHref(m[2] ?? m[4]);
      if (!href) out.push(label);
      else {
        const external = /^https?:/i.test(href) && !/^https?:\/\/(www\.)?apnre\.com\.au/i.test(href);
        out.push(
          <a
            key={m.index}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={href.startsWith('tel:') ? () => trackCallClick('chat') : undefined}
          >
            {label}
          </a>,
        );
      }
    }
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs, and lines starting "- " as a list. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text
        .trim()
        .split(/\n{2,}/)
        .map((block, i) => {
          const lines = block.split('\n');
          if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
            return (
              <ul key={i}>
                {lines.map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\s*[-•*]\s+/, ''))}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i}>
              {lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(l)}
                </Fragment>
              ))}
            </p>
          );
        })}
    </>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const restored = useRef(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();

  // Pick up the conversation from the last page. In an effect, so the
  // first render matches the pre-rendered page.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (Array.isArray(saved?.messages)) setMessages(saved.messages);
      if (saved?.open === true) setOpen(true);
    } catch {
      // No storage (private mode, blocked): start fresh.
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current || sending) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, open }));
    } catch {
      // Not saved: the chat still works on this page.
    }
  }, [messages, open, sending]);

  useEffect(() => {
    if (!open) return;
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [open, messages]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  function openChat() {
    setOpen(true);
    trackChatOpen();
  }

  function closeChat() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_INPUT);
    if (!question || sending) return;
    const body = JSON.stringify({ messages: history(messages, question), page: window.location.pathname });
    setInput('');
    setSending(true);
    setMessages((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '' }]);

    // Updates the reply being written (always the last message).
    const reply = (update: (m: Message) => Message) =>
      setMessages((all) => [...all.slice(0, -1), update(all[all.length - 1])]);
    const fail = (error: string) => reply(() => ({ role: 'assistant', content: error, error: true }));

    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        if (typeof err?.error === 'string') throw new ServerMessage(err.error);
        throw new Error(`Chat responded ${res.status}`);
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      let wrote = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; text?: string; kind?: string; error?: string };
          if (event.type === 'text' && event.text) {
            wrote = true;
            reply((m) => ({ ...m, content: m.content + event.text }));
          } else if (event.type === 'lead' && event.kind) {
            trackChatLead(event.kind);
          } else if (event.type === 'error') {
            throw new ServerMessage(event.error ?? '');
          }
        }
      }
      if (!wrote) throw new Error('No reply');
    } catch (err) {
      console.warn('Chat failed:', err);
      fail(
        (err instanceof ServerMessage && err.message) ||
          `Sorry, something went wrong. Please try again, or call us on [${PHONE_DISPLAY}](${PHONE_TEL}).`,
      );
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  function startOver() {
    setMessages([]);
    field.current?.focus();
  }

  return (
    <div className={`chat${open ? ' is-open' : ''}`}>
      <button
        ref={launcher}
        type="button"
        className="chat__launcher"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? closeChat() : openChat())}
      >
        <Icon name={open ? 'close' : 'chat'} size={22} />
        <span className="chat__launcher-label">{open ? 'Close chat' : 'Ask us'}</span>
      </button>

      <section
        id={panelId}
        className="chat__panel"
        role="dialog"
        aria-labelledby={titleId}
        hidden={!open}
        onKeyDown={(e) => e.key === 'Escape' && closeChat()}
      >
        <header className="chat__head">
          <div>
            <h2 id={titleId} className="chat__title">
              Ask APN Real Estate
            </h2>
            <p className="chat__sub">AI assistant · answers can be wrong</p>
          </div>
          <div className="chat__head-actions">
            {messages.length > 0 && (
              <button type="button" className="chat__text-btn" onClick={startOver} disabled={sending}>
                Start over
              </button>
            )}
            <button type="button" className="chat__icon-btn" onClick={closeChat} aria-label="Close chat">
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div ref={log} className="chat__log" role="log" aria-live="polite" aria-busy={sending}>
          <div className="chat__msg chat__msg--assistant">
            <RichText text={WELCOME} />
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat__msg chat__msg--${m.role}${m.error ? ' chat__msg--error' : ''}`}
            >
              {m.role === 'assistant' && !m.content ? (
                <span className="chat__typing" aria-label="Writing a reply">
                  <span />
                  <span />
                  <span />
                </span>
              ) : m.role === 'assistant' ? (
                <RichText text={m.content} />
              ) : (
                m.content
              )}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="chat__suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="chat__form" onSubmit={handleSubmit}>
          <label htmlFor={`${panelId}-input`} className="visually-hidden">
            Your message
          </label>
          <textarea
            ref={field}
            id={`${panelId}-input`}
            rows={1}
            maxLength={MAX_INPUT}
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="chat__send" disabled={sending || !input.trim()} aria-label="Send">
            <Icon name="send" />
          </button>
        </form>
        <p className="chat__note">
          Urgent repair? Call <a href={PHONE_TEL} onClick={() => trackCallClick('chat')}>{PHONE_DISPLAY}</a>. How we
          use your details: <a href="/privacy/">privacy policy</a>.
        </p>
      </section>
    </div>
  );
}
