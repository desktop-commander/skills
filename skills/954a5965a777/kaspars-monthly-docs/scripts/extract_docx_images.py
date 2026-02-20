#!/usr/bin/env python3
"""Extract embedded images from a .docx (Office Word) file.

Usage:
  python3 extract_docx_images.py /path/to/file.docx /path/to/output_dir

Notes:
- A .docx is a ZIP file.
- Images usually live under word/media/.
"""

import os
import sys
import zipfile


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_docx_images.py INPUT.docx OUTPUT_DIR")
        return 2

    docx_path = sys.argv[1]
    out_dir = sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    with zipfile.ZipFile(docx_path) as z:
        media_files = [n for n in z.namelist() if n.startswith("word/media/")]
        if not media_files:
            print("No images found (word/media/ is empty).")
            return 1

        for name in media_files:
            base = os.path.basename(name)
            out_path = os.path.join(out_dir, base)
            with open(out_path, "wb") as f:
                f.write(z.read(name))
            print(out_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
