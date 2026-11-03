// Cloudflare Pages Function: where browsers send Content-Security-Policy
// violation reports (the report-uri in public/_headers). The policy is
// Report-Only for now, so nothing is blocked; these reports show what an
// enforced policy would need to allow before it's switched on.
//
// Each violation becomes one short line in the Pages Functions log
// (Cloudflare dashboard → the Pages project → Functions → real-time logs),
// for example:
//   CSP report: script-src-elem blocked https://example.com/x.js on /buy/
// Addresses are cut down to their origin and path, with no query string
// or fragment, so tracking IDs, email addresses in links and the like
// never reach the log. Nothing is stored.
//
// Browsers send two formats:
//   application/csp-report    {"csp-report": {"violated-directive", "blocked-uri", "document-uri", ...}}
//                             (the older report-uri format, sent by every browser)
//   application/reports+json  [{"type": "csp-violation", "body": {"effectiveDirective",
//                             "blockedURL", "documentURL", ...}}] (the Reporting API)
// Both are read here. Anything else is ignored. The answer is always an
// empty 204: a browser does nothing with it.

/** Reports are a few hundred bytes; anything much bigger isn't one. */
const MAX_BODY_BYTES = 16 * 1024;
/** The Reporting API can batch several; more than this is noise. */
const MAX_REPORTS = 10;
const MAX_FIELD = 200;

const noContent = () => new Response(null, { status: 204 });

/** An address cut down to what's useful: origin and path for a web
 *  address, the bare scheme for data:, blob: and the like, and keywords
 *  ("inline", "eval") as they are. */
function clean(value: unknown, sameSite?: string): string {
  if (typeof value !== 'string' || !value) return '-';
  const v = value.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) return v.replace(/[^\w-]/g, '').slice(0, 40) || '-';
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return url.protocol.slice(0, -1);
    // The site's own pages are logged by path alone, to keep lines short.
    const where = sameSite && url.host === sameSite ? '' : url.origin;
    return `${where}${url.pathname}`.slice(0, MAX_FIELD);
  } catch {
    return '-';
  }
}

/** The directive's name only: "script-src https://... 'self'" (some
 *  browsers send the whole directive) becomes "script-src". */
function directive(value: unknown): string {
  return typeof value === 'string' ? value.trim().split(/\s+/)[0].replace(/[^\w-]/g, '').slice(0, 40) || '-' : '-';
}

interface Violation {
  directive: unknown;
  blocked: unknown;
  page: unknown;
}

/** The violations in a report body, in either format. */
function violations(body: unknown): Violation[] {
  if (Array.isArray(body)) {
    return body
      .filter((r) => r && typeof r === 'object' && (r as { type?: unknown }).type === 'csp-violation')
      .map((r) => {
        const b = ((r as { body?: unknown }).body ?? {}) as Record<string, unknown>;
        return { directive: b.effectiveDirective ?? b.violatedDirective, blocked: b.blockedURL, page: b.documentURL };
      });
  }
  const r = (body as { 'csp-report'?: unknown } | null)?.['csp-report'];
  if (!r || typeof r !== 'object') return [];
  const b = r as Record<string, unknown>;
  return [{ directive: b['effective-directive'] ?? b['violated-directive'], blocked: b['blocked-uri'], page: b['document-uri'] }];
}

/** The request body as text, or undefined once it passes MAX_BODY_BYTES.
 *  Read in pieces and given up on early, since a body sent without a
 *  Content-Length could otherwise be any size. */
async function readCapped(request: Request): Promise<string | undefined> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return undefined;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/csp-report' && type !== 'application/reports+json' && type !== 'application/json') {
    return noContent();
  }
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return noContent();

  let body: unknown;
  try {
    const text = await readCapped(request);
    if (text === undefined) return noContent();
    body = JSON.parse(text);
  } catch {
    return noContent();
  }

  const host = new URL(request.url).host;
  for (const v of violations(body).slice(0, MAX_REPORTS)) {
    console.log(`CSP report: ${directive(v.directive)} blocked ${clean(v.blocked, host)} on ${clean(v.page, host)}`);
  }
  return noContent();
};
