import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// One entry for every page. Each generated HTML file (see
// scripts/build-pages.mjs) sets data-page on #root, and only that page's
// code is loaded.
const PAGES = {
  home: lazy(() => import('./pages/Home')),
  selling: lazy(() => import('./pages/Selling')),
  leasing: lazy(() => import('./pages/Leasing')),
  buy: lazy(() => import('./pages/Listings').then((m) => ({ default: m.Buy }))),
  rent: lazy(() => import('./pages/Listings').then((m) => ({ default: m.Rent }))),
  sold: lazy(() => import('./pages/Listings').then((m) => ({ default: m.Sold }))),
  appraisal: lazy(() => import('./pages/Appraisal')),
  people: lazy(() => import('./pages/People')),
  story: lazy(() => import('./pages/Story')),
  contact: lazy(() => import('./pages/Contact')),
  careers: lazy(() => import('./pages/Careers')),
  hub: lazy(() => import('./pages/Hub')),
  privacy: lazy(() => import('./pages/Privacy')),
  'thank-you': lazy(() => import('./pages/ThankYou')),
};

const root = document.getElementById('root')!;
const Page = PAGES[root.dataset.page as keyof typeof PAGES];
if (!Page) throw new Error(`Unknown page: ${root.dataset.page}`);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </React.StrictMode>,
);
