import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from '../data/business';
import { trackCallClick, trackChatLead, trackChatOpen, trackWhatsAppClick } from '../lib/analytics';
import { usePath } from '../lib/route';
import Icon, { type IconName } from './Icon';
import starMark from '../assets/logo/apn-star-mark.png?w=96&format=webp';

// The chat assistant: a button in the bottom corner (with a greeting that
// pops up beside it) that opens a chat panel. Replies come from
// functions/api/chat.ts (Claude), streamed in as they're written, with
// follow-up suggestions as buttons. See docs/chat-assistant.md.
//
// On phones the button and greeting are left off (they covered the page);
// the call bar's Chat button (StickyActions.tsx) opens the chat instead,
// by sending OPEN_EVENT. The chat marks the page with HAS_CHAT_CLASS while
// it's on it, which is what shows that button, so pages without the chat
// (the landlord funnel) never get one.

const ENDPOINT = '/api/chat';
/** Sent on window by StickyActions.tsx to open the chat. */
export const OPEN_EVENT = 'apn-chat-open';
/** On <html> while the chat is on the page (see index.css). */
const HAS_CHAT_CLASS = 'has-chat';
/** Where StickyActions.tsx's call bar shows, and the button and greeting
 *  don't (matches index.css). */
const PHONE_QUERY = '(max-width: 760px)';

/** The conversation lives in sessionStorage, so it carries on from page
 *  to page (the site is separate pages) and is gone when the tab closes. */
const STORAGE_KEY = 'apn-chat';
/** Set once the greeting has been shown or closed: once per visit is
 *  plenty. */
const TEASER_KEY = 'apn-chat-teaser';
const TEASER_DELAY_MS = 7000;

/** Under the caps in functions/api/chat.ts, so a long conversation drops
 *  its oldest messages instead of being turned away. */
const SEND_MESSAGES = 20;
const SEND_CHARS = 30_000;
const MAX_INPUT = 2000;

interface Topic {
  /** What the greeting beside the button says. */
  teaser: string;
  /** Questions offered as buttons, in the visitor's words. */
  prompts: string[];
}

/** What to offer on each part of the site, matched on the path's start
 *  (first match wins). */
const TOPICS: [string[], Topic][] = [
  [
    ['/leasing/', '/client-hub/landlords/', '/appraisal/rental/', '/commercial/'],
    {
      teaser: 'Thinking about a property manager? I can explain how we work, or how switching works.',
      prompts: ['What does property management include?', 'How do I switch property managers?', 'Book a rental appraisal'],
    },
  ],
  [
    ['/selling/', '/sold/', '/client-hub/sellers/', '/appraisal/sales/'],
    {
      teaser: 'Thinking of selling? I can explain how a sale works, or set up a free appraisal.',
      prompts: ['What’s my home worth?', 'What does it cost to sell?', 'Book a sales appraisal'],
    },
  ],
  [
    ['/rent/', '/client-hub/tenants/'],
    {
      teaser: 'Looking for a rental, or renting with us? I can help with applying, repairs and more.',
      prompts: ['How do I apply for a rental?', 'I need to report a repair', 'Tell me when new rentals come up'],
    },
  ],
  [
    ['/buy/', '/client-hub/buyers/'],
    {
      teaser: 'Looking to buy? I can help with inspections, offers and our buyer list.',
      prompts: ['How do inspections work?', 'How do I make an offer?', 'Add me to the buyer list'],
    },
  ],
  [
    ['/office-space/'],
    {
      teaser: 'After an office or the podcast room? Ask me what’s available.',
      prompts: ['What offices are available?', 'How does podcast room hire work?', 'Can I book a viewing?'],
    },
  ],
  [
    ['/careers/'],
    {
      teaser: 'Interested in working with us? Ask me about APN Real Estate.',
      prompts: ['What’s it like to work at APN?', 'How do I apply?', 'Where are your offices?'],
    },
  ],
];

