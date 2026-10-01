// Schema.org helpers shared by the pages (src/components/JsonLd.tsx) and
// the blog renderer (src/blog-server.tsx). The organisation and both
// offices are described in full on the home and contact pages (JSON_LD in
// scripts/build-pages.mjs), with these same @ids, so everything else
// points at them rather than repeating them.

export const SITE = 'https://apnre.com.au';
export const ORGANIZATION_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

/** Each office's @id. Must match OFFICE_IDS in scripts/build-pages.mjs. */
export const OFFICE_SCHEMA_IDS = {
  adelaide: `${SITE}/#office-adelaide`,
  'mount-gambier': `${SITE}/#office-mount-gambier`,
} as const;

/** JSON inside a <script> tag: escape "<" so the data can't close it. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** How a blog post refers to the organisation. Same @type as the full
 *  description on the home page, so the two read as one entity. */
export const ORGANIZATION_REF = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'APN Real Estate',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/apple-touch-icon.png` },
};

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

/** From the FAQ text shown on the page, so the two always match (Google
 *  requires that). */
export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** A service APN offers, e.g. on /leasing/ and /selling/. */
export function service(s: { name: string; serviceType: string; path: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    serviceType: s.serviceType,
    url: `${SITE}${s.path}`,
    description: s.description,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: [
      { '@type': 'City', name: 'Adelaide' },
      { '@type': 'City', name: 'Mount Gambier' },
    ],
  };
}
