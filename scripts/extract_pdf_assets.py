"""Development-only PDF asset extractor. The website does not depend on this script.

Reads the original SkillLink capability profile, keeps sufficiently large raster
images, removes exact and near duplicates, and writes optimized WebP copies.
The source PDF is never modified.
"""

from __future__ import annotations

import hashlib
import json
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "skillink.pdf"
OUTPUT = ROOT / "assets" / "images" / "extracted"
REPORT = OUTPUT / "extraction-report.json"

MIN_WIDTH = 300
MIN_HEIGHT = 250
MIN_PIXELS = 120_000
WEBP_QUALITY = 84


def difference_hash(image: Image.Image, size: int = 9) -> int:
    gray = ImageOps.grayscale(image).resize((size, size - 1), Image.Resampling.LANCZOS)
    pixels = list(gray.get_flattened_data())
    bits = 0
    for row in range(size - 1):
        offset = row * size
        for col in range(size - 1):
            bits = (bits << 1) | (pixels[offset + col] > pixels[offset + col + 1])
    return bits


def hamming_distance(left: int, right: int) -> int:
    return (left ^ right).bit_count()


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF)
    seen_sha: set[str] = set()
    seen_hashes: list[int] = []
    assets: list[dict[str, object]] = []

    for page_number, page in enumerate(document, start=1):
        page_title = " ".join(page.get_text("text").split())[:180]
        for image_number, info in enumerate(page.get_images(full=True), start=1):
            xref, width, height = info[0], info[2], info[3]
            if width < MIN_WIDTH or height < MIN_HEIGHT or width * height < MIN_PIXELS:
                continue
            raw = document.extract_image(xref)["image"]
            sha = hashlib.sha256(raw).hexdigest()
            if sha in seen_sha:
                continue
            try:
                image = Image.open(BytesIO(raw)).convert("RGB")
            except Exception:
                continue
            perceptual = difference_hash(image)
            if any(hamming_distance(perceptual, old) <= 3 for old in seen_hashes):
                continue
            seen_sha.add(sha)
            seen_hashes.append(perceptual)
            name = f"page-{page_number:02d}-image-{image_number:02d}.webp"
            image.save(OUTPUT / name, "WEBP", quality=WEBP_QUALITY, method=6)
            assets.append({
                "file": name,
                "page": page_number,
                "width": image.width,
                "height": image.height,
                "sha256": sha,
                "page_text": page_title,
            })

    REPORT.write_text(
        json.dumps({"source": PDF.name, "page_count": document.page_count, "assets": assets}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Extracted {len(assets)} unique large images from {document.page_count} pages into {OUTPUT}")


if __name__ == "__main__":
    main()