const DEFAULT_TOPIC: Topic = {
  teaser: 'Hi! I’m APN Real Estate’s assistant. Ask me about selling, renting or property management.',
  prompts: ['What’s my property worth?', 'I need a property manager', 'I’m looking for a rental'],
};

function topicFor(path: string): Topic {
  return TOPICS.find(([paths]) => paths.some((p) => path.startsWith(p)))?.[1] ?? DEFAULT_TOPIC;
}

/** No greeting where it would get in the way: the appraisal forms are
 *  the whole page, and the rest are legal or after-submit pages. */
const NO_TEASER = ['/appraisal/', '/thank-you/', '/privacy/'];

/** The start screen's tiles: the main things people come for. */
const TILES: { icon: IconName; title: string; copy: string; ask: string }[] = [
  { icon: 'chart', title: 'What’s it worth?', copy: 'Free sales or rental appraisal', ask: 'What’s my property worth?' },
  { icon: 'key', title: 'Property management', copy: 'What’s included, switching', ask: 'Tell me about your property management' },
  { icon: 'home', title: 'Buy or rent', copy: 'Listings, inspections, applying', ask: 'I’m looking to buy or rent a property' },
  { icon: 'wrench', title: 'Tenant help', copy: 'Repairs, rent and your lease', ask: 'I’m a tenant and need some help' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** An error shown in place of a reply. Left out of what's sent, along
   *  with the question it failed to answer. */
  error?: boolean;
  /** Follow-ups the assistant offered, shown as buttons under its reply. */
  suggestions?: string[];
  /** This reply sent the visitor's details to the team. */
  lead?: boolean;
  /** The server's signature for this reply, sent back with it so the
   *  server knows it really wrote it (functions/_lib/chat-sign.ts). It
   *  covers `content` exactly as received, so the text must never be
   *  changed after the reply ends. */
  sig?: string;
}

/** A message from the server written for the visitor, shown as-is. */
class ServerMessage extends Error {}

/** The conversation to send: complete question-and-answer pairs (no
 *  failed ones), trimmed from the front to fit the server's caps. Each
 *  reply goes back with its signature and lead flag; the server leaves out
 *  any reply (and its question) that doesn't match its signature, such as
 *  one saved before replies were signed. */
function history(
  messages: Message[],
  question: string,
): { role: string; content: string; sig?: string; lead?: boolean }[] {
  const pairs: Message[][] = [];
  for (let i = 0; i + 1 < messages.length; i += 2) {
    const [q, a] = [messages[i], messages[i + 1]];
    if (q.role === 'user' && a.role === 'assistant' && !a.error && a.content.trim()) pairs.push([q, a]);
  }
  const out = [...pairs.flat(), { role: 'user' as const, content: question }];
  const size = () => out.reduce((n, m) => n + m.content.length, 0);
  // The latest reply that sent the visitor's details stays when older
  // exchanges are trimmed: its signed lead flag is how the server knows
  // not to send them again (functions/api/chat.ts).
  let kept = -1;
  for (let i = out.length - 2; i > 0; i -= 2) {
    if ((out[i] as Message).lead) {
      kept = i - 1;
      break;
    }
  }
  while (out.length > 1 && (out.length > SEND_MESSAGES || size() > SEND_CHARS)) {
    const at = kept === 0 && out.length > 3 ? 2 : 0;
    out.splice(at, 2);
    if (at === 0 && kept > 0) kept -= 2;
    else if (at === 0 && kept === 0) kept = -1;
  }
  return out.map(({ role, content, sig, lead }) =>
    role === 'assistant' ? { role, content, sig, ...(lead ? { lead: true } : {}) } : { role, content },
  );
}

/** Only links the assistant should be giving out: the site's own pages,
 *  web addresses, phone numbers and email. */
function safeHref(href: string): string | undefined {
  if (/^\/(?!\/)/.test(href) || /^(https?:|tel:|mailto:)/i.test(href)) return href;
  if (/^[a-z0-9.-]+\.(com\.au|gov\.au|org\.au|com)(\/\S*)?$/i.test(href)) return `https://${href}`;
  return undefined;
}

/** Link text for a link the assistant wrote as a bare path, such as
 *  [/buy/#register](/buy/#register), which reads like code. */
function linkLabel(label: string): string {
  if (!/^\/(?!\/)\S*$/.test(label)) return label;
  if (label.startsWith('/buy/')) return label.includes('#register') ? 'the buyer list' : 'properties for sale';
  if (label.startsWith('/rent/')) return label.includes('#register') ? 'the renter list' : 'properties for rent';
  if (label.startsWith('/sold/')) return 'recent sales';
  return 'this page';
}

/** Inline Markdown the assistant may use: [links](/path), bare URLs and
 *  **bold**. Everything else is plain text (React escapes it).
 *  `onNavigate` runs when a link to one of the site's own pages is
 *  followed. */
function inline(text: string, onNavigate?: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+[^\s).,!?])/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[3]) {
      out.push(<strong key={m.index}>{m[3]}</strong>);
    } else {
      const label = linkLabel(m[1] ?? m[4]);
      const href = safeHref(m[2] ?? m[4]);
      if (!href) out.push(label);
      else {
        const external = /^https?:/i.test(href) && !/^https?:\/\/(www\.)?apnre\.com\.au/i.test(href);
        const sitePage = !external && !/^(tel|mailto):/i.test(href);
        out.push(
          <a
            key={m.index}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={href.startsWith('tel:') ? () => trackCallClick('chat') : sitePage ? onNavigate : undefined}
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
function RichText({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
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
                  <li key={j}>{inline(l.replace(/^\s*[-•*]\s+/, ''), onNavigate)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i}>
              {lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(l, onNavigate)}
                </Fragment>
              ))}
            </p>
          );
        })}
    </>
  );
}

