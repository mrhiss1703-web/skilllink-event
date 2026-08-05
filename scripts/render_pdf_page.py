"""Render and crop the partner-logo panel from page 8 of the profile."""

from pathlib import Path
import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
document = fitz.open(ROOT / "skillink.pdf")
page = document[7]
output = ROOT / "assets" / "images" / "partners-page.png"
page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(output)

with Image.open(output) as rendered:
    panel = rendered.crop((24, 256, 1664, 1062))
    panel.save(
        ROOT / "assets" / "images" / "partner-logos.webp",
        "WEBP",
        quality=92,
        method=6,
    )

output.unlink()
