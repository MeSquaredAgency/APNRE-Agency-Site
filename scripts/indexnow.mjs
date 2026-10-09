// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver...) which
// pages have changed, so they recrawl them soon instead of whenever they
// next get round to it. Google doesn't take part; it reads the sitemap.
//
//   node scripts/indexnow.mjs                    every page in the live sitemap
//   node scripts/indexnow.mjs --since 2026-10-08 pages with a <lastmod> on or after that day
//
// Run it after a deploy is live: the engines fetch the key file
// (public/<key>.txt) from the site to check the request is ours. The same
// key goes in Ahrefs (Site Audit > project settings > IndexNow), which
// then submits the pages its crawls find changed.

const SITE = 'https://apnre.com.au';
const KEY = '903652f81a02defe2ade54254326a20c';

const since = process.argv.includes('--since') ? process.argv[process.argv.indexOf('--since') + 1] : undefined;
if (since !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('--since takes a date: YYYY-MM-DD');

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)]
  .filter(([, , lastmod]) => !since || (lastmod && lastmod >= since))
  .map(([, loc]) => loc);
if (urls.length === 0) {
  console.log('IndexNow: no pages to submit.');
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
// 200 and 202 both mean accepted (202: the key is still being checked).
console.log(`IndexNow: ${urls.length} page(s) submitted, HTTP ${res.status} ${res.statusText}`);
if (!res.ok) {
  console.log(await res.text());
  process.exit(1);
}
