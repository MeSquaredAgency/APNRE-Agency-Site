import type { ComponentType } from 'react';

// Every page, keyed by the `page` id in src/data/routes.json. The browser
// loads only the current page's module (src/main.tsx); the build-time
// renderer loads them all (src/server.tsx).
export const PAGE_LOADERS: Record<string, () => Promise<ComponentType>> = {
  home: () => import('./Home').then((m) => m.default),
  selling: () => import('./Selling').then((m) => m.default),
  leasing: () => import('./Leasing').then((m) => m.default),
  switching: () => import('./Switching').then((m) => m.default),
  buy: () => import('./Listings').then((m) => m.Buy),
  rent: () => import('./Listings').then((m) => m.Rent),
  sold: () => import('./Listings').then((m) => m.Sold),
  commercial: () => import('./Listings').then((m) => m.Commercial),
  'office-space': () => import('./OfficeSpace').then((m) => m.default),
  appraisal: () => import('./Appraisal').then((m) => m.default),
  'appraisal-sales': () => import('./Appraisal').then((m) => m.SalesAppraisal),
  'appraisal-rental': () => import('./Appraisal').then((m) => m.RentalAppraisal),
  people: () => import('./People').then((m) => m.default),
  // Every /our-people/<id>/ page; Person picks the member from the path.
  person: () => import('./Person').then((m) => m.default),
  story: () => import('./Story').then((m) => m.default),
  contact: () => import('./Contact').then((m) => m.default),
  'office-adelaide': () => import('./Office').then((m) => m.AdelaideOffice),
  'office-mount-gambier': () => import('./Office').then((m) => m.MountGambierOffice),
  'mount-gambier-pm': () => import('./MountGambier').then((m) => m.default),
  'mount-gambier-rental-appraisal': () => import('./Appraisal').then((m) => m.MountGambierRentalAppraisal),
  careers: () => import('./Careers').then((m) => m.default),
  hub: () => import('./Hubs').then((m) => m.HubOverview),
  'hub-landlords': () => import('./Hubs').then((m) => m.LandlordHub),
  'hub-tenants': () => import('./Hubs').then((m) => m.TenantHub),
  'hub-sellers': () => import('./Hubs').then((m) => m.SellerHub),
  'hub-buyers': () => import('./Hubs').then((m) => m.BuyerHub),
  // Only built once src/data/contractors.json is published.
  contractors: () => import('./Contractors').then((m) => m.default),
  privacy: () => import('./Privacy').then((m) => m.default),
  'thank-you': () => import('./ThankYou').then((m) => m.default),
  // Every /buy/<slug>/, /rent/<slug>/ and /sold/<slug>/ page; Listing
  // picks the listing from the path.
  listing: () => import('./Listing').then((m) => m.default),
};
