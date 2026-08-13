#!/usr/bin/env bash
# Use Homebrew Node 20 for Expo (works even when global `node -v` is 24+).
set -euo pipefail

for dir in /opt/homebrew/opt/node@20/bin /usr/local/opt/node@20/bin; do
  if [[ -x "$dir/node" ]]; then
    export PATH="$dir:$PATH"
    break
  fi
done

major="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$major" != "20" ]]; then
  echo ""
  echo "Expo needs Node 20.x (current: $(node -v))."
  echo "Install: brew install node@20"
  echo "Then run this command again."
  echo ""
  exit 1
fi

exec "$@"
