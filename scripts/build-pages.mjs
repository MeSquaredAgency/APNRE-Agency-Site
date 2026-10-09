// Writes one index.html per route in src/data/routes.json and per
// listing (scripts/routes.mjs), the blog
// template (blog/index.html, filled in per post by scripts/prerender.mjs
// and the dev server) and each page's link-preview image. Every page is a
// real file at its own path, so Cloudflare Pages serves it directly and
// any other path gets the real 404 (public/404.html). Runs before `dev`
// and `build`; the generated files are gitignored, so edit routes.json
// (or the templates below), never the output. The sitemap is written
// after the build by scripts/prerender.mjs, once the blog posts are known.
//
// A route with "funnel": "<id>" is a campaign funnel page for ad traffic
// (src/data/funnels.json, docs/funnels.md): it gets that funnel's entry
// script and link-preview image, and a data-funnel attribute on <html>
// (the Meta Pixel loads straight away there; src/partials/head-shared.html).
// Everything else is the main site.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOgImages, OG_DEFAULT, OG_PHOTOS } from './og-images.mjs';
import { allRoutes } from './routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://apnre.com.au';
const routes = allRoutes();
const { origin: FUNNEL_ORIGIN, funnels } = JSON.parse(readFileSync(join(ROOT, 'src/data/funnels.json'), 'utf8'));
const FUNNELS = Object.fromEntries(funnels.map((f) => [f.id, f]));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Only details verified elsewhere on the site (src/data/business.ts and
// offices.ts): the two office addresses, the phone number, the hours and
// the registration numbers. No ratings or review counts, and no map
// coordinates until someone confirms them. The @ids are what other
// structured data points at: blog posts as their publisher, /our-people/
// for each person's office (src/structured-data.ts).
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

const ORG_ID = `${SITE}/#organization`;
// Must match OFFICE_SCHEMA_IDS in src/structured-data.ts.
const OFFICE_IDS = { adelaide: `${SITE}/#office-adelaide`, 'mount-gambier': `${SITE}/#office-mount-gambier` };
// REA_PROFILE_URL in src/data/business.ts. Add the Google Business
// Profiles and social accounts here once confirmed.
const SAME_AS = ['https://www.realestate.com.au/agency/adelaide-property-network-blair-athol-JIASZF'];

const office = ({ id, name, alternateName, street, locality, postcode, city, mapsQuery }) => ({
  '@type': 'RealEstateAgent',
  '@id': OFFICE_IDS[id],
  name,
  alternateName,
  url: `${SITE}/contact/#${id}`,
  telephone: '+61-1300-123-276',
  parentOrganization: { '@id': ORG_ID },
  address: {
    '@type': 'PostalAddress',
    streetAddress: street,
    addressLocality: locality,
    addressRegion: 'SA',
    postalCode: postcode,
    addressCountry: 'AU',
  },
  hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
  areaServed: { '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: 'South Australia' } },
  openingHoursSpecification: HOURS,
});

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'APN Real Estate',
      alternateName: ['Adelaide Property Network', 'Mount Gambier Property Network', 'APN'],
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/apple-touch-icon.png` },
      telephone: '+61-1300-123-276',
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'ACN', value: '164 181 971' },
        { '@type': 'PropertyValue', propertyID: 'RLA', value: '255336' },
      ],
      sameAs: SAME_AS,
      subOrganization: [{ '@id': OFFICE_IDS.adelaide }, { '@id': OFFICE_IDS['mount-gambier'] }],
    },
    office({
      id: 'adelaide',
      name: 'APN Real Estate — Adelaide',
      alternateName: 'Adelaide Property Network',
      street: 'Level 1 / 420B, Cnr Main North Road and Barton Street',
      locality: 'Blair Athol',
      postcode: '5084',
      city: 'Adelaide',
      mapsQuery: '420B Main North Road, Blair Athol SA 5084',
    }),
    office({
      id: 'mount-gambier',
      name: 'APN Real Estate — Mount Gambier',
      alternateName: 'Mount Gambier Property Network',
      street: '178 Commercial Street East',
      locality: 'Mount Gambier',
      postcode: '5290',
      city: 'Mount Gambier',
      mapsQuery: '178 Commercial Street East, Mount Gambier SA 5290',
    }),
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'APN Real Estate',
      alternateName: ['Adelaide Property Network', 'APN'],
      inLanguage: 'en-AU',
      publisher: { '@id': ORG_ID },
    },
  ],
};

const ENTRIES = { main: '/src/main.tsx', blog: '/src/blog-main.tsx' };

/** Everything after the shared head: fonts marker, then per-page tags. */
function shell({ entry, headTags, rootAttrs = '', htmlAttrs = '' }) {
  return `<!doctype html>
<html lang="en-AU"${htmlAttrs}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- shared-head -->
    <!-- fonts-agency -->
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
  const funnel = route.funnel ? FUNNELS[route.funnel] : undefined;
  if (route.funnel && !funnel) throw new Error(`${route.path}: no funnel "${route.funnel}" in src/data/funnels.json`);
  const url = (funnel ? FUNNEL_ORIGIN : SITE) + route.path;
  const title = esc(route.title);
  const description = esc(route.description);
  // Each funnel has its own share image, made for ads; a listing uses its
  // main photo, whose size we don't know; other main-site pages get
  // theirs from scripts/og-images.mjs.
  const og = funnel
    ? { image: FUNNEL_ORIGIN + funnel.og.image, alt: funnel.og.alt, sized: true }
    : route.ogImage
      ? { image: route.ogImage, alt: route.ogAlt ?? '', sized: false }
      : { image: `${SITE}/og/${route.page}.jpg`, alt: (OG_PHOTOS[route.page] ?? OG_DEFAULT).alt, sized: true };
  const ogSize = og.sized
    ? `    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
`
    : '';
  const jsonLd =
    route.page === 'home' || route.page === 'contact'
      ? `    <script type="application/ld+json">${JSON.stringify(JSON_LD)}</script>\n`
      : '';
  // The home hero's poster is its largest image, so fetch it straight
  // away: the same WebP set as HERO_VIDEO.posterSrcSet in src/data/media.ts.
  const preload =
    route.page === 'home'
      ? `    <link rel="preload" as="image" type="image/webp" imagesrcset="/video/adelaide-aerial-poster-800.webp 800w, /video/adelaide-aerial-poster-1600.webp 1600w" imagesizes="100vw" fetchpriority="high" />\n`
      : '';
  const headTags = `    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${route.noindex ? 'noindex' : 'index, follow'}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="APN Real Estate" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${esc(og.image)}" />
${ogSize}    <meta property="og:image:alt" content="${esc(og.alt)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="en_AU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${esc(og.image)}" />
    <meta name="twitter:image:alt" content="${esc(og.alt)}" />
${preload}${jsonLd}`;
  return shell({
    entry: funnel ? funnel.entry : ENTRIES.main,
    headTags,
    rootAttrs: ` data-page="${route.page}"`,
    htmlAttrs: funnel ? ` data-funnel="${funnel.id}"` : '',
  });
}

// Listing pages come and go with the feed, so clear out the last run's
// before writing this one's (the generated folders inside /buy/, /rent/,
// /sold/ and /commercial/; their own index.html stays).
for (const section of ['buy', 'rent', 'sold', 'commercial']) {
  const dir = join(ROOT, section);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) rmSync(join(dir, entry.name), { recursive: true, force: true });
  }
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
  shell({ entry: ENTRIES.blog, headTags: '    <!-- blog-head -->\n' }),
);

await buildOgImages([...new Set(routes.filter((r) => !r.funnel && !r.ogImage).map((r) => r.page))]);

console.log(`Generated ${routes.length} pages, the blog template and their link-preview images`);
