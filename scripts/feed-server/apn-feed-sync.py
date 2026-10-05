#!/usr/bin/env python3
"""Runs every few minutes on the listings feed server (from cron; see
docs/listings-feed.md). When PropertyMe has changed the files in the FTP
inbox, it bundles them into one JSON file for the site's build to
download (served by Caddy, behind a token) and asks Cloudflare Pages to
rebuild the site.

It also keeps WebP copies of each listing's photos and floor plans
(copy_photos), because PropertyMe's are slow, heavy JPEGs that it
deletes about a month after upload.

  apn-feed-sync.py           rebuild only if the inbox changed
  apn-feed-sync.py --daily   rebuild anyway, so past inspection times drop
                             off, and retry any photo that failed to copy

Settings come from /etc/apn-feed.env (see setup step 7):
  DEPLOY_HOOK_URL   the Cloudflare Pages deploy hook
"""

import fcntl
import hashlib
import io
import json
import os
import re
import shutil
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

INBOX = Path('/srv/propertyme')
BUNDLE = Path('/var/www/feed/listings.json')
# Older versions of each listing, moved out of the inbox (see archive_old).
ARCHIVE = Path('/srv/propertyme-archive')
STATE = Path('/var/lib/apn-feed/last-sync')
LOCK = Path('/var/lib/apn-feed/lock')
# WebP copies of the feed's photos, served (behind the same token as the
# bundle) for the site's build to download. manifest.json maps each
# PropertyMe file name to its copy.
PHOTOS = Path('/var/www/feed/photos')
MANIFEST = PHOTOS / 'manifest.json'
PROPERTYME_MEDIA = re.compile(r'^https?://docs\.propertyme\.com/listing/([\w-]+\.(?:jpe?g|png|gif|webp))$', re.IGNORECASE)
# PropertyMe's photos are 800px wide; floor plans can be bigger.
MAX_WIDTH = 1600
# Wait until nothing has changed for this long, so a burst of uploads
# (PropertyMe updating several listings at once) becomes one rebuild.
SETTLE_SECONDS = 120


def read_env(path='/etc/apn-feed.env'):
    env = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            env[key.strip()] = value.strip().strip('"\'')
    return env


def xml_files():
    return sorted(p for p in INBOX.rglob('*') if p.is_file() and p.suffix.lower() == '.xml')


def signature(files):
    """Changes whenever a file is added, replaced or deleted."""
    h = hashlib.sha256()
    for p in files:
        st = p.stat()
        h.update(f'{p.relative_to(INBOX)}|{st.st_size}|{st.st_mtime_ns}\n'.encode())
    return h.hexdigest()


# PropertyMe repeats the FTP login in every file it uploads
# (<propertyList username="..." password="...">). The site doesn't need
# it, so it never leaves this server.
LOGIN_ATTRS = re.compile(r'\s(?:username|password)="[^"]*"', re.IGNORECASE)


def listings_in(path):
    """(uniqueID, modTime) for each listing in a file; [] if unreadable."""
    try:
        root = ET.parse(path).getroot()
    except (ET.ParseError, OSError):
        return []
    return [
        (el.findtext('uniqueID').strip(), el.get('modTime', ''))
        for el in root
        if (el.findtext('uniqueID') or '').strip()
    ]


def archive_old(files):
    """PropertyMe uploads a new file every time a listing changes, rather
    than replacing the old one. Moves files that only hold older versions
    to ARCHIVE, so the bundle (and every build's download) stays small.
    Unreadable files stay put; the build reports them. Returns what's
    left in the inbox."""
    found = {path: listings_in(path) for path in files}
    newest = {}
    for path, listings in found.items():
        for uid, mod in listings:
            version = (mod, path.stat().st_mtime)
            if uid not in newest or version > newest[uid][0]:
                newest[uid] = (version, path)
    keep = {path for _, path in newest.values()}
    left = []
    for path, listings in found.items():
        if listings and path not in keep:
            ARCHIVE.mkdir(parents=True, exist_ok=True)
            shutil.move(str(path), str(ARCHIVE / path.name))
        else:
            left.append(path)
    return left


