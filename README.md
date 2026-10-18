# ORBIT v12 — Study Focus + Minimal Black

A local-first GNOME Shell 50 desktop layer for Ubuntu. The current release focuses on time, tasks, Pomodoro, personal photo memories, local study/break tracking, and a daily Thirukkural. **The News/video panel is intentionally removed.**

## v12 alignment fix

The clock/greeting hero card is now constrained to a deliberate height. The old expanding inner clock row caused the card to consume the left column's unused vertical space, leaving the dial low in the panel while the greeting stayed at the top. The row fills the fixed-height card, the clock remains a fixed 168×168 circle, and the greeting stack is vertically centered alongside it. The v11 Pomodoro dial uses a centered overlay instead of spacer actors so its caption cannot clip to `FOCU-`.

## Features

- Minimal matte-black wallpaper with restrained orange accents.
- Live time/date, greeting, daily quote, and a scenic quote area.
- To-do list with priorities, Today/Upcoming/Completed views, and a selectable month/day calendar for deadlines.
- Large Pomodoro: Focus (25 min), Short Break (5 min), Long Break (15 min).
- Local study and break history with today totals, hourly focus summary and recent sessions.
- Memories from `~/Pictures/ORBIT-Memories`.
- Daily Thirukkural in Tamil, English meaning, and explanation.
- Native desktop background-group placement so the layer remains beneath ordinary app windows.

## Local data

- Tasks: `~/.local/share/orbit-desktop-layer/tasks.json`
- Study history: `~/.local/share/orbit-desktop-layer/study-sessions.json`
- Personal photos: `~/Pictures/ORBIT-Memories/`

The source/publish script does not upload any of this local data.

## Install/update on Ubuntu GNOME 50

```bash
bash ./INSTALL-ORBIT-STUDY-FOCUS.sh
```

The installer backs up the currently installed extension outside GNOME's extension-scanning directory. If it reports `INACTIVE`, log out and back in once. Verify with:

```bash
gnome-extensions show orbit-desktop-layer@local
```

Restore the previous extension:

```bash
bash ./RESTORE-ORBIT-STUDY-FOCUS.sh
```

Restore your prior wallpaper settings:

```bash
bash ./RESTORE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh
```

## Publish the latest source to GitHub

Run:

```bash
bash ./PUBLISH-TO-GITHUB.sh
```

The publisher commits only the known source, installer/restore scripts, documentation, metadata, and included wallpaper. It never uploads tasks, study history, personal photos, or files from your home data directory. If GitHub CLI (`gh`) is installed and authenticated, the script can create a new repository (private by default); otherwise, create an empty repository at https://github.com/new and provide its HTTPS or SSH URL. Authentication uses your configured `gh` or Git credential/SSH setup; do not put access tokens in the script.

## Verification status

JavaScript module syntax, shell-script syntax, metadata JSON, and ZIP integrity are checked as part of the build. Actual rendering still needs confirmation in the target user's GNOME Shell session.
