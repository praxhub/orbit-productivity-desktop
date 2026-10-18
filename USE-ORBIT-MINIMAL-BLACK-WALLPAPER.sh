#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/ORBIT-Minimal-Black-Wallpaper.jpg"
DEST="$HOME/Pictures/ORBIT-Minimal-Black-Wallpaper.jpg"
STATE_DIR="$HOME/.local/share/orbit-study-focus-v12"
mkdir -p "$HOME/Pictures" "$STATE_DIR"
[[ -f "$SRC" ]] || { echo "Wallpaper missing: $SRC" >&2; exit 1; }
if [[ ! -f "$STATE_DIR/previous-wallpaper.txt" ]]; then
  { gsettings get org.gnome.desktop.background picture-uri; gsettings get org.gnome.desktop.background picture-uri-dark; gsettings get org.gnome.desktop.background picture-options; } > "$STATE_DIR/previous-wallpaper.txt"
fi
cp -p "$SRC" "$DEST"
gsettings set org.gnome.desktop.background picture-uri "file://$DEST"
gsettings set org.gnome.desktop.background picture-uri-dark "file://$DEST"
gsettings set org.gnome.desktop.background picture-options 'zoom'
echo "Applied wallpaper: $DEST"
