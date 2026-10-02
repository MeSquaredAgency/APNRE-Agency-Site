// Last step of `npm run build`. Uses the server build of src/server.tsx
// (dist-ssr/server.js) to:
//   1. fill each page's dist/<path>/index.html with its rendered markup,
//      in place of the <!-- app --> marker inside #root;
//   2. write every blog page from the blog template (src/blog-server.tsx);
//   3. write dist/sitemap.xml: indexable pages and published posts, each
//      with a <lastmod>;
//   4. add <link rel="modulepreload"> tags for each page's own code, so
//      the browser fetches it with the entry script instead of only
//      finding it once the entry has run;
// then removes dist-ssr/ and Vite's manifest. (The blog template, dist/blog/index.html, is
// overwritten by the rendered /blog/ page.)

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allRoutes } from './routes.mjs';

const SITE = 'https://apnre.com.au';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const routes = allRoutes();
const { renderPage, renderBlogPages } = await import(pathToFileURL(join(ssrDir, 'server.js')).href);

// Each page's own module, for its modulepreload tags and its <lastmod>.
const PAGE_FILES = {
  home: 'src/pages/Home.tsx',
  selling: 'src/pages/Selling.tsx',
  leasing: 'src/pages/Leasing.tsx',
  buy: 'src/pages/Listings.tsx',
  rent: 'src/pages/Listings.tsx',
  sold: 'src/pages/Listings.tsx',
  appraisal: 'src/pages/Appraisal.tsx',
  'appraisal-sales': 'src/pages/Appraisal.tsx',
  'appraisal-rental': 'src/pages/Appraisal.tsx',
  people: 'src/pages/People.tsx',
  person: 'src/pages/Person.tsx',
  story: 'src/pages/Story.tsx',
  contact: 'src/pages/Contact.tsx',
  careers: 'src/pages/Careers.tsx',
  hub: 'src/pages/Hubs.tsx',
  'hub-landlords': 'src/pages/Hubs.tsx',
  'hub-tenants': 'src/pages/Hubs.tsx',
  'hub-sellers': 'src/pages/Hubs.tsx',
  'hub-buyers': 'src/pages/Hubs.tsx',
  privacy: 'src/pages/Privacy.tsx',
  listing: 'src/pages/Listing.tsx',
};

// Vite's manifest: source file → built chunk, its static imports and the
// chunks it loads on demand (build.manifest in vite.config.ts).
const manifestFile = join(dist, '.vite', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));

/** A chunk and everything it statically imports, as manifest keys. */
function closure(key, seen = new Set()) {
  if (seen.has(key) || !manifest[key]) return seen;
  seen.add(key);
  for (const dep of manifest[key].imports ?? []) closure(dep, seen);
  return seen;
}

// The main site's entry (src/main.tsx) already preloads its own imports;
// a page only needs what its module adds on top. Every page's HTML shares
// that script, so Vite lists it as a chunk rather than by its source
// path: it's the one that loads the pages on demand.
const mainEntry = Object.keys(manifest).find((key) => manifest[key].dynamicImports?.includes(PAGE_FILES.home));
if (!mainEntry) throw new Error('No chunk in the Vite manifest loads src/pages/Home.tsx; has src/main.tsx changed?');
const entryChunks = closure(mainEntry);

function preloadTags(page) {
  const source = PAGE_FILES[page];
  if (!source || !manifest[source]) return '';
  return [...closure(source)]
    .filter((key) => !entryChunks.has(key))
    .map((key) => `    <link rel="modulepreload" crossorigin href="/${manifest[key].file}">\n`)
    .join('');
}

for (const route of routes) {
  const file = join(dist, route.path, 'index.html');
  let html = readFileSync(file, 'utf8');
  if (!html.includes('<!-- app -->')) throw new Error(`${route.path}: no <!-- app --> marker in ${file}`);
  const markup = await renderPage(route.page, route.path);
  // Funnel pages have their own entry, which imports its page directly.
  if (!route.funnel) html = html.replace('</head>', () => `${preloadTags(route.page)}  </head>`);
  // Function replacement, so a "$" in the content can't be read as a
  // replacement pattern.
  writeFileSync(file, html.replace('<!-- app -->', () => markup));
}

const templateFile = join(dist, 'blog', 'index.html');
const blogPages = renderBlogPages(readFileSync(templateFile, 'utf8'));
for (const page of blogPages) {
  const file = join(dist, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page.html);
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// A page's <lastmod> is the date of the last commit touching the files
// it's built from (its page file plus the shared components, data and
// styles), so the build needs the full git history. Cloudflare Pages
// clones only the latest commit, and in a shallow clone that one commit
// looks like it added every file, so every page would get its date. So
// fetch the rest of the history first. If that fails, or there's no git
// at all, leave those pages' <lastmod> out (with a warning) rather than
// give a wrong date. Blog pages use the dates in their front matter.
function hasFullHistory() {
  let reason = 'git fetch --unshallow left the clone shallow';
  try {
    if (git('rev-parse', '--is-shallow-repository') !== 'true') return true;
    console.log('Sitemap: shallow clone, fetching full git history for <lastmod>...');
    git('fetch', '--unshallow', '--quiet');
    if (git('rev-parse', '--is-shallow-repository') !== 'true') return true;
  } catch (err) {
    reason = String(err.message).split('\n')[0];
  }
  console.warn(`Sitemap: no full git history (${reason}), leaving <lastmod> out for static pages.`);
  return false;
}

const today = new Date().toISOString().slice(0, 10);
const SHARED = ['src/components', 'src/data', 'src/index.css'];
const fullHistory = hasFullHistory();
// Files that aren't committed yet have no log, which means they're being
// changed today.
function lastCommitDate(paths) {
  if (!fullHistory) return undefined;
  const date = git('log', '-1', '--format=%cs', '--', ...paths);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
}

const urls = [
  ...routes
    .filter((r) => !r.noindex)
    // A listing's <lastmod> is when the feed last changed it.
    .map((r) => ({ path: r.path, lastmod: r.lastmod ?? lastCommitDate([PAGE_FILES[r.page] ?? 'src/pages', ...SHARED]) })),
  ...blogPages.filter((p) => p.indexable).map((p) => ({ path: p.path, lastmod: p.lastmod ?? today })),
];
writeFileSync(
  join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${SITE}${u.path}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
          '  </url>\n',
      )
      .join('') +
    '</urlset>\n',
);

rmSync(ssrDir, { recursive: true, force: true });
rmSync(join(dist, '.vite'), { recursive: true, force: true });

const posts = blogPages.filter((p) => p.indexable && p.path !== '/blog/').length;
console.log(`Pre-rendered ${routes.length} pages and ${blogPages.length} blog page(s) (${posts} published post(s)).`);
console.log(`Sitemap: ${urls.length} URLs.`);
