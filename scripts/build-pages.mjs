// Writes one index.html per route in src/data/routes.json, the blog
// template (blog/index.html, filled in per post by scripts/prerender.mjs
// and the dev server) and each page's link-preview image. Every page is a
// real file at its own path, so Cloudflare Pages serves it directly and
// any other path gets the real 404 (public/404.html). Runs before `dev`
// and `build`; the generated files are gitignored, so edit routes.json
// (or the templates below), never the output. The sitemap is written
// after the build by scripts/prerender.mjs, once the blog posts are known.
//
// A route with "site": "landlords" is part of the landlord campaign
// (src/landlords/): it gets that entry script, its self-hosted fonts and
// its own link-preview image. Everything else is the main site.
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
// or review counts. The @id is what blog posts point at as their
// publisher (src/structured-data.ts).
// Both offices: Monday to Saturday, 8:30am to 5:00pm (OPENING_HOURS in
// src/data/business.ts).
const HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:30',
    closes: '17:00',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE}/#organization`,
  name: 'APN Real Estate',
  alternateName: 'Adelaide Property Network',
  url: `${SITE}/`,
  logo: `${SITE}/apple-touch-icon.png`,
  telephone: '+61-1300-123-276',
  areaServed: ['Adelaide SA', 'Mount Gambier SA'],
  openingHoursSpecification: HOURS,
  location: [
    {
      '@type': 'Place',
      openingHoursSpecification: HOURS,
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
      openingHoursSpecification: HOURS,
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

// The landlord campaign keeps the preview image it had as the landing
// page: its own headline, made for ads and shares.
const LANDLORDS_OG = {
  image: `${SITE}/landlords-og.jpg`,
  alt: 'APN Real Estate: your property is an asset, we manage it like one. Property management for landlords across Adelaide and Mount Gambier.',
};

const ENTRIES = { main: '/src/main.tsx', landlords: '/src/landlords/main.tsx', blog: '/src/blog-main.tsx' };

/** Everything after the shared head: fonts marker, then per-page tags. */
function shell({ entry, fonts, headTags, rootAttrs = '' }) {
  return `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- shared-head -->
    <!-- fonts-${fonts} -->
${headTags}    <script type="module" src="${entry}"></script>
  </head>
  <body>
    <!-- shared-body -->
    <div id="root"${rootAttrs}><!-- app --></div>
  </body>
</html>
`;
}

function html(route) {
  const url = SITE + route.path;
  const title = esc(route.title);
  const description = esc(route.description);
  const landlords = route.site === 'landlords';
  const og = landlords ? LANDLORDS_OG : { image: `${SITE}/og/${route.page}.jpg`, alt: (OG_PHOTOS[route.page] ?? OG_DEFAULT).alt };
  const jsonLd =
    route.page === 'home' || route.page === 'contact'
      ? `    <script type="application/ld+json">${JSON.stringify(JSON_LD)}</script>\n`
      : '';
  // The home hero's poster is its largest image, so fetch it straight away.
  const preload =
    route.page === 'home'
      ? `    <link rel="preload" as="image" href="/video/adelaide-aerial-poster.jpg" fetchpriority="high" />\n`
      : '';
  const headTags = `    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${route.noindex ? 'noindex' : 'index, follow'}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="APN Real Estate" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${og.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(og.alt)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="en_AU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${og.image}" />
    <meta name="twitter:image:alt" content="${esc(og.alt)}" />
${preload}${jsonLd}`;
  return shell({
    entry: landlords ? ENTRIES.landlords : ENTRIES.main,
    fonts: landlords ? 'landlords' : 'agency',
    headTags,
    rootAttrs: ` data-page="${route.page}"`,
  });
}

for (const route of routes) {
  const dir = join(ROOT, route.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html(route));
}

// Template for every /blog/ page, not a page in its own right: the
// blog-head marker gets each page's title, meta tags and structured data,
// and the app marker its rendered content (src/blog-server.tsx). Posts
// live in content/blog/; see docs/blog.md.
mkdirSync(join(ROOT, 'blog'), { recursive: true });
writeFileSync(
  join(ROOT, 'blog/index.html'),
  shell({ entry: ENTRIES.blog, fonts: 'agency', headTags: '    <!-- blog-head -->\n' }),
);

await buildOgImages(routes.filter((r) => r.site !== 'landlords').map((r) => r.page));

console.log(`Generated ${routes.length} pages, the blog template and their link-preview images`);
