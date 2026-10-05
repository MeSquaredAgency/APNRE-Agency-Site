#!/bin/bash
# Sets up the listings feed server: docs/listings-feed.md steps 5, 6 and 8,
# except the two things that need a person: the FTP password
# (sudo passwd propertyme) and the deploy hook (/etc/apn-feed.env).
# Run from the folder holding the other files in scripts/feed-server/:
#   sudo bash setup.sh
# Safe to run again.
set -euo pipefail

# Files copied from Windows may have CRLF line endings.
sed -i 's/\r$//' vsftpd.conf apn-feed-sync.py apn-feed.cron Caddyfile

timedatectl set-timezone Australia/Adelaide
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
# python3-pil: apn-feed-sync.py converts listing photos to WebP.
apt-get install -y -q vsftpd caddy python3-pil

install -m 644 vsftpd.conf /etc/vsftpd.conf
install -m 755 apn-feed-sync.py /usr/local/bin/apn-feed-sync.py
install -m 644 apn-feed.cron /etc/cron.d/apn-feed
install -m 644 Caddyfile /etc/caddy/Caddyfile

# Passive FTP has to tell PropertyMe the server's public IP.
IP=$(curl -s -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
sed -i "s/^pasv_address=.*/pasv_address=$IP/" /etc/vsftpd.conf

# The FTP-only account PropertyMe logs in as. Its password stays locked
# until someone sets one with: sudo passwd propertyme
id propertyme >/dev/null 2>&1 ||
  useradd --home-dir /srv/propertyme --create-home --shell /usr/sbin/nologin propertyme
echo propertyme > /etc/vsftpd.userlist
# vsftpd normally refuses accounts without a login shell; this one is
# FTP only, on purpose.
sed -i 's/^auth\s\+required\s\+pam_shells.so/# &/' /etc/pam.d/vsftpd
systemctl restart vsftpd

# The token the Cloudflare build sends to download the bundle. Made once;
# read it with: sudo cat /etc/caddy/feed.env
if [ ! -f /etc/caddy/feed.env ]; then
  (umask 027 && echo "FEED_TOKEN=$(openssl rand -hex 32)" > /etc/caddy/feed.env)
  chgrp caddy /etc/caddy/feed.env
fi
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=/etc/caddy/feed.env\n' > /etc/systemd/system/caddy.service.d/feed.conf
systemctl daemon-reload
systemctl restart caddy

# Where the deploy hook goes (step 7). Left empty until it's added.
[ -f /etc/apn-feed.env ] || (umask 077 && echo 'DEPLOY_HOOK_URL=' > /etc/apn-feed.env)

# A first (empty) bundle, so builds can read the feed straight away.
/usr/local/bin/apn-feed-sync.py --daily

echo
echo "Done. vsftpd: $(systemctl is-active vsftpd), caddy: $(systemctl is-active caddy), FTP passive address: $IP"
