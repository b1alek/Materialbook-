#!/usr/bin/env bash
# Release helper: bump version, verify changelog, guarded add, push, verify online.
# Usage: scripts/release.sh [--full] [--pr] [VERSION] [CODE]
#   No VERSION/CODE: auto-bump patch version and versionCode+1 from app/build.gradle.kts
#   --full: run the full device test suite (needs emulator + logged-in session)
#   --pr:   print the compare URL for opening a pull request (creation via GitHub MCP)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRADLE_FILE="app/build.gradle.kts"
BRANCH="fork-main"
REMOTE="origin"
FULL=0
WANT_PR=0
POS=()
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    --pr) WANT_PR=1 ;;
    *) POS+=("$arg") ;;
  esac
done

CUR_VERSION="$(grep -oP 'versionName = "\K[0-9]+\.[0-9]+\.[0-9]+' "$GRADLE_FILE")"
CUR_CODE="$(grep -oP 'versionCode = \K[0-9]+' "$GRADLE_FILE")"
VERSION="${POS[0]:-}"
CODE="${POS[1]:-}"
if [ -z "$VERSION" ] || [ -z "$CODE" ]; then
  MAJOR="${CUR_VERSION%%.*}"; REST="${CUR_VERSION#*.}"; MINOR="${REST%%.*}"; PATCH="${REST##*.}"
  VERSION="${VERSION:-$MAJOR.$MINOR.$((PATCH + 1))}"
  CODE="${CODE:-$((CUR_CODE + 1))}"
fi

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "ERROR: bad VERSION '$VERSION' (want X.Y.Z)"; exit 1; }
[[ "$CODE" =~ ^[0-9]+$ ]] || { echo "ERROR: bad CODE '$CODE' (want integer)"; exit 1; }
if [ "$CODE" -lt "$CUR_CODE" ] || { [ "$CODE" -eq "$CUR_CODE" ] && [ "$VERSION" != "$CUR_VERSION" ]; }; then
  echo "ERROR: version/code must advance (current $CUR_VERSION/$CUR_CODE, want $VERSION/$CODE)"; exit 1;
fi
[ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] || { echo "ERROR: not on $BRANCH"; exit 1; }

echo "== bump $CUR_VERSION ($CUR_CODE) -> $VERSION ($CODE)"
sed -i "s/versionCode = $CUR_CODE/versionCode = $CODE/; s/versionName = \"$CUR_VERSION\"/versionName = \"$VERSION\"/" "$GRADLE_FILE"
grep -n "versionCode = $CODE\|versionName = \"$VERSION\"" "$GRADLE_FILE"

echo "== changelog check"
grep -q "^\#\# \[v$VERSION\]" CHANGELOG.md || { echo "ERROR: CHANGELOG.md lacks '## [v$VERSION]' heading"; exit 1; }
grep -A2 "^\#\# \[v$VERSION\]" CHANGELOG.md | grep -Eq "[0-9]{4}-[0-9]{2}-[0-9]{2}" || { echo "ERROR: no date under v$VERSION heading"; exit 1; }
echo "CHANGELOG OK"

echo "== fast gates"
node --check app/src/main/res/raw/download_content.js && echo "download_content.js OK"
node --check app/src/main/res/raw/scripts.js && echo "scripts.js OK"
/root/.local/bin/python3.12 -m pytest tests/test_automator.py -q 2>&1 | tail -2

if [ "$FULL" -eq 1 ]; then
  echo "== full device suite (needs emulator + login)"
  /root/.local/bin/python3.12 -m pytest tests/test_download_reels.py tests/test_userscripts.py tests/test_adblock_sponsored.py -q 2>&1 | tail -3
fi

echo "== guarded add (explicit paths only)"
git add app/ CHANGELOG.md README.md LICENSE .gitignore scripts/
# (scripts/release.sh itself mentions these words in commentary — excluded)
if git diff --cached --unified=0 -- . ':!scripts/release.sh' | grep -inE "bearer [A-Za-z0-9]|passwd *[:=]|api[_-]?key *[:=]|secret *[:=]|BEGIN .*PRIVATE" ; then
  echo "ERROR: secret-like pattern in staged diff — aborting"; exit 1;
fi
echo "secret guard OK"
# Refuse unstaged tracked modifications (everything intended must be staged above)
UNSTAGED="$(git diff --name-only || true)"
if [ -n "$UNSTAGED" ]; then echo "ERROR: unstaged tracked changes remain:"; echo "$UNSTAGED"; exit 1; fi
echo "--- untracked (informational, must stay local-only) ---"
git status --porcelain | grep "^??" || true
echo "--- staged ---"
git diff --cached --stat
git status --short

echo "== commit"
git commit -m "chore(release): bump to v$VERSION ($CODE)" -- app/ CHANGELOG.md README.md LICENSE .gitignore scripts/

echo "== push $REMOTE $BRANCH"
git push "$REMOTE" "$BRANCH"

echo "== verify online"
LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | cut -f1)"
[ -n "$REMOTE_SHA" ] || { echo "ERROR: remote ref missing"; exit 1; }
[ "$LOCAL_SHA" = "$REMOTE_SHA" ] || { echo "ERROR: sha mismatch local=$LOCAL_SHA remote=$REMOTE_SHA"; exit 1; }
REMOTE_URL="$(git remote get-url "$REMOTE")"
echo "ONLINE OK: $LOCAL_SHA"
echo "Commit URL: ${REMOTE_URL%.git}/commit/$LOCAL_SHA"

if [ "$WANT_PR" -eq 1 ]; then
  echo "Compare URL: ${REMOTE_URL%.git}/compare/main...$BRANCH"
  echo "Create the PR via GitHub MCP (no gh CLI on this machine)."
fi
