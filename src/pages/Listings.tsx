// /buy/, /rent/ and /sold/. Until the site has a listings feed from the
// CRM, each page points to APN's realestate.com.au profile, which is
// always current, rather than showing a copy here that could go stale.

import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import { CtaBand, FormSection, PageHero } from '../components/sections';
import { LISTINGS_LINKS } from '../data/nav';
import mountGambier from '../assets/photos/mount-gambier-hillside-street.jpg';
import interior from '../assets/photos/interior-corner-windows.jpg';
import soldSign from '../assets/photos/sold-sign-ridley.jpg';

interface ListingsPanelProps {
  link: { href: string; label: string };
  title: string;
  copy: string;
}

function ListingsPanel({ link, title, copy }: ListingsPanelProps) {
  return (
    <section className="section section-white">
      <div className="wrap listings-panel">
        <div>
          <h2 className="h-1">{title}</h2>
          <p className="lede">{copy}</p>
        </div>
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          {link.label} <Icon name="external" />
        </a>
      </div>
    </section>
  );
}

export function Buy() {
  return (
    <Layout>
      <PageHero
        eyebrow="Buy"
        title="Properties for sale."
        lede="Homes, land and investment properties across Adelaide and Mount Gambier."
        photo={mountGambier}
        photoAlt="Homes on a hillside street in Mount Gambier"
        focalPoint="30% 65%"
      />
      <ListingsPanel
        link={LISTINGS_LINKS.buy}
        title="See everything we have on the market."
        copy="Our current listings, with photos, inspection times and price guides, are on our realestate.com.au agency page."
      />
      <FormSection
        id="register"
        eyebrow="Buyer list"
        title="Hear about new listings first."
        copy="Tell us what you’re looking for and our sales team will let you know when something suitable comes up."
      >
        <EnquiryForm kind="buyer-register" submitLabel="Join the Buyer List" />
      </FormSection>
      <CtaBand
        title="Selling before you buy?"
        copy="Find out what your current property is worth with a free, no-obligation appraisal."
        href="/appraisal/?type=sales"
        label="Book a Sales Appraisal"
      />
    </Layout>
  );
}

export function Rent() {
  return (
    <Layout>
      <PageHero
        eyebrow="Rent"
        title="Properties for rent."
        lede="Rental homes available now across Adelaide and Mount Gambier."
        photo={interior}
        photoAlt="Floor-to-ceiling corner windows in a rental property managed by APN"
      />
      <ListingsPanel
        link={LISTINGS_LINKS.rent}
        title="See what’s available to rent."
        copy="Our current rentals, with photos and inspection times, are on our realestate.com.au agency page. Apply through the listing."
      />
      <FormSection
        id="register"
        eyebrow="Can’t see the right one?"
        title="Tell us what you need."
        copy="Let us know what you’re looking for and our property management team will get in touch if something suitable comes up."
      >
        <EnquiryForm kind="tenant-register" submitLabel="Send My Details" />
      </FormSection>
      <CtaBand
        title="Already renting with APN?"
        copy="Report a repair or maintenance issue with your rental property."
        href="/client-hub/#repairs"
        label="Report Maintenance"
      />
    </Layout>
  );
}

export function Sold() {
  return (
    <Layout>
      <PageHero
        eyebrow="Sold"
        title="Recently sold."
        lede="Properties APN has recently sold across Adelaide and Mount Gambier."
        photo={soldSign}
        photoAlt="An Adelaide Property Network SOLD sign outside a brick home"
        focalPoint="70% center"
      />
      <ListingsPanel
        link={LISTINGS_LINKS.sold}
        title="See our recent results."
        copy="Our sold properties are listed on our realestate.com.au agency page."
      />
      <CtaBand
        title="What could yours sell for?"
        copy="Book a free sales appraisal and we’ll walk you through recent comparable sales near you."
        href="/appraisal/?type=sales"
        label="Book a Sales Appraisal"
      />
    </Layout>
  );
}
