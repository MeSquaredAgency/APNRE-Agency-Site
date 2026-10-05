# Listings feed (PropertyMe → website)

`/buy/`, `/rent/`, `/sold/` and `/commercial/` show APN's listings from
PropertyMe, with a page for each property. Until the feed is set up they link to the
realestate.com.au profile instead, so nothing breaks in the meantime.

## How it works

```
PropertyMe ──FTP──▶ feed server ──HTTPS──▶ Cloudflare Pages build ──▶ apnre.com.au
             (one XML file      (bundle of every      (pages for each
              per listing)       file + rebuild)       listing)
```

1. PropertyMe uploads a REAXML file to the feed server over FTP each time
   a listing changes, named like `APNRE_<date-time>_<number>_live.xml`.
   That's PropertyMe's "custom listings" integration. It only supports
   plain FTP, and photos come as links to PropertyMe's servers, not files.
2. Every 5 minutes, `apn-feed-sync.py` on the server checks for changes.
   If there are any, it moves files that only hold an older version of a
   listing to `/srv/propertyme-archive/`, bundles the rest into one
   `listings.json` (leaving out the FTP login PropertyMe puts in every
   file), and calls the Cloudflare Pages deploy hook. It also rebuilds
   once a night so past inspection times drop off.
3. The build (`scripts/fetch-listings.mjs`) downloads the bundle and turns
   it into listings (`scripts/reaxml.mjs`). Each listing then gets its
   own page alongside the rest of the site (`scripts/routes.mjs`).
4. Photos. PropertyMe's (on `docs.propertyme.com`) are large JPEGs
   (rentals 800px at about 200 KB, sales often bigger), over plain http
   only, and PropertyMe deletes them about a month after upload. So the
   feed server downloads each photo and floor plan once, while it's
   there, and keeps two WebP copies in `/var/www/feed/photos/`: up to
   1600px for a listing's main photo, and 800px (about 30–40 KB) for
   cards and thumbnails. The first copy of a listing's photos takes a
   while on the small server (about 7 seconds a photo); after that only
   new photos are copied. The build downloads the copies into the site
   as `/listing-photos/<file>.webp`, cached for a year. A photo
   the server hasn't copied yet loads from `/listing-photo/<file>`
   instead (`functions/listing-photo/[file].ts`), which fetches it from
   PropertyMe. A photo that failed to copy is retried each night; the
   failures are in `/var/log/apn-feed.log`.

A new or changed listing shows on the site about 10 minutes after it's
saved in PropertyMe: up to 7 minutes for the server to notice, then the
build.

Leases that aren't homes (PropertyMe types such as Offices, Retail and
Other; anything not a REAXML home type, in `RESIDENTIAL` in
`scripts/reaxml.mjs`) go on `/commercial/` instead of `/rent/`, each
with its own page. Two addresses are APN's own buildings
(`apnBuildingOf`):

- **420 Main North Road, Blair Athol:** PropertyMe has one listing for
  the whole floor ("Shared Office Spaces - Private Rooms"), with no page
  of its own. Its photos are the "Take a look inside" gallery on
  `/office-space/`, and its card on `/commercial/` links there with the
  page's own "from" price. Each room's availability still comes from
  `src/data/office-space.ts`.
- **178 Commercial Street East, Mount Gambier:** listed on
  `/commercial/` like the rest, with a note that it's in APN's own
  building.

Commercial property *for sale* stays on `/buy/`.

PropertyMe puts a street's direction in the suburb ("Commercial St" in
"E Mount Gambier"); `splitSuburb` moves it back onto the street.

Only current listings for sale or rent and recent sales (the latest 24)
show up. Leased, withdrawn and off-market listings drop off at the next
build, and their pages go with them.

## Setting it up

You'll need: a Google account that can create a Google Cloud project, a
Cloudflare login for the `apnre.com.au` zone and the Pages project, and an
Admin login for PropertyMe.

### 1. Google Cloud project and billing

1. At <https://console.cloud.google.com/>, create a project called
   `apn-listings-feed`.