def media_names(files):
    """PropertyMe file names of every photo and floor plan in the files."""
    names = set()
    for path in files:
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError):
            continue
        for el in root.iter():
            if el.tag in ('img', 'floorplan'):
                match = PROPERTYME_MEDIA.match((el.get('url') or '').strip())
                if match:
                    names.add(match.group(1))
    return names


def copy_photos(names):
    """Downloads each photo or floor plan not copied yet, while PropertyMe
    still has it, and saves it as WebP (about a seventh of the size).
    Copies are kept, so a listing keeps its photos after PropertyMe
    deletes them. A failed download is logged and retried on a later
    run. Returns the manifest entries for `names`."""
    from PIL import Image, ImageOps  # apt install python3-pil

    PHOTOS.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for name in sorted(names):
        entry = manifest.get(name)
        if entry and (PHOTOS / entry['file']).exists():
            continue
        try:
            with urllib.request.urlopen(f'http://docs.propertyme.com/listing/{name}', timeout=60) as res:
                raw = res.read()
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGBA' if 'transparency' in img.info or 'A' in img.getbands() else 'RGB')
            if img.width > MAX_WIDTH:
                img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
            out = Path(name).stem + '.webp'
            tmp = PHOTOS / (out + '.tmp')
            img.save(tmp, 'WEBP', quality=80)
            tmp.chmod(0o644)
            os.replace(tmp, PHOTOS / out)
            manifest[name] = {'file': out, 'width': img.width, 'height': img.height}
        except Exception as err:  # one bad photo shouldn't stop the rest
            print(f'{datetime.now().isoformat(timespec="seconds")} photo {name} not copied: {err}')
    tmp = MANIFEST.with_suffix('.tmp')
    tmp.write_text(json.dumps(manifest))
    tmp.chmod(0o644)
    os.replace(tmp, MANIFEST)
    return {name: manifest[name] for name in names if name in manifest}


def decode(raw):
    # REAXML is usually UTF-8, but older feeds use Windows-1252.
    try:
        return raw.decode('utf-8')
    except UnicodeDecodeError:
        return raw.decode('cp1252', errors='replace')


def write_bundle(files, photos):
    bundle = {
        'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        # PropertyMe file name → our copy in photos/ (copy_photos).
        'photos': photos,
        'files': [
            {
                'name': str(p.relative_to(INBOX)),
                'modified': datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat(timespec='seconds'),
                'xml': LOGIN_ATTRS.sub('', decode(p.read_bytes())),
            }
            for p in files
        ],
    }
    BUNDLE.parent.mkdir(parents=True, exist_ok=True)
    tmp = BUNDLE.with_suffix('.tmp')
    tmp.write_text(json.dumps(bundle))
    tmp.chmod(0o644)
    os.replace(tmp, BUNDLE)  # atomic, so a build never reads half a file


def trigger_build(hook):
    req = urllib.request.Request(hook, method='POST', data=b'')
    with urllib.request.urlopen(req, timeout=30) as res:
        if res.status >= 300:
            raise RuntimeError(f'deploy hook returned {res.status}')


def main():
    daily = '--daily' in sys.argv
    files = xml_files()
    sig = signature(files)
    last = STATE.read_text().strip() if STATE.exists() else ''

    if sig == last and not daily:
        return
    newest = max((p.stat().st_mtime for p in files), default=0)
    if sig != last and time.time() - newest < SETTLE_SECONDS:
        return  # still uploading; try again next run

    files = archive_old(files)
    sig = signature(files)
    write_bundle(files, copy_photos(media_names(files)))
    hook = read_env().get('DEPLOY_HOOK_URL', '')
    if not hook:
        # Setup step 7 isn't done yet. The bundle is ready; the rebuild is
        # asked for on the first run after the hook is added.
        print('DEPLOY_HOOK_URL is not set in /etc/apn-feed.env; bundle written, no rebuild requested')
        return
    trigger_build(hook)
    # Only remembered once the rebuild has been asked for, so a failed
    # request is retried on the next run.
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(sig)
    print(f'{datetime.now().isoformat(timespec="seconds")} bundled {len(files)} file(s), rebuild requested'
          + (' (daily)' if daily else ''))


if __name__ == '__main__':
    # Copying a new listing's photos can outlast the 5 minutes between
    # cron runs, so only one run at a time.
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCK, 'w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            sys.exit(0)
        main()
