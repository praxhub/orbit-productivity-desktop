#!/usr/bin/env bash
set -euo pipefail
UUID='orbit-desktop-layer@local'
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
EXT_ROOT="$HOME/.local/share/gnome-shell/extensions"
EXT_DIR="$EXT_ROOT/$UUID"
STATE_ROOT="$HOME/.local/share/orbit-study-focus-v12"
BACKUP_ROOT="$STATE_ROOT/backups"
ARCHIVE_ROOT="$HOME/.local/share/orbit-desktop-layer/archived-backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$STAMP"

for f in extension.js stylesheet.css metadata.json; do
  [[ -f "$SCRIPT_DIR/$f" ]] || { echo "ERROR: package is missing $f" >&2; exit 1; }
done
python3 - "$SCRIPT_DIR/metadata.json" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as f: m=json.load(f)
assert m.get('uuid') == 'orbit-desktop-layer@local'
assert int(m.get('version',0)) == 12
print('ORBIT v12 metadata: OK')
PY
if command -v node >/dev/null 2>&1; then
  node --check --input-type=module < "$SCRIPT_DIR/extension.js"
  echo 'JavaScript syntax: OK'
fi
mkdir -p "$EXT_ROOT" "$BACKUP_DIR" "$STATE_ROOT" "$ARCHIVE_ROOT"
if [[ -d "$EXT_DIR" ]]; then
  for f in extension.js stylesheet.css metadata.json; do
    if [[ -f "$EXT_DIR/$f" ]]; then cp -p "$EXT_DIR/$f" "$BACKUP_DIR/$f"; fi
  done
  printf '%s\n' "$BACKUP_DIR" > "$STATE_ROOT/LAST_BACKUP"
  echo "Backup created: $BACKUP_DIR"
else
  echo 'No previous ORBIT folder detected; installing v12 as a new extension.'
  printf 'NEW_INSTALL\n' > "$STATE_ROOT/LAST_BACKUP"
fi
# Keep legacy backup directories out of GNOME's extension scan directory.
shopt -s nullglob
for d in "$EXT_ROOT/$UUID".backup-* "$EXT_ROOT/$UUID".layer-backup-* "$EXT_ROOT/$UUID".photo-backup-*; do
  if [[ -d "$d" && ! -f "$d/metadata.json" ]]; then
    mv -- "$d" "$ARCHIVE_ROOT/$(basename "$d")"
  fi
done
shopt -u nullglob

gnome-extensions disable "$UUID" >/dev/null 2>&1 || true
mkdir -p "$EXT_DIR"
for f in extension.js stylesheet.css metadata.json; do cp -p "$SCRIPT_DIR/$f" "$EXT_DIR/$f"; done
chmod 0644 "$EXT_DIR/extension.js" "$EXT_DIR/stylesheet.css" "$EXT_DIR/metadata.json"
gnome-extensions enable "$UUID" >/dev/null 2>&1 || true
sleep 2
STATUS="$(gnome-extensions show "$UUID" 2>&1 || true)"
printf '\n%s\n' "$STATUS"
if grep -q 'State: ERROR' <<<"$STATUS"; then
  echo 'GNOME reported ERROR; restoring previous extension files.' >&2
  gnome-extensions disable "$UUID" >/dev/null 2>&1 || true
  if [[ -f "$BACKUP_DIR/extension.js" && -f "$BACKUP_DIR/stylesheet.css" && -f "$BACKUP_DIR/metadata.json" ]]; then
    cp -p "$BACKUP_DIR/extension.js" "$BACKUP_DIR/stylesheet.css" "$BACKUP_DIR/metadata.json" "$EXT_DIR/"
    gnome-extensions enable "$UUID" >/dev/null 2>&1 || true
  else
    rm -rf -- "$EXT_DIR"
  fi
  exit 2
fi

# Apply the included wallpaper, but save the user's previous settings only once.
if [[ -f "$SCRIPT_DIR/ORBIT-Minimal-Black-Wallpaper.jpg" ]] && command -v gsettings >/dev/null 2>&1; then
  mkdir -p "$HOME/Pictures"
  WALL_DEST="$HOME/Pictures/ORBIT-Minimal-Black-Wallpaper.jpg"
  cp -p "$SCRIPT_DIR/ORBIT-Minimal-Black-Wallpaper.jpg" "$WALL_DEST"
  WALL_STATE="$STATE_ROOT/previous-wallpaper.txt"
  if [[ ! -f "$WALL_STATE" ]]; then
    { gsettings get org.gnome.desktop.background picture-uri; gsettings get org.gnome.desktop.background picture-uri-dark; gsettings get org.gnome.desktop.background picture-options; } > "$WALL_STATE"
  fi
  gsettings set org.gnome.desktop.background picture-uri "file://$WALL_DEST"
  gsettings set org.gnome.desktop.background picture-uri-dark "file://$WALL_DEST"
  gsettings set org.gnome.desktop.background picture-options 'zoom'
fi
printf '\nORBIT v12 installed.\n'
printf 'Clock/greeting panel height is fixed and both parts are vertically centered.\n'
printf 'Pomodoro caption uses centered single-line layout.\n'
printf 'Tasks: ~/.local/share/orbit-desktop-layer/tasks.json\n'
printf 'Study sessions: ~/.local/share/orbit-desktop-layer/study-sessions.json\n'
printf 'Personal photos stay in ~/Pictures/ORBIT-Memories.\n'
printf 'No news/video panel or video dependency remains in v12.\n'
printf 'If state is INACTIVE, log out and back in once.\n'
printf 'Rollback extension: bash ./RESTORE-ORBIT-STUDY-FOCUS.sh\n'
printf 'Restore wallpaper: bash ./RESTORE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh\n'
