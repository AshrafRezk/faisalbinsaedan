#!/usr/bin/env bash
# netlify dev reads netlify.toml only — payment-blocker edge on "/*" hangs locally.
# Temporarily swap in netlify.dev.toml (no edge functions), restore on exit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOML="$ROOT/netlify.toml"
DEV_TOML="$ROOT/netlify.dev.toml"
BACKUP="$ROOT/.netlify.toml.production.bak"

# Netlify Edge Functions for local dev
# This specific edge function breaks `netlify dev` (ports accept but never respond),
# so we temporarily disable it while running locally.
EDGE_FUNC="$ROOT/netlify/edge-functions/payment-blocker.ts"
EDGE_FUNC_DISABLED="$ROOT/netlify/edge-functions/payment-blocker.ts.disabled"
EDGE_FUNC_WAS_PRESENT=0

cleanup() {
  if [[ -f "$BACKUP" ]]; then
    mv "$BACKUP" "$TOML"
  fi

  # Restore disabled edge function if we moved it for dev.
  if [[ "$EDGE_FUNC_WAS_PRESENT" -eq 1 ]]; then
    if [[ -f "$EDGE_FUNC_DISABLED" ]]; then
      mv "$EDGE_FUNC_DISABLED" "$EDGE_FUNC"
    fi
  fi
}
trap cleanup EXIT INT TERM

cp "$TOML" "$BACKUP"
cp "$DEV_TOML" "$TOML"

# Disable edge function for `netlify dev` stability.
if [[ -f "$EDGE_FUNC" && ! -f "$EDGE_FUNC_DISABLED" ]]; then
  mv "$EDGE_FUNC" "$EDGE_FUNC_DISABLED"
  EDGE_FUNC_WAS_PRESENT=1
fi

cd "$ROOT"
# Prefer IPv4 for localhost so the :8888 → framework proxy hits Vite on 0.0.0.0/127.0.0.1
# instead of hanging on ::1 when Vite is not listening on IPv6.
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--dns-result-order=ipv4first"
exec netlify dev "$@"
