#!/usr/bin/env bash
# netlify dev reads netlify.toml only — payment-blocker edge on "/*" hangs locally.
# Temporarily swap in netlify.dev.toml (no edge functions), restore on exit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOML="$ROOT/netlify.toml"
DEV_TOML="$ROOT/netlify.dev.toml"
BACKUP="$ROOT/.netlify.toml.production.bak"

cleanup() {
  if [[ -f "$BACKUP" ]]; then
    mv "$BACKUP" "$TOML"
  fi
}
trap cleanup EXIT INT TERM

cp "$TOML" "$BACKUP"
cp "$DEV_TOML" "$TOML"

cd "$ROOT"
# Prefer IPv4 for localhost so the :8888 → framework proxy hits Vite on 0.0.0.0/127.0.0.1
# instead of hanging on ::1 when Vite is not listening on IPv6.
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--dns-result-order=ipv4first"
exec netlify dev "$@"
