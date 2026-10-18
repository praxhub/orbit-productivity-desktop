#!/usr/bin/env bash
set -euo pipefail
STATE="$HOME/.local/share/orbit-study-focus-v12/previous-wallpaper.txt"
[[ -f "$STATE" ]] || { echo 'No saved original wallpaper settings.' >&2; exit 1; }
mapfile -t values < "$STATE"
[[ "${#values[@]}" -ge 3 ]] || { echo 'Wallpaper backup is incomplete.' >&2; exit 1; }
for i in 0 1 2; do values[$i]="${values[$i]#\'}"; values[$i]="${values[$i]%\'}"; done
gsettings set org.gnome.desktop.background picture-uri "${values[0]}"
gsettings set org.gnome.desktop.background picture-uri-dark "${values[1]}"
gsettings set org.gnome.desktop.background picture-options "${values[2]}"
echo 'Restored original GNOME wallpaper settings.'
