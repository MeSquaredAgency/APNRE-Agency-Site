// Last step of `npm run build`. Uses the server build of src/server.tsx
// (dist-ssr/server.js) to fill each page's dist/<path>/index.html with
// its rendered markup, in place of the <!-- app --> marker inside #root.
// Then removes dist-ssr/.

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const routes = JSON.parse(readFileSync(join(root, 'src/data/routes.json'), 'utf8'));
const { renderPage } = await import(pathToFileURL(join(ssrDir, 'server.js')).href);

for (const route of routes) {
  const file = join(dist, route.path, 'index.html');
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<!-- app -->')) throw new Error(`${route.path}: no <!-- app --> marker in ${file}`);
  const markup = await renderPage(route.page, route.path);
  // Function replacement, so a "$" in the content can't be read as a
  // replacement pattern.
  writeFileSync(file, html.replace('<!-- app -->', () => markup));
}

rmSync(ssrDir, { recursive: true, force: true });
console.log(`Pre-rendered ${routes.length} pages.`);
