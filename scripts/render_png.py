"""Build all puzzle SVG assets into high-resolution PNG files for the website."""
from pathlib import Path
import re
import cairosvg

root = Path(__file__).resolve().parents[1]
out = root / "assets" / "png"
out.mkdir(parents=True, exist_ok=True)
for source in sorted((root / "assets").glob("*.svg")):
    svg = source.read_text(encoding="utf-8")
    match = re.search(r'viewBox="0 0 (\\d+) (\\d+)"', svg)
    if not match:
        raise RuntimeError(f"Missing viewBox in {source}")
    w, h = map(int, match.groups())
    target = out / (source.stem + ".png")
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(target), output_width=w*3, output_height=h*3)
    print(f"Rendered {source.name}: {w*3}x{h*3}")
