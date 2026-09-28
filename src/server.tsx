// Entry for the server build in `npm run build` (dist-ssr/server.js).
// scripts/prerender.mjs uses it to write each page's finished markup into
// its HTML file, so search engines and link previews read the content
// without running JavaScript. The browser then hydrates it (src/main.tsx).

import { renderToString } from 'react-dom/server';
import { PAGE_LOADERS } from './pages';
import { PathContext } from './lib/route';

export async function renderPage(page: string, path: string): Promise<string> {
  const load = PAGE_LOADERS[page];
  if (!load) throw new Error(`Unknown page: ${page}`);
  const Page = await load();
  return renderToString(
    <PathContext.Provider value={path}>
      <Page />
    </PathContext.Provider>,
  );
}
