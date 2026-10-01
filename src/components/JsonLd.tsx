import { scriptJson } from '../structured-data';

/** Structured data in the page body. Search engines read JSON-LD
 *  anywhere in the page, so a component can describe itself (FAQs,
 *  breadcrumbs, the team) without the page's <head> needing to know. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: scriptJson(data) }} />;
}
