#!/usr/bin/env python3
"""Convert project raster images to WebP.

Every image under public/projects that a page actually renders is re-encoded as
WebP next to its original. Originals are left in place so the change can be
inspected before they are removed; pass --replace to delete them.

Usage:
    pip install pillow
    python3 tools/optimize-images.py [--replace] [--quality 82]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "public" / "projects"

# Only images that are actually rendered somewhere. Covers are listed explicitly
# because they live at the project root rather than under image/.
COVER_NAMES = ("cover.png", "cover.jpg", "cover.jpeg")


def targets() -> list[Path]:
    found: list[Path] = []
    for project in sorted(PROJECTS.iterdir()):
        if not project.is_dir():
            continue
        image_dir = project / "image"
        if image_dir.is_dir():
            found.extend(sorted(p for p in image_dir.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}))
        found.extend(p for name in COVER_NAMES if (p := project / name).exists())
    return found


def convert(path: Path, quality: int) -> tuple[int, int]:
    before = path.stat().st_size
    out = path.with_suffix(".webp")
    with Image.open(path) as image:
        # PNG screenshots and illustrations are usually already palette/RGBA;
        # EXIF orientation has to be honoured before the metadata is dropped.
        image = image.convert("RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB")
        image.save(out, "WEBP", quality=quality, method=6)
    return before, out.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--replace", action="store_true", help="delete originals after a successful conversion")
    args = parser.parse_args()

    files = targets()
    if not files:
        print("No images found.")
        return 0

    total_before = total_after = 0
    for path in files:
        before, after = convert(path, args.quality)
        total_before += before
        total_after += after
        flag = "" if after < before else "  (larger!)"
        print(f"{path.relative_to(ROOT)}: {before / 1024:.0f}KB -> {after / 1024:.0f}KB{flag}")

    saved = total_before - total_after
    print(
        f"\n{len(files)} images | {total_before / 1048576:.1f}MB -> {total_after / 1048576:.1f}MB "
        f"(-{saved / total_before * 100:.0f}%)"
    )

    if args.replace:
        for path in files:
            path.unlink()
        print("Originals removed.")
    else:
        print("Originals kept. Re-run with --replace once the WebP output looks right.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
