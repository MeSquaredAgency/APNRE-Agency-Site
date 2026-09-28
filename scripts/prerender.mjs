// Last step of `npm run build`. Uses the server build of src/server.tsx
// (dist-ssr/server.js) to:
//   1. fill each page's dist/<path>/index.html with its rendered markup,
//      in place of the <!-- app --> marker inside #root;
//   2. write every blog page from the blog template (src/blog-server.tsx);
//   3. write dist/sitemap.xml: indexable pages and published posts, each
//      with a <lastmod>;
// then removes dist-ssr/. (The blog template, dist/blog/index.html, is
// overwritten by the rendered /blog/ page.)

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE = 'https://apnre.com.au';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const routes = JSON.parse(readFileSync(join(root, 'src/data/routes.json'), 'utf8'));
const { renderPage, renderBlogPages } = await import(pathToFileURL(join(ssrDir, 'server.js')).href);

for (const route of routes) {
  const file = join(dist, route.path, 'index.html');
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<!-- app -->')) throw new Error(`${route.path}: no <!-- app --> marker in ${file}`);
  const markup = await renderPage(route.page, route.path);
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

// A page's <lastmod> is the date of the last commit touching the files
// it's built from (its page file plus the shared components, data and
// styles). Without git history, falls back to today.
const today = new Date().toISOString().slice(0, 10);
const SHARED = ['src/components', 'src/data', 'src/index.css'];
const PAGE_FILES = {
  home: 'src/pages/Home.tsx',
  selling: 'src/pages/Selling.tsx',
  leasing: 'src/pages/Leasing.tsx',
  buy: 'src/pages/Listings.tsx',
  rent: 'src/pages/Listings.tsx',
  sold: 'src/pages/Listings.tsx',
  appraisal: 'src/pages/Appraisal.tsx',
  people: 'src/pages/People.tsx',
  story: 'src/pages/Story.tsx',
  contact: 'src/pages/Contact.tsx',
  careers: 'src/pages/Careers.tsx',
  hub: 'src/pages/Hubs.tsx',
  'hub-landlords': 'src/pages/Hubs.tsx',
  'hub-tenants': 'src/pages/Hubs.tsx',
  'hub-sellers': 'src/pages/Hubs.tsx',
  'hub-buyers': 'src/pages/Hubs.tsx',
  privacy: 'src/pages/Privacy.tsx',
};
function lastCommitDate(paths) {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], { cwd: root, encoding: 'utf8' }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
  } catch {
    return today;
  }
}

const urls = [
  ...routes
    .filter((r) => !r.noindex)
    .map((r) => ({ path: r.path, lastmod: lastCommitDate([PAGE_FILES[r.page] ?? 'src/pages', ...SHARED]) })),
  ...blogPages.filter((p) => p.indexable).map((p) => ({ path: p.path, lastmod: p.lastmod ?? today })),
];
writeFileSync(
  join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url>\n    <loc>${SITE}${u.path}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>\n`).join('') +
    '</urlset>\n',
);

rmSync(ssrDir, { recursive: true, force: true });

const posts = blogPages.filter((p) => p.indexable && p.path !== '/blog/').length;
console.log(`Pre-rendered ${routes.length} pages and ${blogPages.length} blog page(s) (${posts} published post(s)).`);
console.log(`Sitemap: ${urls.length} URLs.`);
