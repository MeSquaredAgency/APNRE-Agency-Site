import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ThankYouPage from './ThankYouPage';
import '../../index.css';
import './landlords.css';

// Browser entry for the landlord campaign pages (/landlords/ and
// /landlords/thank-you/, served at go.apnre.com.au). They use the main
// site's stylesheet and sections, so they look like the rest of
// apnre.com.au, plus a few rules of their own in ./landlords.css. Their
// form (/api/lead) and analytics events are their own, so paid-ad
// tracking carries on unchanged (docs/gtm-events.md).
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
