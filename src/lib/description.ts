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
    .map((line) => (/^[-–—_*=~•.]{3,}$/.test(line) ? '' : line));

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

/** Web and email addresses in the text, so they can be links. */
export type TextPart = { text: string; href?: string };

const LINK = /\bhttps?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+\.[^\s<>"]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi;

export function linkParts(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    // Leave trailing punctuation ("see www.x.com.au.") out of the link.
    const found = m[0].replace(/[.,;:!?)\]'’]+$/, '');
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    const href = found.includes('@') && !/^https?:/i.test(found)
      ? `mailto:${found}`
      : /^www\./i.test(found)
        ? `https://${found}`
        : found;
    parts.push({ text: found, href });
    last = start + found.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
