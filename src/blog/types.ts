// Shared by the build-time loader (load-posts.ts) and the pages, so it
// must stay free of Node imports — the browser bundle imports it too.

export interface PostMeta {
  slug: string;
  title: string;
  /** Shorter title for the <title> tag and social shares, when `title`
   *  (the page heading) is too long for them. */
  seoTitle?: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** ISO date, YYYY-MM-DD. Set when a post has been meaningfully revised. */
  updated?: string;
  /** Matches a name in src/data/team.ts, or omitted for "APN Real Estate". */
  author?: string;
  /** Absolute path under public/, e.g. /blog-images/bond-guide.jpg. */
  image?: string;
  imageAlt?: string;
  readingMinutes: number;
  draft: boolean;
}

export interface Post extends PostMeta {
  html: string;
}

/** Embedded in each blog page as JSON so the browser can hydrate the
 *  pre-rendered markup. A post's body isn't included — the browser reads
 *  it back from the page instead of downloading it twice. */
export type BlogPageData =
  | { kind: 'index'; posts: PostMeta[] }
  | { kind: 'post'; post: PostMeta; related: PostMeta[] };

export const BLOG_DATA_ID = 'blog-data';
export const POST_BODY_ID = 'post-body';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "28 September 2026". Done by hand rather than with Intl so the
 *  server-rendered and hydrated text can't differ. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
