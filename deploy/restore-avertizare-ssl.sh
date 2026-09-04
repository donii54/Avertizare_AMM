#!/bin/bash
# Re-apply the sslip.io SNI vhost after Webuzo midnight vhost rebuild.
# Cron (as root):  5 0 * * * /usr/local/sbin/restore-avertizare-ssl.sh
set -euo pipefail

CONF=/usr/local/apps/apache2/etc/conf.d/avertizare-ssl.conf
SRC="$(dirname "$0")/apache/avertizare-ssl.conf"
if [ ! -f "$SRC" ]; then
  SRC=/root/avertizare-ssl.conf
fi
CERT=/etc/zerossl/avertizare.31.131.24.146.sslip.io/fullchain.pem
KEY=/etc/zerossl/avertizare.31.131.24.146.sslip.io/privkey.pem

if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo "missing zerossl certs" >&2
  exit 1
fi

if [ ! -f "$CONF" ] || ! grep -q "avertizare.31.131.24.146.sslip.io" "$CONF"; then
  cp -a "$SRC" "$CONF"
fi

/usr/local/apps/apache2/bin/httpd -t
kill -USR1 "$(cat /usr/local/apps/apache2/logs/httpd.pid)"
