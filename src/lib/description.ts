// Lays out a listing's description (src/pages/Listing.tsx). PropertyMe
// sends it as plain text, usually one line per paragraph or point with
// no blank lines, the way agents type it in:
//
//   Property Features:
//   Two separate 3-bedroom homes
//   Fully fenced
//   Location:
//   - Grant High School – approx. 0.7km
//
// so the structure is read back from the lines themselves: short lines
// ending in ":" (or "?") are headings, lines starting with "-" or "•" are
// bullet points, and a run of short lines right under a heading, none
// ending like a sentence, is a list too. Anything else stays as written,
// one paragraph per sentence-ending line. When a description doesn't fit
// these patterns it still reads as before, just spaced out.

export type DescriptionBlock =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  /** Lines of one paragraph, shown with line breaks between them. */
  | { type: 'paragraph'; lines: string[] };

/** "- ", "• ", "* ", "– " and the like at the start of a line. */
const BULLET = /^(?:[-–—•*·▪●◦►✓✔]+)\s+(?=\S)/;

/** Ends like a sentence (or an introduction to what follows), allowing
 *  for a closing quote or bracket. */
const SENTENCE_END = /[.!?:…]["'”’)\]]*$/;

/** "Property Features:", "Have a property to sell?": short, and ending in
 *  ":" or "?". */
const isHeading = (line: string) =>
  /[:?]$/.test(line) && line.length <= 50 && line.split(/\s+/).length <= 6;

/** A line ending in a dash runs on to the next one ("the online offer
 *  form -" then the link on its own line). */
const RUNS_ON = /\s[-–—]$/;

export function parseDescription(text: string): DescriptionBlock[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').trim())
    // Divider lines ("-----", "*****") are just gaps.
    .map((line) => (/^[-–—_*=~•.]{3,}$/.test(line) ? '' : line))
    // A portal's "See less" / "Read more" button, copied in with the text.
    // Capitalised, as the button is, so "come and see more" in a sentence stays.
    .map((line) => line.replace(/\s*\b(?:See|Read|Show) (?:less|more)$/, ''));

  // Group the lines into runs: lines of plain text with nothing between
  // them. Blank lines, headings and bullet points end a run.
  const blocks: DescriptionBlock[] = [];
  let run: string[] = [];
  let runAfterHeading = false;
  let bullets: string[] = [];

  // A blank line between a heading and its points doesn't separate them.
  const endRun = () => {
    if (run.length === 0) return;
    blocks.push(...runBlocks(run, runAfterHeading));
    run = [];
    runAfterHeading = false;
  };
  const endBullets = () => {
    if (bullets.length > 0) blocks.push({ type: 'list', items: bullets });
    bullets = [];
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (RUNS_ON.test(line) && lines[i + 1] && !BULLET.test(lines[i + 1])) line = `${line} ${lines[++i]}`;

    if (!line) {
      endRun();
      endBullets();
    } else if (BULLET.test(line)) {
      endRun();
      runAfterHeading = false;
      bullets.push(line.replace(BULLET, ''));
    } else if (
      isHeading(line) &&
      lines.slice(i + 1).some(Boolean) &&
      // Straight under a heading, it's that section's introduction
      // ("Location:" then "Close to everything:").
      !(runAfterHeading && run.length === 0 && bullets.length === 0)
    ) {
      endRun();
      endBullets();
      blocks.push({ type: 'heading', text: line.replace(/\s*:$/, '') });
      runAfterHeading = true;
    } else {
      endBullets();
      run.push(line);
    }
  }
  endRun();
  endBullets();
  return blocks;
}

/** A run of plain lines: a list when it's two or more points right under
 *  a heading, otherwise paragraphs, each ending at a sentence-ending line
 *  (so a signature or address block stays together, line by line). */
function runBlocks(run: string[], afterHeading: boolean): DescriptionBlock[] {
  if (afterHeading && run.length > 1 && run.every((line) => !SENTENCE_END.test(line))) {
    return [{ type: 'list', items: run }];
  }
  const blocks: DescriptionBlock[] = [];
  let para: string[] = [];
  for (const line of run) {
    para.push(line);
    if (SENTENCE_END.test(line)) {
      blocks.push({ type: 'paragraph', lines: para });
      para = [];
    }
  }
  if (para.length > 0) blocks.push({ type: 'paragraph', lines: para });
  return blocks;
}

/** A list point's leading label, as in "Council Rates: $1,600 p/a", so it
 *  can be shown in bold. Short labels only, so a sentence with a colon in
 *  it isn't caught. */
export function splitLabel(item: string): { label: string; rest: string } | undefined {
  const m = item.match(/^([^:]{2,40}):\s+(\S.*)$/);
  if (!m || m[1].split(/\s+/).length > 5) return undefined;
  return { label: `${m[1]}:`, rest: m[2] };
}

/** Web and email addresses and phone numbers in the text, so they can be
 *  links. `title`: a web address's full URL, for the link's tooltip, when
 *  the text shows a label instead. */
export type TextPart = { text: string; href?: string; title?: string };

/** Australian numbers: 1300/1800, mobiles and landlines, spaced or not. */
const PHONE = String.raw`\b(?:1[38]00\s?\d{3}\s?\d{3}|04\d{2}\s?\d{3}\s?\d{3}|0[2378]\s?\d{4}\s?\d{4})\b`;
const LINK = new RegExp(
  String.raw`\bhttps?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+\.[^\s<>"]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|${PHONE}`,
  'gi',
);

/** Short-link services, whose own name says nothing about where they go. */
const SHORTENER = /^(?:goo\.gl|forms\.gle|bit\.ly|tinyurl\.com|youtu\.be|ow\.ly)$/i;

/** "realestate.com.au" from "https://www.realestate.com.au/property-…". */
const domainOf = (url: string) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase();

/** What a web address in a description is shown as. Agents paste bare
 *  addresses, often 80 characters of query string or a goo.gl code that
 *  means nothing to a reader, so each is named by what it is: a video, an
 *  offer form, a map, or otherwise its site ("realestate.com.au").
 *  `target` is where a short link goes (looked up at build time), and
 *  `line` the text around it, which says what an unresolved short link is
 *  ("…the online offer form - https://goo.gl/Df8mbU"). */
export function linkLabel(url: string, target?: string, line = ''): string {
  const where = `${url} ${target ?? ''}`.toLowerCase();
  if (/(?:youtube\.com|youtu\.be|vimeo\.com)\//.test(where)) return 'Watch the video';
  if (/(?:google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(where)) return 'View on map';
  if (/(?:goo\.gl\/forms|forms\.gle|docs\.google\.com\/forms)\b|offer/.test(where)) return 'Make an offer online';
  const domain = domainOf(target ?? url);
  if (SHORTENER.test(domain)) {
    if (/\boffer/i.test(line)) return 'Make an offer online';
    if (/\bvideo/i.test(line)) return 'Watch the video';
    if (/\bmap\b/i.test(line)) return 'View on map';
  }
  return domain;
}

/** The text with its links picked out. `targets`: where the
 *  description's short links go (Listing.linkTargets), so they link
 *  straight there rather than through a redirect. */
export function linkParts(text: string, targets?: Record<string, string>): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    // Leave trailing punctuation ("see www.x.com.au.") out of the link.
    const found = m[0].replace(/[.,;:!?)\]'’]+$/, '');
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    if (/^[\d\s]+$/.test(found)) {
      // A phone number: tap to call, and never split across two lines.
      parts.push({ text: found.replace(/\s/g, ' '), href: `tel:${found.replace(/\s/g, '')}` });
    } else if (found.includes('@') && !/^https?:/i.test(found)) {
      parts.push({ text: found, href: `mailto:${found}` });
    } else {
      const url = /^www\./i.test(found) ? `https://${found}` : found;
      const label = linkLabel(url, targets?.[found], text);
      // "Make an offer online -" then the link: the label says it already.
      // Otherwise a dash leading into the link reads better as a colon
      // ("…the online offer form: Make an offer online").
      const before = parts[parts.length - 1];
      if (before && !before.href && last < start) {
        const lead = before.text.replace(/\s+[-–—:]?\s*$/, '');
        if (lead.trim().toLowerCase() === label.toLowerCase()) parts.pop();
        else if (/\s[-–—]\s*$/.test(before.text)) before.text = `${lead}: `;
      }
      parts.push({ text: label, href: targets?.[found] ?? url, title: url });
    }
    last = start + found.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** Dollar amounts in a price or line, as numbers: "$2.3M" → 2300000,
 *  "$640,000" → 640000, "$1.2k" → 1200. */
export function dollarAmounts(text: string): number[] {
  return [...text.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)\s?([MmKk])?(?![a-z])/g)].map((m) => {
    const n = Number.parseFloat(m[1].replace(/,/g, ''));
    const unit = m[2]?.toLowerCase();
    return unit === 'm' ? n * 1_000_000 : unit === 'k' ? n * 1000 : n;
  });
}

/** A first paragraph that only restates the price shown beside it
 *  ("Price guide of $2.3M."): short, and starting with "Price" or giving
 *  the same dollar figure as the listing's price. Left in when the
 *  listing shows no figure of its own (a hidden price, "Contact agent"),
 *  since then the description is the only place it's said. */
function restatesPrice(block: DescriptionBlock | undefined, price: string | undefined): boolean {
  if (!block || block.type !== 'paragraph' || !price) return false;
  const line = block.lines.join(' ');
  if (line.length >= 80) return false;
  const priceAmounts = dollarAmounts(price);
  if (priceAmounts.length === 0) return false;
  return /^price\b/i.test(line) || dollarAmounts(line).some((n) => priceAmounts.includes(n));
}

/** The description's blocks as the page shows them: parseDescription,
 *  less a first paragraph that only repeats the listing's price. */
export function descriptionBlocks(text: string, price?: string): DescriptionBlock[] {
  const blocks = parseDescription(text);
  return restatesPrice(blocks[0], price) ? blocks.slice(1) : blocks;
}

/** A plain summary of the description for structured data: its
 *  sentences (not headings, lists, short lines such as video titles and
 *  signatures, or lines with web or email addresses), cut at a word to
 *  about `max` characters. */
export function descriptionSummary(text: string, price?: string, max = 300): string {
  const lines = descriptionBlocks(text, price)
    .flatMap((b) => (b.type === 'paragraph' ? b.lines : []))
    // A line with a web or email address in it is a call to action
    // ("make an offer at…"), not part of the summary.
    .filter((line) => !/\bhttps?:\/\/|\bwww\.|[\w.+-]+@[\w-]+\.[\w-]/i.test(line))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 60);
  let out = '';
  for (const line of lines) {
    out = out ? `${out} ${line}` : line;
    if (out.length >= max) break;
  }
  if (out.length <= max) return out;
  return `${out.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:–—-]$/, '')}…`;
}