/** The assistant's picture: APN's star mark, with a dot saying it's on. */
function Avatar({ size = 'sm', online = false }: { size?: 'sm' | 'lg'; online?: boolean }) {
  return (
    <span className={`chat__avatar chat__avatar--${size}`}>
      <img src={starMark} alt="" width={size === 'lg' ? 26 : 18} height={size === 'lg' ? 27 : 19} />
      {online && <span className="chat__online" />}
    </span>
  );
}

/** "Good morning" and so on, by the visitor's own clock. */
function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function ChatWidget() {
  const path = usePath();
  const topic = topicFor(path);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const restored = useRef(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  /** What had focus when the chat opened (the button, or the call bar's
   *  Chat button), to go back to when it closes. */
  const opener = useRef<HTMLElement | null>(null);
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

  // Lets the call bar show its Chat button while the chat is on the page,
  // and open it from there.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add(HAS_CHAT_CLASS);
    const onOpen = () => openChat('callbar');
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      html.classList.remove(HAS_CHAT_CLASS);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
    // openChat only uses state setters and refs, so the first one will do.
  }, []);

  // The greeting pops up once per visit, a few seconds in, for visitors
  // who haven't chatted yet. Not on phones: there it covered the page
  // (and the footer's links), and the call bar has a Chat button instead.
  useEffect(() => {
    if (NO_TEASER.some((p) => path.startsWith(p))) return;
    if (window.matchMedia(PHONE_QUERY).matches) return;
    let seen = false;
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      seen = sessionStorage.getItem(TEASER_KEY) !== null || saved?.messages?.length > 0;
    } catch {
      // Without storage it would pop up on every page; leave it off.
      seen = true;
    }
    if (seen) return;
    const timer = window.setTimeout(() => {
      setTeaser(true);
      try {
        sessionStorage.setItem(TEASER_KEY, 'shown');
      } catch {
        // Fine: it just may show again on the next page.
      }
    }, TEASER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [path]);

  useEffect(() => {
    // The start screen reads from the top; a conversation from its end.
    if (!open || messages.length === 0) return;
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [open, messages]);

  // Rises above the footer's last row (the licensee line, privacy link
  // and Me² credit) as it scrolls into view, so the button never covers
  // it. --chat-clear is how far that row's top is above the bottom of
  // the screen; the CSS keeps the button at least that high. Not while
  // open, so the panel never rises under the header.
  useEffect(() => {
    const el = root.current;
    const legal = document.querySelector('.site-footer__legal');
    if (!el || !legal || open) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const clear = window.innerHeight - legal.getBoundingClientRect().top;
      el.style.setProperty('--chat-clear', clear > 0 ? `${Math.ceil(clear) + 12}px` : '0px');
      el.classList.toggle('is-lifted', clear > 0);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      el.style.removeProperty('--chat-clear');
      el.classList.remove('is-lifted');
    };
  }, [open]);

  // Ready to type on opening, except on touch screens, where it would
  // bring up the keyboard over the start screen.
  useEffect(() => {
    if (open && window.matchMedia('(pointer: fine)').matches) field.current?.focus();
  }, [open]);

  function openChat(source: 'launcher' | 'teaser' | 'callbar') {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    setTeaser(false);
    trackChatOpen(source);
  }

  /** Focus goes back to whatever opened the chat if it's still on screen
   *  (on phones the floating button is hidden, and the call bar may have
   *  slid away), otherwise to the floating button if that's showing. */
  function closeChat() {
    setOpen(false);
    const visible = (el: HTMLElement | null | undefined): el is HTMLElement =>
      !!el && el !== document.body && el.isConnected && el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]');
    // After the panel has gone, so the launcher's display is up to date.
    requestAnimationFrame(() => {
      const back = [opener.current, launcher.current].find(visible);
      back?.focus();
      opener.current = null;
    });
  }

  /** A link in a reply to one of the site's pages: the chat closes, so
   *  the page shows instead of the chat covering it (on phones it fills
   *  the screen). Saved straight away, since the page is about to unload
   *  before the effect that saves it would run. The conversation stays,
   *  for when they open the chat again. */
  function leaveForPage() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, open: false }));
    } catch {
      // Not saved: the chat may open again on the next page.
    }
  }

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_INPUT);
    if (!question || sending) return;
    const body = JSON.stringify({ messages: history(messages, question), page: path });
    setInput('');
    setSending(true);
    // Earlier suggestions go once the visitor has moved on.
    setMessages((m) => [
      ...m.map(({ suggestions: _, ...rest }) => rest),
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ]);

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
          const event = JSON.parse(line) as {
            type: string;
            text?: string;
            kind?: string;
            items?: unknown;
            error?: string;
            sig?: string;
          };
          if (event.type === 'text' && event.text) {
            wrote = true;
            reply((m) => ({ ...m, content: m.content + event.text }));
          } else if (event.type === 'suggestions' && Array.isArray(event.items)) {
            const items = event.items.filter((s): s is string => typeof s === 'string');
            reply((m) => ({ ...m, suggestions: items }));
          } else if (event.type === 'sig' && typeof event.sig === 'string') {
            const sig = event.sig;
            reply((m) => ({ ...m, sig }));
          } else if (event.type === 'lead' && event.kind) {
            trackChatLead(event.kind);
            reply((m) => ({ ...m, lead: true }));
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

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, 'closed');
    } catch {
      // Fine: it's only shown once per page load anyway.
    }
  }

  const last = messages[messages.length - 1];

  return (
    <div ref={root} className={`chat${open ? ' is-open' : ''}`}>
      {teaser && !open && (
        <div className="chat__teaser" role="status">
          <button type="button" className="chat__teaser-close" onClick={dismissTeaser} aria-label="Close message">
            <Icon name="close" size={14} />
          </button>
          <div className="chat__teaser-head">
            <Avatar online />
            <span>APN Real Estate</span>
          </div>
          <p>{topic.teaser}</p>
          <div className="chat__teaser-prompts">
            {topic.prompts.slice(0, 2).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  openChat('teaser');
                  send(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        ref={launcher}
        type="button"
        className="chat__launcher"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? closeChat() : openChat('launcher'))}
      >
        {open ? (
          <span className="chat__launcher-icon">
            <Icon name="close" size={22} />
          </span>
        ) : (
          <Avatar size="lg" online />
        )}
        <span className="chat__launcher-text">
          <strong>{open ? 'Close chat' : 'Ask APN'}</strong>
          {!open && <span>We reply in seconds</span>}
        </span>
      </button>

      {/* Only rendered once opened, so it never differs from the
          pre-rendered page. */}
      {open && (
        <section
          id={panelId}
          className="chat__panel"
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(e) => e.key === 'Escape' && closeChat()}
        >
          <header className="chat__head">
            <Avatar size="lg" online />
            <div className="chat__head-text">
              <h2 id={titleId} className="chat__title">
                APN Real Estate
              </h2>
              <p className="chat__sub">AI assistant · here 24/7</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                className="chat__icon-btn"
                onClick={startOver}
                disabled={sending}
                aria-label="Start a new chat"
                title="New chat"
              >
                <Icon name="refresh" />
              </button>
            )}
            <button type="button" className="chat__icon-btn" onClick={closeChat} aria-label="Close chat" title="Close">
              <Icon name="close" />
            </button>
          </header>

          <div ref={log} className="chat__log" role="log" aria-live="polite" aria-busy={sending}>
            {messages.length === 0 ? (
              <div className="chat__home">
                <p className="chat__hello">{greeting()}!</p>
                <p className="chat__intro">
                  I’m APN Real Estate’s assistant. Ask me anything about selling, renting or property management, or
                  pick a topic.
                </p>
                <div className="chat__tiles">
                  {TILES.map((t) => (
                    <button key={t.title} type="button" className="chat__tile" onClick={() => send(t.ask)}>
                      <span className="chat__tile-icon">
                        <Icon name={t.icon} size={20} />
                      </span>
                      <strong>{t.title}</strong>
                      <span>{t.copy}</span>
                    </button>
                  ))}
                </div>
                <p className="chat__label">Popular questions</p>
                <div className="chat__chips">
                  {topic.prompts.map((p) => (
                    <button key={p} type="button" onClick={() => send(p)}>
                      {p}
                    </button>
                  ))}
                </div>
                <p className="chat__label">Rather talk to a person?</p>
                <div className="chat__people">
                  <a href={PHONE_TEL} onClick={() => trackCallClick('chat')}>
                    <Icon name="phone" /> {PHONE_DISPLAY}
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsAppClick('chat')}
                  >
                    <Icon name="whatsapp" /> WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="chat__row chat__row--user">
                    <div className="chat__bubble">{m.content}</div>
                  </div>
                ) : (
                  <div key={i} className={`chat__row chat__row--assistant${m.error ? ' chat__row--error' : ''}`}>
                    <Avatar />
                    <div className="chat__body">
                      <div className="chat__bubble">
                        {m.content ? (
                          <RichText text={m.content} onNavigate={leaveForPage} />
                        ) : (
                          <span className="chat__typing" aria-label="Writing a reply">
                            <span />
                            <span />
                            <span />
                          </span>
                        )}
                      </div>
                      {m.lead && (
                        <div className="chat__sent">
                          <span className="chat__sent-icon">
                            <Icon name="check" size={16} />
                          </span>
                          <span>
                            <strong>Details sent to the team.</strong> We’ll be in touch during business hours.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )
            )}
            {!sending && last?.role === 'assistant' && last.suggestions?.length ? (
              <div className="chat__chips chat__chips--reply">
                {last.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
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
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" className="chat__send" disabled={sending || !input.trim()} aria-label="Send">
              <Icon name="send" />
            </button>
          </form>
          <p className="chat__note">
            AI can make mistakes. Urgent repair? Call{' '}
            <a href={PHONE_TEL} onClick={() => trackCallClick('chat')}>
              {PHONE_DISPLAY}
            </a>
            . <a href="/privacy/">Privacy</a>
          </p>
        </section>
      )}
    </div>
  );
}
