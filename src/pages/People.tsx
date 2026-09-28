import Layout from '../components/Layout';
import { CtaBand, PageHero, Team } from '../components/sections';

export default function People() {
  return (
    <Layout>
      <PageHero
        eyebrow="Our people"
        title="Meet the team."
        lede="Sales, leasing and property management across our Adelaide and Mount Gambier offices."
      />
      <Team filterable headless />
      <CtaBand
        title="Want to talk to one of us?"
        copy="Call the office or send an enquiry and we’ll put you in touch with the right person."
        href="/contact/"
        label="Contact Us"
      />
    </Layout>
  );
}
