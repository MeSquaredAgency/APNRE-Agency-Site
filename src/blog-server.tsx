// Build-time renderer for the blog (moved here from the landing page
// repo). Turns the Markdown posts in content/blog/ into complete HTML
// pages, so each article's text is in the page itself, which is what
// makes the blog useful for search. Used by scripts/prerender.mjs after
// `vite build`, and by the dev server (blogDevServer() in
// vite.config.ts). The browser side is src/blog-main.tsx. See
// docs/blog.md.

import { renderToString } from 'react-dom/server';
import BlogIndexPage from './blog/BlogIndexPage';
import BlogPostPage from './blog/BlogPostPage';
import { loadPosts } from './blog/load-posts';
import { BLOG_DATA_ID, type BlogPageData, type Post, type PostMeta } from './blog/types';
import { TEAM, teamMemberId } from './data/team';
import { PathContext } from './lib/route';
import { breadcrumbList, ORGANIZATION_REF, SITE, scriptJson, WEBSITE_ID } from './structured-data';

// A post without its own image uses the home page's link preview
// (scripts/og-images.mjs).
const DEFAULT_IMAGE = `${SITE}/og/home.jpg`;
const DEFAULT_IMAGE_ALT = 'Aerial view of Adelaide’s city skyline and the River Torrens';
const RELATED_COUNT = 3;

export interface RenderedPage {
  /** e.g. /blog/ or /blog/rental-bond-guide/ */
  path: string;
  html: string;
  /** False for pages that must stay out of search and the sitemap. */
  indexable: boolean;
  lastmod?: string;
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function absolute(path: string): string {
  return path.startsWith('http') ? path : `${SITE}${path}`;
}

function toMeta({ html: _html, ...meta }: Post): PostMeta {
  return meta;
}

interface HeadOptions {
  title: string;
  description: string;
  path: string;
  indexable: boolean;
  ogType: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  extra?: string;
  jsonLd: unknown[];
  data: BlogPageData;
}

function head(o: HeadOptions): string {
  const url = `${SITE}${o.path}`;
  const image = o.image ? absolute(o.image) : DEFAULT_IMAGE;
  const imageAlt = o.image ? (o.imageAlt ?? '') : DEFAULT_IMAGE_ALT;
  return [
    `<title>${esc(o.title)}</title>`,
    `<meta name="description" content="${esc(o.description)}" />`,
    `<meta name="robots" content="${o.indexable ? 'index, follow' : 'noindex'}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${o.ogType}" />`,
    `<meta property="og:site_name" content="APN Real Estate" />`,
    `<meta property="og:title" content="${esc(o.title)}" />`,
    `<meta property="og:description" content="${esc(o.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}" />` : '',
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="en_AU" />`,
    o.extra ?? '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...o.jsonLd.map((ld) => `<script type="application/ld+json">${scriptJson(ld)}</script>`),
    `<script type="application/json" id="${BLOG_DATA_ID}">${scriptJson(o.data)}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

function breadcrumbs(items: [name: string, path: string][]) {
  return breadcrumbList(items.map(([name, path]) => ({ name, path })));
}

function fill(template: string, headHtml: string, appHtml: string): string {
  // Function replacements, so a "$" in a post can't be read as a
  // replacement pattern.
  return template.replace('<!-- blog-head -->', () => headHtml).replace('<!-- app -->', () => appHtml);
}

function render(path: string, page: JSX.Element): string {
  return renderToString(<PathContext.Provider value={path}>{page}</PathContext.Provider>);
}

/** Every blog page, rendered into `template` (blog/index.html after Vite
 *  has processed it, so its script and stylesheet links are in). */
export function renderBlogPages(template: string, { includeDrafts = false } = {}): RenderedPage[] {
  const posts = loadPosts({ includeDrafts });
  const metas = posts.map(toMeta);
  const pages: RenderedPage[] = [];

  // An empty blog stays out of search until the first post is published.
  const indexData: BlogPageData = { kind: 'index', posts: metas };
  const indexIndexable = posts.some((p) => !p.draft);
  pages.push({
    path: '/blog/',
    indexable: indexIndexable,
    lastmod: metas.find((p) => !p.draft)?.date,
    html: fill(
      template,
      head({
        title: 'Property Advice & Guides | APN Real Estate',
        description:
          'Practical guides on renting, selling and managing property in Adelaide and Mount Gambier, from the APN Real Estate team.',
        path: '/blog/',
        indexable: indexIndexable,
        ogType: 'website',
        data: indexData,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'APN Real Estate Blog',
            url: `${SITE}/blog/`,
            publisher: ORGANIZATION_REF,
          },
          breadcrumbs([
            ['Home', '/'],
            ['Blog', '/blog/'],
          ]),
        ],
      }),
      render('/blog/', <BlogIndexPage posts={metas} />),
    ),
  });

  for (const post of posts) {
    const meta = toMeta(post);
    const related = metas.filter((p) => p.slug !== post.slug).slice(0, RELATED_COUNT);
    const path = `/blog/${post.slug}/`;
    const author = TEAM.find((m) => m.name === post.author);
    const indexable = !post.draft;

    pages.push({
      path,
      indexable,
      lastmod: post.updated ?? post.date,
      html: fill(
        template,
        head({
          title: `${post.seoTitle ?? post.title} | APN Real Estate`,
          description: post.description,
          path,
          indexable,
          ogType: 'article',
          image: post.image,
          imageAlt: post.imageAlt,
          extra: [
            `<meta property="article:published_time" content="${post.date}" />`,
            post.updated ? `<meta property="article:modified_time" content="${post.updated}" />` : '',
          ]
            .filter(Boolean)
            .join('\n    '),
          data: { kind: 'post', post: meta, related },
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              datePublished: post.date,
              dateModified: post.updated ?? post.date,
              image: post.image ? absolute(post.image) : DEFAULT_IMAGE,
              mainEntityOfPage: `${SITE}${path}`,
              // The same @id as this person on /our-people/, so search
              // engines connect the article to the team member.
              author: author
                ? {
                    '@type': 'Person',
                    '@id': `${SITE}/our-people/#${teamMemberId(author.name)}`,
                    name: author.name,
                    jobTitle: author.role,
                    url: `${SITE}/our-people/${teamMemberId(author.name)}/`,
                    worksFor: ORGANIZATION_REF,
                  }
                : ORGANIZATION_REF,
              publisher: ORGANIZATION_REF,
              url: `${SITE}${path}`,
              inLanguage: 'en-AU',
              isPartOf: { '@id': WEBSITE_ID },
            },
            breadcrumbs([
              ['Home', '/'],
              ['Blog', '/blog/'],
              [post.title, path],
            ]),
          ],
        }),
        render(path, <BlogPostPage post={meta} bodyHtml={post.html} related={related} />),
      ),
    });
  }

  return pages;
}
