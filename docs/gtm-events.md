# GTM events

Every page sends its analytics events to the Google Tag Manager
dataLayer (container `GTM-P5H7NTCF`). GTM passes them on to GA4
(`G-WDLJLYGJCY`). None of these reach GA4 until the matching trigger and
tag exist in the container and the container is published. The Meta
Pixel events (`Lead`, `Contact`) are sent straight from the page and
don't go through GTM.

GTM and the Pixel only load on `apnre.com.au` and `www.apnre.com.au`
(`src/partials/head-shared.html`), so the dev server and preview
deployments don't send anything.

Both parts of the site send the same `generate_lead` event, so one
trigger and one GA4 tag cover every form. `event_category` tells them
apart.

| dataLayer `event` | Sent by | When | Parameters |
| --- | --- | --- | --- |
| `generate_lead` | main site (`src/lib/analytics.ts`) | Any enquiry form accepted by `/api/enquiry`, just before the redirect to `/thank-you/` | `event_category` (`enquiry_form`), `form_name` (`sales-appraisal`, `rental-appraisal`, `buyer-register`, `tenant-register`, `general`, `careers`, `maintenance`) |
| `generate_lead` | landlord page (`src/funnels/landlords/lib/analytics.ts`) | The appraisal form on `go.apnre.com.au/landlords/` accepted by `/api/lead` | `event_category` (`appraisal_form`), `event_label` (`Free Rental Appraisal`), `office` (`home`), `currently_managed` (`agent`, `self`, `not-rented`, `not_answered`) |
| `appraisal_form_submit` | landlord page | Straight after its `generate_lead`, just before the redirect to `/landlords/thank-you/` | `form_name` (`landlord_appraisal`) |
| `click_to_call` | both | A tap on a Call button | `placement` (where the button is, e.g. `header_menu`, `sticky_bar`, `footer`, `cta_band`) |

## Setting it up in GTM

1. **Variables → User-Defined → New → Data Layer Variable**, one for
   each of `event_category`, `event_label`, `form_name`, `office`,
   `currently_managed`, `placement`. Use the parameter name as the Data
   Layer Variable Name, and name the variables `DLV - office` and so on.
2. **Triggers → New → Custom Event**:
   - `CE - generate_lead`, event name `generate_lead`
   - `CE - click_to_call`, event name `click_to_call`
3. **Tags → New → Google Analytics: GA4 Event**. Set the Measurement ID
   to `G-WDLJLYGJCY`, or pick the existing Google tag.
   - `GA4 - generate_lead`: event name `generate_lead`. Event parameters:
     `event_category`, `event_label`, `form_name`, `office` and
     `currently_managed`, each set to its `DLV -` variable. Parameters a
     form doesn't send are simply left out. Trigger: `CE - generate_lead`.
   - `GA4 - click_to_call`: event name `click_to_call`. Event parameter:
     `placement` = `{{DLV - placement}}`. Trigger: `CE - click_to_call`.
4. Check both in **Preview** mode (Tag Assistant) on the live domain,
   then **Submit** to publish the container.
5. In GA4, go to **Admin → Custom definitions** and add event-scoped
   custom dimensions for `form_name`, `office`, `currently_managed` and
   `placement`. Without them the values are collected but can't be used
   in reports. Then mark `generate_lead` (and `click_to_call` if you want
   it) as a key event under **Admin → Events**.

`appraisal_form_submit` fires on the same landlord submission as
`generate_lead`. If the container already has a GA4 tag on it, count only
one of the two as a key event, or every landlord lead will be counted
twice.

## Ad conversions that use a page URL

If a Google Ads or Meta conversion is defined as "visited `/thank-you/`",
update it when this site goes live: landlord-page leads now land on
`/landlords/thank-you/`, and `/thank-you/` is where every other enquiry
on the site lands.
