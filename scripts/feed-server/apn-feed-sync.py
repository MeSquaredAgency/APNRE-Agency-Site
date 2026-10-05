#!/usr/bin/env python3
"""Runs every few minutes on the listings feed server (from cron; see
docs/listings-feed.md). When PropertyMe has changed the files in the FTP
inbox, it bundles them into one JSON file for the site's build to
download (served by Caddy, behind a token) and asks Cloudflare Pages to
rebuild the site.

  apn-feed-sync.py           rebuild only if the inbox changed
  apn-feed-sync.py --daily   rebuild anyway, so past inspection times drop off

Settings come from /etc/apn-feed.env (see setup step 7):
  DEPLOY_HOOK_URL   the Cloudflare Pages deploy hook
"""

import hashlib
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


def decode(raw):
    # REAXML is usually UTF-8, but older feeds use Windows-1252.
    try:
        return raw.decode('utf-8')
    except UnicodeDecodeError:
        return raw.decode('cp1252', errors='replace')


def write_bundle(files):
    bundle = {
        'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
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
    write_bundle(files)
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
    main()
