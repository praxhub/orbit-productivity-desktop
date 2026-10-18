#!/usr/bin/env bash
set -euo pipefail
UUID='orbit-desktop-layer@local'
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
STATE_ROOT="$HOME/.local/share/orbit-study-focus-v12"
STATE="$STATE_ROOT/LAST_BACKUP"
[[ -f "$STATE" ]] || { echo 'No v12 backup has been recorded.' >&2; exit 1; }
BACKUP_DIR="$(cat "$STATE")"
if [[ "$BACKUP_DIR" == 'NEW_INSTALL' ]]; then
  gnome-extensions disable "$UUID" >/dev/null 2>&1 || true
  rm -rf -- "$EXT_DIR"
  echo 'Removed ORBIT v12 (there was no prior extension to restore).'
  exit 0
fi
for f in extension.js stylesheet.css metadata.json; do [[ -f "$BACKUP_DIR/$f" ]] || { echo "Backup incomplete: $f" >&2; exit 1; }; done
gnome-extensions disable "$UUID" >/dev/null 2>&1 || true
for f in extension.js stylesheet.css metadata.json; do cp -p "$BACKUP_DIR/$f" "$EXT_DIR/$f"; done
gnome-extensions enable "$UUID" >/dev/null 2>&1 || true
echo "Previous ORBIT extension restored from: $BACKUP_DIR"
gnome-extensions show "$UUID" 2>&1 || true
