# Team section: photo consistency + bios

## Photos

Everyone's headshot comes from one matching set supplied in October 2026
(office background, city window, dark jacket), as the director's review
asked: never mix styles. The originals were 1024×1536; each was cropped
to the site's 4:5 frame (1024×1280) with the eyes a third of the way
down, so faces sit level across a row of cards. The crop is baked into
the files in `src/assets/team/`, so `focalPoint` isn't needed.

To add or replace someone, use a photo from the same set (or a new set
for everyone), crop it the same way, and save it under the same name.

## Bios

`bio` is optional on `TeamMember`, but everyone on the page now has one.
Breeanna Arney (Property Management Trainee, Mount Gambier) supplied hers
in September 2026; she was previously listed as reception with no bio.

Everyone shown has a real supplied bio. Patrick supplied new ones for
Luke, Marissa, Breeanna, Brett and himself on 9 Oct 2026 (Jenny's is her
own). Each `bio` is a list of paragraphs. Luke also sent an expertise list that his profile page shows (`expertise` in
`src/data/team.ts`). For anyone new, the fastest path is a short async
brief — something like:

> For the new website, we're adding a two-to-three sentence intro under
> your photo. Could you send me:
> - How long you've been in property management / at APN
> - Anything you focus on or are known for (e.g. maintenance, a particular
>   area, tenant relations)
> - One human detail if you're comfortable (a hobby, why you like the job,
>   etc.) — optional, but it's what makes these read as a person and not a
>   directory listing

Then it's a straight copy-paste into the `bio: ['...']` list for that person (one string per paragraph)
in `src/data/team.ts`. Happy to write the polished version from whatever
rough notes come back — just paste them in and ask.