2. Billing → link a billing account. Pick the business's existing
   Google payments profile, the one Google Ads or Workspace use, so it's
   all on the same card.
3. Billing → Budgets & alerts → create a budget of A$5 a month, with
   emails at 50%, 90% and 100%. The server should cost little or
   nothing, and this tells you if that changes.

**Cost.** Google's free tier includes one e2-micro server, with a 30 GB
standard disk, in us-west1, us-central1 or us-east1. Google has also
charged for public IPv4 addresses since 2024. Check the cost estimate on
the "Create instance" page before creating it, and expect up to about
US$4 a month for the address if the free tier doesn't cover it. Uploads
from PropertyMe count as inbound traffic, which is free. The bundle the
build downloads is small.

### 2. The server

Compute Engine → VM instances → Create instance:

- **Name:** `apn-feed`
- **Region:** `us-west1`, `us-central1` or `us-east1`. Only these are in
  the free tier. Being in the US doesn't matter for an upload feed.
- **Machine type:** `e2-micro`
- **Boot disk:** Ubuntu 24.04 LTS, *Standard persistent disk*, 30 GB
- **Networking → Network tags:** `apn-feed`
- **Networking → External IPv4 address:** *Reserve static external IP
  address*, named `apn-feed`. Note the address down.

### 3. Firewall

VPC network → Firewall → Create firewall rule, twice. Both rules use
Targets: *Specified target tags*, `apn-feed`.

| Name | Source IPv4 ranges | Ports (TCP) |
|---|---|---|
| `apn-feed-ftp` | PropertyMe's upload IPs (ask PropertyMe) | `21, 40000-40100` |
| `apn-feed-web` | `0.0.0.0/0` | `80, 443` |

PropertyMe's uploads aren't encrypted, so limiting FTP to their IP
addresses is what keeps everyone else out. If PropertyMe hasn't sent
their IPs yet, use `0.0.0.0/0` to get going. Then tighten it as soon as
you have them, and the FTP password still protects it in the meantime.

### 4. DNS

In Cloudflare (`apnre.com.au` → DNS), add an `A` record: name `feed`,
value the static IP from step 2, proxy status **DNS only** (grey cloud).
FTP doesn't go through Cloudflare's proxy.

### 5. Software

**Shortcut:** upload the files in `scripts/feed-server/` and run
`sudo bash setup.sh`. That does steps 5, 6 and 8, apart from the FTP
password (`sudo passwd propertyme`) and the Cloudflare settings. It's
safe to run again. The manual steps follow.

Open the server's SSH window (VM instances → SSH). Then:

```bash
sudo timedatectl set-timezone Australia/Adelaide
sudo apt update && sudo apt install -y vsftpd caddy
```

Use the SSH window's **Upload file** button to upload the files in
`scripts/feed-server/` from this repo. They land in your home folder.
Then:

```bash
sudo install -m 644 vsftpd.conf /etc/vsftpd.conf
sudo install -m 755 apn-feed-sync.py /usr/local/bin/apn-feed-sync.py
sudo install -m 644 apn-feed.cron /etc/cron.d/apn-feed
sudo install -m 644 Caddyfile /etc/caddy/Caddyfile
sudo sed -i "s/REPLACE_WITH_STATIC_IP/$(curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)/" /etc/vsftpd.conf
grep pasv_address /etc/vsftpd.conf
```

The last line should show the static IP.

### 6. The FTP account for PropertyMe

```bash
sudo useradd --home-dir /srv/propertyme --create-home --shell /usr/sbin/nologin propertyme
sudo passwd propertyme
echo propertyme | sudo tee /etc/vsftpd.userlist
# vsftpd normally refuses accounts that can't log in to a shell; this
# one is FTP only, on purpose.
sudo sed -i 's/^auth\s\+required\s\+pam_shells.so/# &/' /etc/pam.d/vsftpd
sudo systemctl restart vsftpd
```

Choose a long random password for `passwd` and keep it in the password
manager. It goes into PropertyMe in step 9.

### 7. The rebuild hook

