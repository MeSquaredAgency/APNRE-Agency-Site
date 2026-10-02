import SiteHeader from '../../../components/Header';

// The main site's header, cut down to this page's own links and its
// appraisal button, so ad visitors stay on the page (src/components/Header.tsx).

const PAGE_LINKS = [
  { href: '#why-apn', label: 'Why APN' },
  { href: '#team', label: 'The Team' },
  { href: '#switch', label: 'Switching?' },
  { href: '#faq', label: 'FAQ' },
];

/** The landing page's form. The thank-you page, which has none, links
 *  back to it. */
export const FORM_HREF = '#appraisal';
const CTA_LABEL = 'Free Rental Appraisal';

export default function Header({ thankYou = false }: { thankYou?: boolean }) {
  return (
    <SiteHeader
      current="/landlords/"
      funnel={
        thankYou
          ? { home: '/landlords/', links: [], cta: { href: `/landlords/${FORM_HREF}`, label: CTA_LABEL } }
          : { home: '#main', links: PAGE_LINKS, cta: { href: FORM_HREF, label: CTA_LABEL } }
      }
    />
  );
}
