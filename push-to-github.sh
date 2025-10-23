#!/usr/bin/env bash
set -e
REPO_NAME="moi-forces-academy-entry-exit"
DESCRIPTION="Moi Forces Academy - Entry/Exit Management Demo"
if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Install it from https://cli.github.com/ and authenticate (gh auth login)"
  exit 1
fi
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "Initial commit - Moi Forces Academy entry-exit demo"
else
  git add .
  git commit -m "Update commit - $(date -u +"%Y-%m-%dT%H:%M:%SZ")" || true
fi
if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  echo "Repository $REPO_NAME already exists on your account."
else
  gh repo create "$REPO_NAME" --private --description "$DESCRIPTION" --confirm
fi
git branch -M main || true
git remote add origin $(gh repo view "$REPO_NAME" --json sshUrl -q '.sshUrl') 2>/dev/null || true
git push -u origin main --force
echo "Pushed to GitHub: $(gh repo view "$REPO_NAME" --json url -q '.url')"
echo "Done."
