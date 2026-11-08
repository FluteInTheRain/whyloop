"""Ingest a reference book (PDF / EPUB) into books/<slug>/.

  books/<slug>/book.json        metadata, license, citation
  books/<slug>/source/<file>    the original (git-ignored: large)
  books/<slug>/text/NN-*.md     text per chapter, with <!-- p.N --> page markers (printed page numbers)
  books/<slug>/figures/*.png    embedded images >= 120px, with figures.json (page, caption guess, rights)
"""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIG_RE = re.compile(r"^\s*(figure|fig\.|hình|bảng|table)\s*[\w.\-]+", re.I)


def _slug(s):
    s = re.sub(r"[^\w\s-]", "", s.lower(), flags=re.U)
    return re.sub(r"[\s_]+", "-", s).strip("-")[:48] or "chapter"


HDR_RE = re.compile(r"^(\d{1,2})\.\s+([A-Z][^\n]{2,60})$")


def detect_chapters(doc):
    """Fallback when the PDF has no usable outline: running headers like '3. Linear Regression' repeated on many
    pages (exercise items such as '6. Suppose that...' are rejected by requiring >= 5 repeats).
    Returns [(title, first_pdf_page)]; the opening page is the page before the first header if it starts with the number."""
    seen = {}
    for i in range(doc.page_count):
        lines = [l.strip() for l in doc[i].get_text("text").splitlines() if l.strip()][:3]
        for l in lines:
            m = HDR_RE.match(l)
            if m:
                key = (int(m.group(1)), m.group(2).strip())
                seen.setdefault(key, []).append(i + 1)
    cand = {}
    for (n, title), pages in seen.items():
        if len(pages) >= 5 and (n not in cand or len(pages) > len(cand[n][2])):
            cand[n] = (pages[0], title, pages)
    out = []
    for n in sorted(cand):
        pg, title, _ = cand[n]
        prev = [l.strip() for l in doc[pg - 2].get_text("text").splitlines() if l.strip()][:1] if pg >= 2 else []
        if prev == [str(n)]:
            pg -= 1
        out.append((f"{n}. {title}", pg))
    mono, last = [], 0   # keep a monotone sequence only
    for t, pg in out:
        if pg > last:
            mono.append((t, pg))
            last = pg
    return mono


LIG = str.maketrans({"\ufb01": "fi", "\ufb02": "fl", "\ufb00": "ff", "\ufb03": "ffi", "\ufb04": "ffl"})


def _open_license(name):
    return bool(re.match(r"(CC[ -]|MIT|Apache|BSD|ISC|Unlicense|Public Domain)", name or "", re.I))


