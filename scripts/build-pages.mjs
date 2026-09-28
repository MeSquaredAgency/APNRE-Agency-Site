// Writes one index.html per route in src/data/routes.json, plus
// public/sitemap.xml. Every page is a real file at its own path, so
// Cloudflare Pages serves it directly and any other path gets the real
// 404 (public/404.html). Runs before `dev` and `build`; the generated
// files are gitignored, so edit routes.json (or the template below),
// never the output.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOgImages, OG_DEFAULT, OG_PHOTOS } from './og-images.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://apnre.com.au';
const routes = JSON.parse(readFileSync(join(ROOT, 'src/data/routes.json'), 'utf8'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Only details verified elsewhere on the site (src/data/business.ts and
// offices.ts): the two office addresses and the phone number. No ratings
// or review counts.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'APN Real Estate',
  alternateName: 'Adelaide Property Network',
  url: `${SITE}/`,
  telephone: '+61-1300-123-276',
  areaServed: ['Adelaide SA', 'Mount Gambier SA'],
  location: [
    {
      '@type': 'Place',
      name: 'APN Real Estate — Adelaide',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Level 1 / 420B, Cnr Main North Road and Barton Street',
        addressLocality: 'Blair Athol',
        addressRegion: 'SA',
        postalCode: '5084',
        addressCountry: 'AU',
      },
    },
    {
      '@type': 'Place',
      name: 'APN Real Estate — Mount Gambier',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '178 Commercial Street East',
        addressLocality: 'Mount Gambier',
        addressRegion: 'SA',
        postalCode: '5290',
        addressCountry: 'AU',
      },
    },
  ],
};

function html(route) {
  const url = SITE + route.path;
  const title = esc(route.title);
  const description = esc(route.description);
  const jsonLd =
    route.page === 'home' || route.page === 'contact'
      ? `    <script type="application/ld+json">${JSON.stringify(JSON_LD)}</script>\n`
      : '';
  const og = OG_PHOTOS[route.page] ?? OG_DEFAULT;
  const ogImage = `${SITE}/og/${route.page}.jpg`;
  // The home hero's poster is its largest image, so fetch it straight away.
  const preload =
    route.page === 'home'
      ? `    <link rel="preload" as="image" href="/video/adelaide-aerial-poster.jpg" fetchpriority="high" />\n`
      : '';
  return `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- shared-head -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${route.noindex ? 'noindex' : 'index, follow'}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="APN Real Estate" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(og.alt)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="en_AU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${esc(og.alt)}" />
${preload}${jsonLd}    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <!-- shared-body -->
    <div id="root" data-page="${route.page}"><!-- app --></div>
  </body>
</html>
`;
}

for (const route of routes) {
  const dir = join(ROOT, route.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html(route));
}

const urls = routes
  .filter((r) => !r.noindex)
  .map((r) => `  <url><loc>${SITE}${r.path}</loc></url>`)
  .join('\n');
writeFileSync(
  join(ROOT, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

await buildOgImages(routes.map((r) => r.page));

console.log(`Generated ${routes.length} pages, their link-preview images and public/sitemap.xml`);
