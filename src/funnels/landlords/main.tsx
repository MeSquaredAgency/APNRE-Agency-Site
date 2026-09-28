import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ThankYouPage from './ThankYouPage';
import './index.css';

// Browser entry for the landlord campaign pages (/landlords/ and
// /landlords/thank-you/). They were the separate landing page repo
// (APNRE-Website) and keep its own look, stylesheet, fonts, form
// (/api/lead) and analytics events, so paid-ad tracking carries on
// unchanged. Only this entry imports ./index.css, so the landing styles
// never reach the rest of the site, and the site's never reach these.
//
// Like the main site, the built pages arrive pre-rendered
// (scripts/prerender.mjs) and are hydrated in place.
const root = document.getElementById('root')!;
const Page = root.dataset.page === 'landlords-thank-you' ? ThankYouPage : App;
const app = (
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
if (root.firstElementChild) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
