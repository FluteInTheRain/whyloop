#!/usr/bin/env bash
# Build/refresh the sanitized `public` branch from HEAD (code only: no episode content) and optionally push it.
# usage: scripts/publish_public.sh [--push]
# Hidden from the public tree: series/ (scripts, descriptions, captions, thumbnails), catalog.md, books/.
# `main` keeps everything; `public` gets one new commit per run, on top of the previous public commit.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HIDE=(series catalog.md books)
IDX="$(mktemp)"; trap 'rm -f "$IDX"' EXIT
GIT_INDEX_FILE="$IDX" git read-tree HEAD
GIT_INDEX_FILE="$IDX" git rm -r -q --cached --ignore-unmatch "${HIDE[@]}"
TREE="$(GIT_INDEX_FILE="$IDX" git write-tree)"
PARENT=(); git rev-parse -q --verify refs/heads/public >/dev/null && PARENT=(-p refs/heads/public)
if [ "${#PARENT[@]}" -gt 0 ] && [ "$(git rev-parse refs/heads/public^{tree})" = "$TREE" ]; then echo "public is already up to date"; else
  C="$(git commit-tree "$TREE" ${PARENT[@]+"${PARENT[@]}"} -m "Update from main@$(git rev-parse --short HEAD): $(git log -1 --format=%s)")"
  git update-ref refs/heads/public "$C"; echo "public -> $(git rev-parse --short "$C")"
fi
if [ "${1:-}" = "--push" ]; then git push origin refs/heads/public:refs/heads/main; fi
