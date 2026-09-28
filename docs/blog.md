# Blog: /blog/

Articles for landlords, there to bring in search traffic and turn it
into appraisal requests. Every post ends with the appraisal form.

Unlike the rest of the site, blog pages are built as finished HTML. The
article text is in the page itself, not filled in by JavaScript, so
search engines read it straight away.

## Adding a post

1. Copy `content/blog/_template.md` to a new file in the same folder.
   The file name becomes the address:
   `rental-bond-guide.md` → `apnre.com.au/blog/rental-bond-guide/`.
   Lowercase words and hyphens only. Don't rename a published post
   without adding a redirect to `public/_redirects`, because its
   address would break.
2. Fill in the settings at the top (between the `---` lines) and write
   the post in Markdown below them. The template explains each setting
   and shows the formatting.
3. Keep `draft: true` while writing. Run `npm run dev` and open
   `http://localhost:5173/blog/` to preview. Drafts show there with a
   "Draft" label but are never built into the live site.
4. When it's ready, delete the `draft: true` line, commit and push.
   Cloudflare Pages rebuilds, and the post goes live and into the sitemap.

The build stops with a message naming the file if a post is missing its
title, description or date, has a bad file name, or uses a `# ` heading
(the title is already the page's heading, so start sections at `## `).

## Photos

Put them in `public/blog-images/` and refer to them as
`/blog-images/<file>`, both for the `image:` setting (the photo at the
top, also used when the post is shared on Facebook) and inside the post.
A 1200×675 (16:9) JPEG under about 300 KB works well. Same rules as the
rest of the site: real APN photography, no stock or AI-generated people,
and no occupied interiors.

## Authors

`author:` must match a name in `src/data/team.ts` exactly. The post then
shows that person's name, role and photo, which also helps Google trust
the article. Leave it out to credit "APN Real Estate".

## Writing for search

- One topic per post, aimed at a question a landlord would type into
  Google ("how much bond can I charge in SA", "switching property
  managers mid-lease").
- Put that phrase in the title and the first paragraph, and answer it
  early. If the title is too long for Google (over about 60
  characters), set a shorter `seoTitle:` for search and shares.
- Don't aim a post at the same phrase as an office page ("property
  management Adelaide"): the two compete in Google. Aim posts at
  questions, and link to the office page instead.
- Link to the homepage form (`/#appraisal`), the office pages and other
  posts where it's natural.
- Rules and figures (bond limits, notice periods, rent increase rules)
  need to be correct for South Australia now. Link to the source, e.g.
  Consumer and Business Services (sa.gov.au), and set `updated:` when you
  revise a post after the rules change.
- The same copy rules as the rest of the site apply: no claims about APN
  that can't be backed up, and no knocking competitors.

## Where things live

| What | Where |
| --- | --- |
| Posts | `content/blog/*.md` |
| Post photos | `public/blog-images/` |
| Blog index page | `src/blog/BlogIndexPage.tsx` |
| Post page layout | `src/blog/BlogPostPage.tsx`, `src/blog/PostCard.tsx` |
| Titles, meta tags, structured data | `src/blog-server.tsx` |
| Reading and checking posts | `src/blog/load-posts.ts` |
| Writing the pages at build time | `scripts/prerender.mjs` |
| Styles | "Blog" section at the end of `src/index.css` |

`npm run build` runs in three steps: the normal Vite build, a server
build of `src/server.tsx`, then `scripts/prerender.mjs`. That
script writes `dist/blog/…/index.html` for every published post and adds
them to `dist/sitemap.xml`, which is generated at build time: there's
no sitemap file to edit by hand.

Until the first post is published, `/blog/` is marked `noindex` and
left out of the sitemap. The main menu and footer always link to it
(About Us → Blog); the landlord page's footer only links to it once a
post is published.
