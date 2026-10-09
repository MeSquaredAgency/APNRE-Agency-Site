# Still to supply: director's review, October 2026

Patrick's review asked for photos, logos, links and staff details that
haven't been supplied yet. Each has a slot ready, so adding it is a file
drop or a one-line edit, and the next build uses it. Until then the site
shows what it did before, and nothing half-finished goes live. Search the
code for `TODO(` to find each one.

| What | Where it goes | Until then |
| --- | --- | --- |
| Seller hub card photo (home) | `src/assets/photos/supplied/hub-sellers.jpg` | SOLD sign, Fenden Road, Salisbury |
| Buyer hub card photo (home) | `src/assets/photos/supplied/hub-buyers.jpg` | Stock house exterior (Pexels) |
| /rent/ hero: a generic Adelaide/SA property | `src/assets/photos/supplied/rent-hero.jpg`, plus its alt text in `PHOTO_ALT` in `src/data/supplied.ts` | Corner-windows interior |
| Mount Gambier office, 178 Commercial Street East | `src/assets/photos/supplied/mount-gambier-office.jpg` (alt text already written) | The office's logo on a plain panel |
| ABN | `ABN` in `src/data/business.ts` (footer and privacy policy) | Not shown |
| Fabienne Nhim (Directors) | Her entry in `TEAM`, a photo, a route in `src/data/routes.json`, and her name in `LEADERSHIP_GROUPS` (`src/data/team.ts`) | Directors shows Patrick only |

Photos can be JPEG, PNG or WebP, ideally at least 1600px wide. The build
makes the WebP copies, the 800px phone size and the width/height
attributes.

The licensee line ("Adelaide Property Network | RLA 255336") is in the
footer of every page. `public/404.html` has its own copy, so change both
if it ever changes.

The home page "Properties for sale" and "Properties for rent" tiles are
in (`src/assets/photos/supplied/home-tile-for-sale.webp` and
`home-tile-for-rent.webp`): APN's own listing photos of 6B East Way (at
dusk) and 6C East Way (living room), Darlington, October 2026. Replace a
file to change the photo.

Supplied in October 2026 and already in: the title matrix and registration
numbers (`src/data/team.ts`), one matching set of headshots for everyone
(`src/assets/team/`), the Facebook, Instagram and YouTube links and all
five portal profiles: realestate.com.au, Domain, realty.com.au,
realcommercial.com.au and commercialrealestate.com.au
(`src/data/business.ts`), and the header
and footer logo. That logo is the Adelaide and Mount Gambier Property Network
logos side by side (`src/assets/logo/apn-logo-side-reversed.png`), made from
the supplied files with their grey turned light for the dark background.
