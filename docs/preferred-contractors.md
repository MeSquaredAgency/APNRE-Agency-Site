# Preferred contractors: /client-hub/contractors/

A page listing the tradespeople APN Real Estate's property managers use,
with a **Trade** drop-down and an **Area** drop-down (Adelaide / Mount
Gambier). Suggested by a landlord in October 2026.

The page is built from `src/data/contractors.json` and is **not on the
site until that file says `"published": true`**. Until then there's no
page, no menu link and no sitemap entry.

## Publishing it

1. Fill in the list (below).
2. Set `"published": true`, commit and push.

## Adding contractors

Each contractor is one entry in `contractors` in
`src/data/contractors.json`:

```json
{
  "published": false,
  "contractors": [
    {
      "name": "Example Plumbing",
      "trade": "Plumbing",
      "areas": ["adelaide"],
      "phone": "08 0000 0000",
      "website": "https://example.com.au",
      "note": "Leaks, blocked drains and hot water."
    }
  ]
}
```

- `name`, `trade` and `areas` are required. `areas` is `"adelaide"`,
  `"mount-gambier"` or both.
- `trade` is free text. The Trade drop-down lists each one used, A–Z, so
  keep the spelling the same across contractors ("Plumbing", not
  "Plumber" for one and "Plumbing" for another).
- `phone`, `email`, `website` and `note` are optional.

The phone, email and website must be the contractor's own, confirmed
with them.

## Referral fees

APN decided in October 2026 not to take referral fees from the
contractors listed here. If that ever changes, check the law before
taking any: in SA, a property manager who sends a landlord's work to a
contractor paying them a fee must tell the landlord about it first
(Criminal Law Consolidation Act 1935, Part 6), and on a residential sale
any referral fee must be paid to the client (Land and Business (Sale and
Conveyancing) Act 1994, s 24D). Get advice from Consumer and Business
Services or a lawyer.
