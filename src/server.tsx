// Entry for the server build in `npm run build` (dist-ssr/server.js).
// scripts/prerender.mjs uses it to write each page's finished markup into
// its HTML file, so search engines and link previews read the content
// without running JavaScript. The browser then hydrates it (src/main.tsx
// for the main site, and each funnel's own entry under src/funnels/).

import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { PAGE_LOADERS } from './pages';
import { PathContext } from './lib/route';

export { renderBlogPages } from './blog-server';

// Funnel pages (src/funnels/, served on apnre.com.au) have their own
// browser entries, so they're listed here rather than in PAGE_LOADERS
// (which the main site's browser code imports). Keyed by the route's
// page id in src/data/routes.json. See docs/funnels.md.
const FUNNEL_LOADERS: Record<string, () => Promise<ComponentType>> = {
  landlords: () => import('./funnels/landlords/App').then((m) => m.default),
  'landlords-thank-you': () => import('./funnels/landlords/ThankYouPage').then((m) => m.default),
};

export async function renderPage(page: string, path: string): Promise<string> {
  const load = PAGE_LOADERS[page] ?? FUNNEL_LOADERS[page];
  if (!load) throw new Error(`Unknown page: ${page}`);
  const Page = await load();
  return renderToString(
    <PathContext.Provider value={path}>
      <Page />
    </PathContext.Provider>,
  );
}
