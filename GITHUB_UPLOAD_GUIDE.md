# ORBIT v12 — GitHub Upload Guide

## Which folder should I upload?

Use **only this folder**: `ORBIT_Study_Focus_Minimal_v12`. It contains the current v12 source and upload scripts. Do not upload all of your ORBIT v8/v9/v10/v11/v12 folders together. Do not upload the ZIP inside a GitHub repository; upload the contents of the extracted v12 folder as the repository files.

## Recommended steps

1. Extract `ORBIT_Study_Focus_Minimal_v12.zip`.
2. Open a terminal inside the `ORBIT_Study_Focus_Minimal_v12` folder.
3. Run `bash ./ORBIT-GITHUB-READY.sh` to refresh README and prepare the guide.
4. When asked whether to publish now, type `y`, or use `n` and publish later.
5. If the automatic `gh` route is unavailable, create an empty repository at <https://github.com/new>. Give it a name such as `orbit-desktop-layer`; leave README, `.gitignore`, and license unchecked.
6. Run `bash ./PUBLISH-TO-GITHUB.sh` and paste the repository's HTTPS or SSH URL.
7. Complete authentication through your configured Git Credential Manager or SSH key and wait for the push to finish.
8. Open the repository page on GitHub and verify the source and README are present.

## What gets uploaded?

The publish script stages only a specific list of project source and documentation files. It does not stage local task JSON, study-session records, personal photos, wallpaper settings, home-folder contents, or arbitrary files.

## If the upload fails

- `git` missing: run `sudo apt install git`.
- Git identity missing: provide a commit name and email when prompted; this changes only this project's local Git config.
- Authentication failed: use GitHub CLI (`gh auth login`), your configured credential manager, or SSH keys. Never paste a token into this script or commit it.
- Remote already contains a separate README/commit: use an empty repository or ask for help before merging. This helper deliberately does not force-push.
