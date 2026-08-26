"""Render PDF pages to JPEG previews for WowWed vendor galleries."""
import os
import sys

import pymupdf

pdf_path, out_dir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
max_pages = int(sys.argv[4]) if len(sys.argv) > 4 else 6

os.makedirs(out_dir, exist_ok=True)
doc = pymupdf.open(pdf_path)
count = min(len(doc), max_pages)
written = 0
for i in range(count):
    out = os.path.join(out_dir, f"{prefix}-p{i + 1}.jpg")
    if os.path.exists(out) and os.path.getsize(out) > 2000:
        written += 1
        continue
    page = doc[i]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1.55, 1.55), alpha=False)
    pix.save(out, jpg_quality=82)
    written += 1
doc.close()
print(written)
