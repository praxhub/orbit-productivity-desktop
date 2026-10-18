#!/usr/bin/env bash
set -euo pipefail

DEFAULT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$DEFAULT_ROOT}"
ROOT="$(cd -- "$ROOT" && pwd)"
cd "$ROOT"

command -v git >/dev/null 2>&1 || { echo 'Git is required. Install it with: sudo apt install git' >&2; exit 1; }
for f in extension.js stylesheet.css metadata.json README.md INSTALL-ORBIT-STUDY-FOCUS.sh PUBLISH-TO-GITHUB.sh; do
  [[ -f "$ROOT/$f" ]] || { echo "Project file missing: $f" >&2; exit 1; }
done

cat <<'NOTICE'
This publisher stages only the ORBIT source/package files listed below.
It does NOT upload your local tasks, study history, personal photos, screenshots,
wallpaper settings, or anything from ~/.local/share.
NOTICE

if [[ ! -d .git ]]; then
  git init
fi
git branch -M main

# Use local repo identity only; never change global Git settings automatically.
if ! git config --get user.name >/dev/null; then
  read -r -p 'Git commit name: ' GIT_NAME
  [[ -n "$GIT_NAME" ]] || { echo 'Name cannot be empty.' >&2; exit 1; }
  git config --local user.name "$GIT_NAME"
fi
if ! git config --get user.email >/dev/null; then
  read -r -p 'Git commit email: ' GIT_EMAIL
  [[ -n "$GIT_EMAIL" ]] || { echo 'Email cannot be empty.' >&2; exit 1; }
  git config --local user.email "$GIT_EMAIL"
fi

FILES=(
  .gitignore README.md VALIDATION.txt metadata.json extension.js stylesheet.css
  INSTALL-ORBIT-STUDY-FOCUS.sh RESTORE-ORBIT-STUDY-FOCUS.sh
  USE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh RESTORE-ORBIT-MINIMAL-BLACK-WALLPAPER.sh
  PUBLISH-TO-GITHUB.sh ORBIT-Minimal-Black-Wallpaper.jpg
)
git add -- "${FILES[@]}"
if ! git diff --cached --quiet; then
  read -r -p 'Commit message [ORBIT v12: fix desktop alignment]: ' COMMIT_MSG
  COMMIT_MSG="${COMMIT_MSG:-ORBIT v12: fix desktop alignment}"
  git commit -m "$COMMIT_MSG"
else
  echo 'No staged project changes to commit.'
fi

ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$ORIGIN" ]]; then
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    read -r -p 'Create a new GitHub repository with gh CLI? [Y/n] ' CREATE_REPO
    CREATE_REPO="${CREATE_REPO:-Y}"
    if [[ "$CREATE_REPO" =~ ^([Yy]|[Yy][Ee][Ss])$ ]]; then
      read -r -p 'Repository name or OWNER/NAME [orbit-desktop-layer]: ' REPO_SLUG
      REPO_SLUG="${REPO_SLUG:-orbit-desktop-layer}"
      read -r -p 'Visibility: private or public [private]: ' VISIBILITY
      VISIBILITY="${VISIBILITY:-private}"
      case "$VISIBILITY" in
        private) gh repo create "$REPO_SLUG" --private --source="$ROOT" --remote=origin ;;
        public)  gh repo create "$REPO_SLUG" --public  --source="$ROOT" --remote=origin ;;
        *) echo 'Choose exactly private or public.' >&2; exit 1 ;;
      esac
    fi
  fi
  ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
  if [[ -z "$ORIGIN" ]]; then
    cat <<'HELP'
Create an EMPTY repository at https://github.com/new, then copy its HTTPS or SSH URL.
Do not add a README, .gitignore or license on GitHub (this project already has files).
HELP
    read -r -p 'GitHub repository URL: ' REPO_URL
    [[ -n "$REPO_URL" ]] || { echo 'Repository URL cannot be empty.' >&2; exit 1; }
    git remote add origin "$REPO_URL"
  fi
fi

printf '\nPublishing to: %s\n' "$(git remote get-url origin)"
git push -u origin main
printf '\nORBIT source was pushed to GitHub.\n'
printf 'Repository URL: %s\n' "$(git remote get-url origin | sed -E 's#\.git$##; s#^git@github\.com:#https://github.com/#')"