In Cloudflare: Workers & Pages → the site's Pages project → Settings →
Builds → Deploy hooks → Add, named `listings feed`, branch `main`. Copy the
URL, then on the server:

```bash
echo 'DEPLOY_HOOK_URL=<paste the URL>' | sudo tee /etc/apn-feed.env
sudo chmod 600 /etc/apn-feed.env
```

### 8. The bundle's token

```bash
TOKEN=$(openssl rand -hex 32)
echo "FEED_TOKEN=$TOKEN" | sudo tee /etc/caddy/feed.env
sudo chmod 640 /etc/caddy/feed.env && sudo chgrp caddy /etc/caddy/feed.env
sudo mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=/etc/caddy/feed.env\n' | sudo tee /etc/systemd/system/caddy.service.d/feed.conf
sudo systemctl daemon-reload && sudo systemctl restart caddy
echo "$TOKEN"
```

Copy the token it prints. Then in the Pages project → Settings →
Variables and Secrets, add these for **Production** (and Preview, if
preview builds should show listings):

| Name | Value |
|---|---|
| `LISTINGS_FEED_URL` | `https://feed.apnre.com.au/listings.json` |
| `LISTINGS_FEED_TOKEN` | the token (type: Secret) |
| `LISTINGS_AGENT_ID` | the AgentID from step 9 |

Until PropertyMe has uploaded something, the bundle doesn't exist yet and
the build fails. Make the bundle once by hand, so builds work straight
away:

```bash
sudo /usr/local/bin/apn-feed-sync.py --daily
```

### 9. PropertyMe

As a Subscriber or Admin: portfolio name (top left) → Portfolio Settings →
Integrations → Custom → Add:

- **Enabled:** Yes
- **Name:** APN website
- **AgentID:** pick one, e.g. `APNRE`, and use the same value for
  `LISTINGS_AGENT_ID` above. The build skips listings with any other
  AgentID.
- **FTP URL:** `feed.apnre.com.au`
- **Port:** `21`
- **User name / password:** `propertyme` and the password from step 6

Click **Test Connection**, then **Save**.

### 10. Try one listing first

Enable the integration on a single listing (the listing → Advertising →
your custom listing → Actions → Enable). Within about 10 minutes it
should be on `/buy/` or `/rent/`. Before enabling the rest, check:

- The photos and floor plans load (through `/listing-photo/`).
- The price, address and inspections match PropertyMe. Then mark the
  listing as leased or withdrawn and check it disappears.

## Day to day

- **Each listing has to be enabled for the website in PropertyMe.** If
  one is on realestate.com.au but not the site, that's almost always why.
- Hidden prices and hidden street addresses stay hidden. The page shows
  the agent's price wording, or "Contact agent", and the suburb only.
- Enquiries from a property's page go to the same Google Sheet as every
  other form, with Source *Listing enquiry*, the address in the Address
  column and PropertyMe's listing ID in the message.

## When something's wrong

- **A listing isn't showing.** Is it enabled for the website in
  PropertyMe, and is it current? Then check the build log in Cloudflare
  (Pages project → Deployments → the latest → build log). The
  `Listings:` line counts what was found, and lists anything skipped and
  why.
- **No rebuild happened.** On the server, `sudo tail /var/log/apn-feed.log`
  shows each rebuild request. `sudo tail /var/log/vsftpd.log` shows
  PropertyMe's uploads.
- **The build fails with "Listings feed: … returned 403".** The token in
  Cloudflare doesn't match `/etc/caddy/feed.env`.
- **The build fails with "… returned 404".** There's no bundle yet: run
  the command at the end of step 8.
- When the feed can't be read the build stops, and the last good version
  of the site stays live. It never publishes an empty listings page
  because of a feed problem.

## Working on the pages locally

`npm run dev:sample` builds the site with the made-up listings in
`scripts/sample-listings/`. `npm run dev` uses the real feed if
`LISTINGS_FEED_URL` and `LISTINGS_FEED_TOKEN` are set in your shell, and
otherwise shows the realestate.com.au fallback. The sample listings can
never reach the live site: `--sample` refuses to run on Cloudflare.
