#!/usr/bin/env python3
import os
import re
import subprocess
import sys

def main():
    tag_name = os.environ.get("TAG_NAME", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "b1alek/Materialbook-")
    sha = os.environ.get("GITHUB_SHA", "")
    output_apk = os.environ.get("OUTPUT_APK", "")

    # 1. Extract notes from CHANGELOG.md for the current tag
    changelog_notes = ""
    try:
        with open("CHANGELOG.md", "r", encoding="utf-8") as f:
            content = f.read()
        pattern = r'## \[(.*?)\][^\n]*\n(.*?)(?=\n## \[|\Z)'
        for m in re.finditer(pattern, content, re.DOTALL):
            ver = m.group(1).strip()
            tag_clean = tag_name.lstrip("v").rstrip("-fork")
            if ver.lstrip("v") == tag_clean or ver in tag_name:
                changelog_notes = m.group(2).strip()
                break
    except Exception as e:
        print(f"Notice: could not extract changelog: {e}", file=sys.stderr)

    # 2. Compute git commit log diff from previous tag
    prev_tag = ""
    try:
        prev_tag = subprocess.check_output(
            ["git", "describe", "--tags", "--abbrev=0", f"{tag_name}^"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        try:
            prev_tag = subprocess.check_output(
                ["git", "describe", "--tags", "--abbrev=0", "HEAD^"],
                stderr=subprocess.DEVNULL
            ).decode().strip()
        except Exception:
            pass

    if prev_tag:
        diff_header = f"### Changes since {prev_tag}"
        diff_cmd = [
            "git", "log",
            f"--pretty=format:* %s ([%h](https://github.com/{repo}/commit/%H))",
            f"{prev_tag}..HEAD"
        ]
    else:
        diff_header = "### Recent Changes"
        diff_cmd = [
            "git", "log",
            "-n", "10",
            f"--pretty=format:* %s ([%h](https://github.com/{repo}/commit/%H))"
        ]

    try:
        commit_diff = subprocess.check_output(diff_cmd).decode().strip()
    except Exception:
        commit_diff = ""

    # 3. Read sha256 checksum
    checksum = ""
    checksum_file = f"{output_apk}.sha256"
    if os.path.exists(checksum_file):
        try:
            with open(checksum_file, "r", encoding="utf-8") as f:
                checksum = f.read().strip()
        except Exception:
            pass

    # 4. Assemble release notes
    notes = [
        f"### Materialbook Fork Release ({tag_name})",
        f"* **Commit:** [{sha}](https://github.com/{repo}/commit/{sha})",
        f"* **Assets:** `{output_apk}`\n"
    ]

    if changelog_notes:
        notes.append(changelog_notes + "\n")

    notes.append(diff_header)
    if commit_diff:
        notes.append(commit_diff)
    notes.append("")

    if checksum:
        notes.extend([
            "---",
            "**SHA-256 Checksum:**",
            "```",
            checksum,
            "```"
        ])

    with open("release_notes.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(notes) + "\n")

    print(f"Successfully generated release_notes.txt for {tag_name}")

if __name__ == "__main__":
    main()
