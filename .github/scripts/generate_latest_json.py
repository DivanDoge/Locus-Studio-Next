#!/usr/bin/env python3
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote


def find_path(root: Path, *needles: str) -> Path:
    for path in sorted(root.rglob("*")):
        text = path.as_posix()
        if path.is_file() and all(needle in text for needle in needles):
            return path
    raise RuntimeError(f"Required release artifact not found: {' '.join(needles)}")


def read_sig(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def asset_url(path: Path, repo: str, tag: str) -> str:
    # GitHub release asset names normalize spaces to dots in final URLs.
    normalized_name = path.name.replace(" ", ".")
    encoded_name = quote(normalized_name)
    return f"https://github.com/{repo}/releases/download/{tag}/{encoded_name}"


def main() -> None:
    release_dir = Path("release-artifacts")
    repo = os.environ["GITHUB_REPOSITORY"]
    tag = os.environ["GITHUB_REF_NAME"]
    version = tag.lstrip("v")
    pub_date = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    windows_exe = find_path(release_dir, "nps-studio-windows", ".exe")
    linux_appimage = find_path(release_dir, "nps-studio-linux", ".AppImage")
    mac_aarch64 = find_path(release_dir, "nps-studio-macos-aarch64", ".app.tar.gz")
    mac_x86_64 = find_path(release_dir, "nps-studio-macos-x86_64", ".app.tar.gz")

    payload = {
        "version": version,
        "notes": f"Release {version}",
        "pub_date": pub_date,
        "platforms": {
            "windows-x86_64": {
                "url": asset_url(windows_exe, repo, tag),
                "signature": read_sig(Path(str(windows_exe) + ".sig")),
            },
            "linux-x86_64": {
                "url": asset_url(linux_appimage, repo, tag),
                "signature": read_sig(Path(str(linux_appimage) + ".sig")),
            },
            "darwin-aarch64": {
                "url": asset_url(mac_aarch64, repo, tag),
                "signature": read_sig(Path(str(mac_aarch64) + ".sig")),
            },
            "darwin-x86_64": {
                "url": asset_url(mac_x86_64, repo, tag),
                "signature": read_sig(Path(str(mac_x86_64) + ".sig")),
            },
        },
    }

    release_dir.joinpath("latest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("Generated release-artifacts/latest.json")


if __name__ == "__main__":
    main()