// Schema.org helpers shared by the blog renderer (src/blog-server.tsx).
// The organisation itself is described in full on the home and contact
// pages (JSON_LD in scripts/build-pages.mjs), with the same @id, so a
// blog post's publisher points at it rather than repeating it.

export const SITE = 'https://apnre.com.au';
export const ORGANIZATION_ID = `${SITE}/#organization`;

/** JSON inside a <script> tag: escape "<" so the data can't close it. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** How a blog post refers to the organisation. */
export const ORGANIZATION_REF = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'APN Real Estate',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/apple-touch-icon.png` },
};