def ingest(a):
    try:
        import pymupdf as fitz
    except ImportError:
        sys.exit("Cần PyMuPDF: chạy qua ./make-video book ingest ... (tự cài bằng uv)")
    src = Path(a.file).expanduser()
    if not src.exists():
        sys.exit(f"Không thấy file: {src}")
    bd = ROOT / "books" / a.slug
    for sub in ("source", "text", "figures"):
        (bd / sub).mkdir(parents=True, exist_ok=True)
    shutil.copy(src, bd / "source" / src.name)
    doc = fitz.open(src)
    n = doc.page_count
    off = a.page_offset

    # chapters: PDF outline (level 1) -> running-header detection -> one chunk per 20 pages
    toc = [(t, p) for lvl, t, p in doc.get_toc() if lvl == 1 and p >= 1]
    detected = detect_chapters(doc) if len(toc) < 3 else []
    if len(toc) >= 3:
        starts = toc
    elif len(detected) >= 3:
        starts = detected
        if detected[0][1] > 1:
            starts = [("Front matter", 1)] + detected
        if off is None and detected[0][0].startswith("1."):
            off = detected[0][1] - 1   # chapter 1 opens on printed page 1
    else:
        starts = [(f"Phần {i // 20 + 1}", i + 1) for i in range(0, n, 20)]
    off = off or 0
    chapters = []
    for i, (title, p0) in enumerate(starts):
        p1 = (starts[i + 1][1] - 1) if i + 1 < len(starts) else n
        t = title.translate(LIG).strip()
        m = re.match(r"(\d{1,2})\.\s", t)   # keep the book's own chapter numbers; front matter = 0
        n_ch = int(m.group(1)) if m else (0 if t.lower().startswith("front") else i + 1)
        chapters.append({"n": n_ch, "title": t, "pdf_pages": [p0, max(p0, p1)]})

    for ch in chapters:
        p0, p1 = ch["pdf_pages"]
        parts = [f"# {ch['title'].translate(LIG)}\n"]
        for pn in range(p0, p1 + 1):
            parts.append(f"\n<!-- p.{pn - off} -->\n" + doc[pn - 1].get_text("text").translate(LIG).strip() + "\n")
        fn = f"{ch['n']:02d}-{_slug(ch['title'])}.md"
        (bd / "text" / fn).write_text("".join(parts))
        ch["file"] = f"text/{fn}"
        ch["pages"] = [p0 - off, p1 - off]

    # figures: embedded raster images of reasonable size, caption = nearest "Figure/Hình ..." line on the page
    figs, seen = [], set()
    for pn in range(1, n + 1):
        page = doc[pn - 1]
        caps = [l.strip() for l in page.get_text("text").splitlines() if FIG_RE.match(l)]
        k = 0
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            pix = fitz.Pixmap(doc, xref)
            if pix.width < 120 or pix.height < 120:
                continue
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            k += 1
            fid = f"p{pn - off:03d}-{k}"
            pix.save(bd / "figures" / f"{fid}.png")
            figs.append({"id": fid, "file": f"figures/{fid}.png", "page": pn - off, "size": [pix.width, pix.height],
                         "caption_guess": caps[k - 1] if k - 1 < len(caps) else None})
    (bd / "figures" / "figures.json").write_text(json.dumps(figs, ensure_ascii=False, indent=2) + "\n")

    meta = {"slug": a.slug, "title": a.title, "authors": a.author, "year": a.year, "url": a.url,
            "license": {"name": a.license, "url": a.license_url},
            "citation": f"{a.author} ({a.year}). {a.title}." + (f" {a.url}" if a.url else ""),
            "page_offset": off, "pdf_pages": n, "chapters": chapters, "figures": len(figs)}
    open_lic = _open_license(a.license)
    meta["license"]["open"] = open_lic
    (bd / "book.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    gi = bd / ".gitignore"
    if open_lic:
        gi.unlink(missing_ok=True)
    else:  # not openly licensed: keep extracted text/figures out of git (only metadata is committed)
        gi.write_text("# extracted from a book without an open license: do not publish\ntext/\nfigures/\nsource/\n")
        print(f"⚠ Giấy phép '{a.license}' không mở: text/ và figures/ KHÔNG vào git (books/{a.slug}/.gitignore).")
    print(f"books/{a.slug}: {n} trang, {len(chapters)} chương, {len(figs)} hình")
    if a.author == "TODO" or a.license == "TODO":
        print("⚠ Điền author/year/license trong books/%s/book.json trước khi dùng làm nguồn." % a.slug)


def page_image(slug, pages, zoom=2.0):
    """Render book pages to PNG (books/<slug>/pages/, git-ignored) to crop a figure or check a page number."""
    import pymupdf
    bd = ROOT / "books" / slug
    meta = json.loads((bd / "book.json").read_text())
    src = next((bd / "source").iterdir())
    doc = pymupdf.open(src)
    out = bd / "pages"
    out.mkdir(exist_ok=True)
    (out / ".gitignore").write_text("*\n")
    for pr in pages:   # printed page numbers
        pn = pr + meta.get("page_offset", 0)
        pix = doc[pn - 1].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        f = out / f"p{pr:03d}.png"
        pix.save(f)
        print(f)


def main():
    import argparse
    if len(sys.argv) > 1 and sys.argv[1] == "page":
        ap = argparse.ArgumentParser(prog="make-video book page")
        ap.add_argument("page_cmd")
        ap.add_argument("slug")
        ap.add_argument("pages", type=int, nargs="+", help="printed page numbers")
        ap.add_argument("--zoom", type=float, default=2.0)
        a = ap.parse_args()
        return page_image(a.slug, a.pages, a.zoom)
    ap = argparse.ArgumentParser(prog="make-video book ingest")
    ap.add_argument("file")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--author", default="TODO")
    ap.add_argument("--year", default="TODO")
    ap.add_argument("--license", default="TODO", help="e.g. 'CC BY 4.0'")
    ap.add_argument("--license-url", default="")
    ap.add_argument("--url", default="", help="where the book is published")
    ap.add_argument("--page-offset", type=int, default=None, help="printed page = pdf page - offset (auto when chapters are detected)")
    ingest(ap.parse_args())


if __name__ == "__main__":
    main()
