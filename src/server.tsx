// Entry for the server build in `npm run build` (dist-ssr/server.js).
// scripts/prerender.mjs uses it to write each page's finished markup into
// its HTML file, so search engines and link previews read the content
// without running JavaScript. The browser then hydrates it (src/main.tsx
// for the main site, src/landlords/main.tsx for the landlord campaign).

import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { PAGE_LOADERS } from './pages';
import { PathContext } from './lib/route';

export { renderBlogPages } from './blog-server';

// The landlord campaign pages have their own browser entry, so they're
// listed here rather than in PAGE_LOADERS (which the main site's browser
// code imports).
const LANDLORD_LOADERS: Record<string, () => Promise<ComponentType>> = {
  landlords: () => import('./landlords/App').then((m) => m.default),
  'landlords-thank-you': () => import('./landlords/ThankYouPage').then((m) => m.default),
};

export async function renderPage(page: string, path: string): Promise<string> {
  const load = PAGE_LOADERS[page] ?? LANDLORD_LOADERS[page];
  if (!load) throw new Error(`Unknown page: ${page}`);
  const Page = await load();
  return renderToString(
    <PathContext.Provider value={path}>
      <Page />
    </PathContext.Provider>,
  );
}
