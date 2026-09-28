// Build-time only (Node): reads the Markdown posts in content/blog/.
// Used by src/blog-server.tsx when pre-rendering the blog pages and by
// vite.config.ts. Never import this from browser code.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import type { Post } from './types';

export const POSTS_DIR = resolve(process.cwd(), 'content/blog');

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WORDS_PER_MINUTE = 220;

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const markdown = new Marked({
  renderer: {
    // Lazy-load post images, and turn a Markdown image title
    // (![alt](/x.jpg "Caption")) into a visible caption.
    image({ href, title, text }) {
      const img = `<img src="${escapeAttr(href)}" alt="${escapeAttr(text)}" loading="lazy" />`;
      return title ? `<figure>${img}<figcaption>${escapeAttr(title)}</figcaption></figure>` : img;
    },
  },
});

/** gray-matter parses unquoted YAML dates into Date objects. */
function toIsoDate(value: unknown, field: string, file: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error(`${file}: "${field}" must be a date like 2026-09-28`);
}

function requireString(data: Record<string, unknown>, field: string, file: string): string {
  const value = data[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: "${field}" is required`);
  return value.trim();
}

function optionalString(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Every post, newest first. Files starting with "_" (like the template)
 *  are skipped; drafts only come back when `includeDrafts` is set, which
 *  the dev server does so they can be previewed. Throws on a malformed
 *  post so a mistake fails the build instead of shipping. */
export function loadPosts({ includeDrafts = false } = {}): Post[] {
  let files: string[];
  try {
    files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  } catch {
    return [];
  }

  const posts = files.map((file): Post => {
    const slug = file.replace(/\.md$/, '');
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`${file}: file names must be lowercase words joined by hyphens, e.g. rental-bond-guide.md`);
    }

    const { data, content } = matter(readFileSync(join(POSTS_DIR, file), 'utf8'));
    if (/^#\s/m.test(content)) {
      throw new Error(`${file}: don't use "# " headings in the post body — the title is already the page's heading. Start sections with "## ".`);
    }

    const image = optionalString(data, 'image');
    const imageAlt = optionalString(data, 'imageAlt');
    if (image && !imageAlt) throw new Error(`${file}: "imageAlt" is required when "image" is set`);

    return {
      slug,
      title: requireString(data, 'title', file),
      seoTitle: optionalString(data, 'seoTitle'),
      description: requireString(data, 'description', file),
      date: toIsoDate(data.date, 'date', file),
      updated: data.updated ? toIsoDate(data.updated, 'updated', file) : undefined,
      author: optionalString(data, 'author'),
      image,
      imageAlt,
      draft: data.draft === true,
      readingMinutes: Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE)),
      html: markdown.parse(content, { async: false }),
    };
  });

  return posts
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
