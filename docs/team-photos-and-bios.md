# Team section: photo consistency + bios

## Photos

The team is split into two groups: **Property Management** (Jenny, Luke,
Breeanna, Marissa — a four-up grid, `.team__grid`, circular portraits) and
**Leadership / Sales** (Patrick, Brett — wider "spotlight" cards,
`.team__leader`, since one person alone in a grid tile reads as an
accident rather than a deliberate layout).

The four property-management photos were originally different distances/
zoom levels (some tightly framed close-ups, some wider with more shoulder
and background visible), which made the row read as "not level" even
though the four circle containers were pixel-identical. `object-position`
(the `focalPoint` field) can't fix that on its own — it can only shift
*which part* of an image shows, not rescale a subject who was framed
closer or further away. The actual fix was cropping each source photo
(`src/assets/team/*.jpg`) to a consistent head size and eye-line
*before* it reaches the browser — see the crop commands in git history
if a new photo needs the same treatment. All four are now pre-cropped to
an exact 640×640 square, so `focalPoint` is unused for this group (it's a
no-op once width/height already match the box exactly). Brett's and
Patrick's leadership photos aren't part of this row-alignment constraint
since each sits in its own card, not a shared row.

## Bios

`bio` is optional on `TeamMember`, but everyone on the page now has one.
Breeanna Arney (Property Management Trainee, Mount Gambier) supplied hers
in September 2026; she was previously listed as reception with no bio.

Jenny, Marissa, Brett and Patrick have real supplied bios. Luke's is still
the original short, factual, role-based stand-in (what he manages, not a
personal biography) — fine to ship as-is, but worth the same treatment
the others got. To get a real one, the fastest path is a short async
brief to him — something like:

> For the new website, we're adding a two-to-three sentence intro under
> your photo. Could you send me:
> - How long you've been in property management / at APN
> - Anything you focus on or are known for (e.g. maintenance, a particular
>   area, tenant relations)
> - One human detail if you're comfortable (a hobby, why you like the job,
>   etc.) — optional, but it's what makes these read as a person and not a
>   directory listing

Then it's a straight copy-paste into the `bio: '...'` line for that person
in `src/data/team.ts`. Happy to write the polished version from whatever
rough notes come back — just paste them in and ask.
