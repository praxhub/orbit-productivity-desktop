# ORBIT Productivity Desktop

ORBIT is a local-first GNOME Shell desktop productivity layer for Ubuntu GNOME 50.x, designed with a minimal matte-black and orange interface.

## Features

- Live clock, date, greeting, and daily motivational text.
- To-do list with priorities, Today/Upcoming/Completed views, and a selectable calendar for task deadlines.
- Pomodoro timer with Focus (25 minutes), Short Break (5 minutes), and Long Break (15 minutes) modes.
- Local study/break tracking, daily totals, productive study-hour summary, and recent session history.
- Personal photo memories loaded from `~/Pictures/ORBIT-Memories/`.
- Daily Thirukkural in Tamil, English meaning, and explanation.
- Minimal black/orange styling and optional matching wallpaper.
- Desktop-layer placement intended to remain behind ordinary application windows.
- No news/video panel in v12.

## Requirements

- Ubuntu with GNOME Shell 50.x (developed for GNOME Shell 50.1).
- User extensions enabled.
- `bash` and `python3` for installer/utility scripts. Git is required for publishing.
- Node.js is used for JavaScript syntax checks when available.

## Install or update

From the project root:

```bash
bash ./INSTALL-ORBIT-STUDY-FOCUS.sh
```

Check the extension:

```bash
gnome-extensions show orbit-desktop-layer@local
```

If the extension remains inactive after an update, save your work and log out of Ubuntu, then log back in.

## Local data and privacy

Runtime data is stored locally and is not intended for GitHub:

- Tasks: `~/.local/share/orbit-desktop-layer/tasks.json`
- Study history: `~/.local/share/orbit-desktop-layer/study-sessions.json`
- Personal photos: `~/Pictures/ORBIT-Memories/`
- Wallpaper settings backup: `~/.local/share/orbit-study-focus-v12/previous-wallpaper.txt`

The `.gitignore` and `PUBLISH-TO-GITHUB.sh` are intended to exclude local tasks, study history, personal photos, secrets, and backups.

## Restore

Restore the previous extension files:

```bash
bash ./RESTORE-ORBIT-STUDY-FOCUS.sh
```

Apply the optional wallpaper:

```bash
bash ./USE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh
```

Restore prior wallpaper settings:

```bash
bash ./RESTORE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh
```

## Upload this project to GitHub

Repository: [praxhub/orbit-productivity-desktop](https://github.com/praxhub/orbit-productivity-desktop)

The recommended local procedure is:

1. Extract the GitHub-ready ORBIT v12 package.
2. Use the extracted `ORBIT_Study_Focus_Minimal_v12` directory as the repository root; don't mix earlier v8–v11 experiments.
3. Open a terminal in that folder.
4. Run `bash ./PUBLISH-TO-GITHUB.sh`.
5. If asked for a repository URL, use `https://github.com/praxhub/orbit-productivity-desktop.git`.
6. Authenticate using GitHub CLI, your credential manager, or SSH key and complete the push.
7. Visit the repository page and check that the source, README, installer, and wallpaper are present.

For a new empty repository, the publisher creates a local `main` branch and pushes it. Do not force-push. Never paste a GitHub token into a script or commit one to the repository.

## Project structure

- `extension.js` — GNOME Shell extension behavior.
- `stylesheet.css` — black/orange UI theme.
- `metadata.json` — extension ID, name, version, and GNOME compatibility.
- `INSTALL-ORBIT-STUDY-FOCUS.sh` — install/update extension.
- `RESTORE-ORBIT-STUDY-FOCUS.sh` — restore previous extension files.
- `USE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh` — apply the optional wallpaper.
- `RESTORE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh` — restore prior wallpaper settings.
- `PUBLISH-TO-GITHUB.sh` — allowlist-based GitHub publisher.
- `ORBIT-GITHUB-READY.sh` — prepare project documentation.
- `GITHUB_UPLOAD_GUIDE.md` — step-by-step publishing guide.
- `ORBIT-Minimal-Black-Wallpaper.jpg` — optional desktop wallpaper.

## Validation note

Static checks and packaging checks are provided in `VALIDATION.txt`. Visual behavior must be verified on a live GNOME Shell 50.x session.
