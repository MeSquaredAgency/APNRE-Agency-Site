# Still to supply: director's review, October 2026

Patrick's review asked for photos, logos, links and staff details that
haven't been supplied yet. Each has a slot ready, so adding it is a file
drop or a one-line edit, and the next build uses it. Until then the site
shows what it did before, and nothing half-finished goes live. Search the
code for `TODO(` to find each one.

| What | Where it goes | Until then |
| --- | --- | --- |
| Side (horizontal) APN logo, reversed (light) for dark backgrounds | `src/assets/logo/apn-logo-side-reversed.png` (transparent PNG or WebP). Header and footer switch to it automatically, converted to WebP. | The stacked Adelaide Property Network logo |
| "Properties for sale" tile photo (home) | `src/assets/photos/supplied/home-tile-for-sale.jpg` | Mount Gambier hillside street |
| "Properties for rent" tile photo (home) | `src/assets/photos/supplied/home-tile-for-rent.jpg` | Corner-windows interior |
| Seller hub card photo (home) | `src/assets/photos/supplied/hub-sellers.jpg` | SOLD sign, Fenden Road, Salisbury |
| Buyer hub card photo (home) | `src/assets/photos/supplied/hub-buyers.jpg` | Stock house exterior (Pexels) |
| /rent/ hero: a generic Adelaide/SA property | `src/assets/photos/supplied/rent-hero.jpg`, plus its alt text in `PHOTO_ALT` in `src/data/supplied.ts` | Corner-windows interior |
| Mount Gambier office, 178 Commercial Street East | `src/assets/photos/supplied/mount-gambier-office.jpg` (alt text already written) | The office's logo on a plain panel |
| Domain and commercialrealestate.com.au agency profiles (realestate.com.au, realty.com.au and realcommercial.com.au are in) | `PORTALS` in `src/data/business.ts` | Those two aren't shown |
| Title/role matrix (the email-signature one) | `role` for each person in `src/data/team.ts` | Titles unchanged |
| Individual RLA/registration numbers | `registration` for each person in `src/data/team.ts`, written as it should appear, e.g. `'RLA 123456'` | Not shown |
| New headshots (Patrick and Brett), and one matching set for every property manager | Replace the files in `src/assets/team/` under the same names. Don't mix styles: either all the new AI-styled shots, or all the 2025 professional photos. | Current photos |
| ABN | `ABN` in `src/data/business.ts` (footer and privacy policy) | Not shown |
| me² logo file | `PoweredBy` in `src/components/Footer.tsx` | "me²" set in type |
| Fabienne Nhim (Directors) | Her entry in `TEAM`, a photo, a route in `src/data/routes.json`, and her name in `LEADERSHIP_GROUPS` (`src/data/team.ts`) | Directors shows Patrick only |

Photos can be JPEG, PNG or WebP, ideally at least 1600px wide. The build
makes the WebP copies, the 800px phone size and the width/height
attributes.

The licensee line ("Adelaide Property Network | RLA 255336") is in the
footer of every page. `public/404.html` has its own copy, so change both
if it ever changes.
