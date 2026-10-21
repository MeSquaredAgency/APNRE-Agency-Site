# Preferred contractors: /client-hub/contractors/

A page listing the tradespeople APN Real Estate's property managers use,
with a **Trade** drop-down and an **Area** drop-down (Adelaide / Mount
Gambier). Suggested by a landlord in October 2026. Some contractors (for
example Plumfast) offer APN a referral fee for each job, so the page shows
every fee next to the contractor who pays it.

The page is built from `src/data/contractors.json` and is **not on the
site until that file says `"published": true`**. Until then there's no
page, no menu link and no sitemap entry.

## Before publishing

1. **Confirm how APN will disclose referral fees to landlords** (see
   "Referral fees and the law" below), and get CBS or a lawyer to confirm
   the approach.
2. **Make sure the page's wording is true.** It tells landlords: "your
   property manager will tell you about any referral fee before arranging
   work at your property, and you can always ask for a different
   tradesperson". Change it in `src/pages/Contractors.tsx` if that isn't
   how APN will work.
3. **Fill in the list** (below), including every referral fee.
4. Set `"published": true`, commit and push.

## Adding contractors

Each contractor is one entry in `contractors` in
`src/data/contractors.json`:

```json
{
  "published": false,
  "contractors": [
    {
      "name": "Plumfast",
      "trade": "Plumbing",
      "areas": ["adelaide"],
      "phone": "08 0000 0000",
      "website": "https://example.com.au",
      "referralFee": "$20 per job",
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
- `referralFee` is what the contractor pays APN, worded as it should
  appear ("$20 per job"). **Every contractor that pays a fee must have
  it here.** Leave it out only if they pay nothing; the card then says
  "No referral fee".

The phone, email and website must be the contractor's own, confirmed
with them.

## Referral fees and the law

Researched 21 October 2026 from the current Acts on
legislation.sa.gov.au. This is a summary for APN, **not legal advice**:
confirm with Consumer and Business Services (131 882) or a lawyer before
relying on it.

**Rental work (property management)**

The [Criminal Law Consolidation Act 1935](https://www.legislation.sa.gov.au/lz?path=%2Fc%2Fa%2Fcriminal%20law%20consolidation%20act%201935),
Part 6 "Secret commissions" (ss 145–150), applies:

- An agent acting for someone is that person's "fiduciary" (s 146). A
  property manager acting for a landlord counts.
- Choosing a tradesperson for the landlord's property, or recommending
  one, is exercising a fiduciary function (s 147).
- Getting, or expecting, a benefit from a contractor for sending them
  that work, and doing it without "appropriate disclosure", is "unlawful
  bias" (s 148). Appropriate disclosure means telling the landlord **the
  nature and value (or approximate value) of the benefit, and who it
  comes from** (s 148(2)).
- Exercising unlawful bias is an offence, maximum 7 years' imprisonment
  (s 149). A contractor who pays expecting it won't be disclosed can
  commit bribery (s 150).

So APN can take a fee for rental referrals **if each landlord is told
first, in writing**: who pays, how much, and for what. A line on this
page helps, but isn't by itself disclosure to each landlord; the
management agreement, or a written notice to every current landlord, is
the natural place.

**Sales work**

The [Land and Business (Sale and Conveyancing) Act 1994](https://www.legislation.sa.gov.au/lz?path=%2Fc%2Fa%2Fland%20and%20business%20(sale%20and%20conveyancing)%20act%201994):

- s 24C: an agent selling or buying for a client must disclose the
  nature, source and amount of any benefit (including a rebate, discount
  or refund) from a third party the client was referred to.
- s 24D(6): on a **residential** sale, a benefit from a third party the
  client was referred to must be **paid to the client** straight away.
  APN can't keep it. Maximum penalty $20,000.

So referral fees from work for sellers (pre-sale repairs, painting and so
on) go to the seller, not APN.

**Other rules checked**

- The [Land Agents Act 1994](https://www.legislation.sa.gov.au/lz?path=%2Fc%2Fa%2Fland%20agents%20act%201994)
  has no rebate rule of its own, and the Land Agents Regulations 2025
  have no code of conduct or rebate rule. Acting "improperly ... or
  unfairly" is still grounds for disciplinary action (s 43(1)(c)).
- Under the general law an agent mustn't make a secret profit from a
  client, and calling contractors "preferred" without saying some pay
  APN could be misleading under the Australian Consumer Law.

**Questions for CBS or a lawyer**

- Is disclosure in the management agreement enough for every later job,
  or is it needed job by job?
- Do current landlords need a new written notice?
- Does anything apply when a tenant (whom APN doesn't act for) uses the
  list?
- Does REISA's management agreement have a rebates clause APN can use?

CBS and REISA guidance couldn't be checked: the CBS site blocks automated
access, and no official guidance on property-management rebates turned
up in searches.
