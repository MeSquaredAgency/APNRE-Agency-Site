import React from 'react';
import ReactDOM from 'react-dom/client';
import { PAGE_LOADERS } from './pages';
import { PathContext } from './lib/route';
import './index.css';

// One entry for every page. Each generated HTML file (see
// scripts/build-pages.mjs) sets data-page on #root. The built site
// already has the page's markup in #root (scripts/prerender.mjs), so it
// loads that page's code and hydrates it in place. On the dev server
// #root holds only the <!-- app --> marker, so it renders from scratch.
const root = document.getElementById('root')!;
const load = PAGE_LOADERS[root.dataset.page ?? ''];
if (!load) throw new Error(`Unknown page: ${root.dataset.page}`);

load().then((Page) => {
  const app = (
    <React.StrictMode>
      <PathContext.Provider value={window.location.pathname}>
        <Page />
      </PathContext.Provider>
    </React.StrictMode>
  );
  if (root.firstElementChild) ReactDOM.hydrateRoot(root, app);
  else ReactDOM.createRoot(root).render(app);
});
