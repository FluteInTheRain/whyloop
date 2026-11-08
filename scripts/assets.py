"""Colour icon / logo library (original colours, no recolouring).

  ./make-video assets sync                 download everything in assets/library/manifest.json
  ./make-video assets add set/name [...]   add icons (e.g. logos/python fluent-emoji-flat/rocket) and download
  ./make-video assets search <words>       search the local library (add --remote to also query Iconify)
  ./make-video assets list [--set S]       list local icons

Library layout: assets/library/<set>/<name>.svg, index.json, sets.json (license/author), ATTRIBUTION.md.
Use in scripts as  "icon": "img:<set>/<name>"  (e.g. "img:logos/python"). Only permissive licenses are accepted.
"""
import json, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "assets" / "library"
API = "https://api.iconify.design"
OK_LICENSES = ("MIT", "Apache", "CC0", "BSD", "ISC", "Unlicense")
# sets whose artwork is dark/flat enough to need a light tile behind it on a dark background
TILE_SETS = {"logos"}
SIZE_SUFFIXES = ("-48", "-32", "-28", "-24", "-20", "-16")


def _get(url, tries=6):
    req = urllib.request.Request(url, headers={"User-Agent": "whyloop-assets/1.0"})
    for k in range(tries):
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1:
                raise
            time.sleep(4 * (k + 1))  # rate limited: back off


def _info(prefix):
    return _get(f"{API}/collections?prefixes={prefix}").get(prefix, {})


def _all_names(prefix):
    """Every icon name in a set (heavy endpoint; may be rate limited)."""
    d = _get(f"{API}/collection?prefix={prefix}")
    names = set(d.get("uncategorized", []))
    for v in (d.get("categories") or {}).values():
        names |= set(v)
    return names | set(d.get("aliases", {}))


def _license_ok(info):
    title = (info.get("license") or {}).get("title", "")
    return any(title.startswith(k) or k in title for k in OK_LICENSES), title


def _candidates(name):
    return [name, name + "-icon", name + "-1"] + [name + x for x in SIZE_SUFFIXES]


def _svg(body, w, h):
    ns = ' xmlns:xlink="http://www.w3.org/1999/xlink"' if "xlink:" in body else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg"{ns} viewBox="0 0 {w} {h}">{body}</svg>\n'


def _fetch(prefix, bases):
    """bases: library names. Returns ({base: svg}, [missing]). One request per ~40 candidates."""
    cand = {c: b for b in bases for c in _candidates(b)}
    names = list(cand)
    found = {}
    for i in range(0, len(names), 40):
        time.sleep(0.5)
        chunk = names[i:i + 40]
        d = _get(f"{API}/{prefix}.json?icons={urllib.parse.quote(','.join(chunk))}")
        dw, dh = d.get("width", 24), d.get("height", 24)
        icons = dict(d.get("icons", {}))
        for alias, a in d.get("aliases", {}).items():
            if a["parent"] in icons:
                icons[alias] = icons[a["parent"]]
        for real, ic in icons.items():
            found[real] = _svg(ic["body"], ic.get("width", dw), ic.get("height", dh))
    out = {}
    for b in bases:
        for c in _candidates(b):
            if c in found:
                out[b] = found[c]
                break
    return out, [b for b in bases if b not in out]


def _clean(name):
    """Library name: drop fluent size suffix (database-32 -> database)."""
    return re.sub(r"-(16|20|24|28|32|48)$", "", name)


def sync(only=None):
    man = json.loads((LIB / "manifest.json").read_text())
    sets = json.loads((LIB / "sets.json").read_text()) if (LIB / "sets.json").exists() else {}
    for prefix, names in man.items():
        if prefix.startswith("_") or (only and prefix != only):
            continue
        info = _info(prefix)
        ok, lic = _license_ok(info)
        if not ok:
            print(f"✗ {prefix}: giấy phép '{lic}' không nằm trong danh sách cho phép, bỏ qua")
            continue
        out_dir = LIB / prefix
        out_dir.mkdir(parents=True, exist_ok=True)
        have_files = {f.stem for f in out_dir.glob("*.svg")}
        if names == "all":
            try:
                bases = sorted({_clean(n) for n in _all_names(prefix)})
            except urllib.error.HTTPError:
                bases = sorted(have_files)  # listing is rate limited: keep what we have
        else:
            bases = sorted(set(names))
        todo = [b for b in bases if b not in have_files]
        got, missing = _fetch(prefix, todo) if todo else ({}, [])
        for b, svg in got.items():
            (out_dir / f"{b}.svg").write_text(svg)
        n = len({f.stem for f in out_dir.glob("*.svg")})
        sets[prefix] = {"name": info.get("name"), "license": lic,
                        "license_url": (info.get("license") or {}).get("url"),
                        "author": (info.get("author") or {}).get("name"), "url": (info.get("author") or {}).get("url"),
                        "tile": prefix in TILE_SETS, "count": n}
        print(f"{prefix}: {n} icon (mới {len(got)})" + (f" · thiếu {len(missing)}: {', '.join(missing)}" if missing else ""))
    (LIB / "sets.json").write_text(json.dumps(sets, ensure_ascii=False, indent=2) + "\n")
    _write_index(sets)


def _write_index(sets):
    idx = []
    for prefix in sorted(sets):
        for f in sorted((LIB / prefix).glob("*.svg")):
            idx.append({"id": f"{prefix}/{f.stem}", "tags": [t for t in re.split(r"[-_]", f.stem) if t]})
    (LIB / "index.json").write_text(json.dumps(idx, ensure_ascii=False) + "\n")
    lines = ["# Thư viện icon: giấy phép và ghi nguồn", "",
             "Icon giữ nguyên màu gốc, tải qua Iconify. Chỉ nhận giấy phép MIT / Apache-2.0 / CC0 / BSD / ISC.", ""]
    for p, s in sorted(sets.items()):
        lines.append(f"- **{p}**: {s['name']} · {s['license']} · tác giả: {s.get('author')} · {s.get('license_url') or s.get('url')} · {s['count']} icon")
    (LIB / "ATTRIBUTION.md").write_text("\n".join(lines) + "\n")


def add(ids):
    man = json.loads((LIB / "manifest.json").read_text())
    for i in ids:
        if "/" not in i:
            sys.exit(f"Dạng đúng: <set>/<tên>, ví dụ logos/python (nhận: {i})")
        prefix, name = i.split("/", 1)
        cur = man.get(prefix)
        if cur == "all":
            continue
        man[prefix] = sorted(set((cur or []) + [name]))
    (LIB / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=1) + "\n")
    for prefix in {i.split("/")[0] for i in ids}:
        sync(prefix)


def _tokens(q):
    return [t for t in re.split(r"[\s,/_-]+", q.lower()) if t]


def search(q, remote=False):
    toks = _tokens(q)
    idx = json.loads((LIB / "index.json").read_text()) if (LIB / "index.json").exists() else []
    hits = [e["id"] for e in idx if all(t in e["id"].lower() for t in toks)]
    print(f"Thư viện cục bộ ({len(hits)}):")
    for h in hits[:60]:
        print("  img:" + h)
    if remote:
        sets = json.loads((LIB / "sets.json").read_text()) if (LIB / "sets.json").exists() else {}
        prefixes = ",".join(sets) or "logos,flat-color-icons,fluent-color,fluent-emoji-flat"
        d = _get(f"{API}/search?query={urllib.parse.quote(q)}&prefixes={prefixes}&limit=40")
        local = set(hits)
        new = [i.replace(":", "/") for i in d.get("icons", [])]
        print(f"Iconify (các bộ đã cho phép), chưa có cục bộ:")
        for n in new:
            if n not in local:
                print(f"  {n}   → ./make-video assets add {n}")


def list_(only=None):
    idx = json.loads((LIB / "index.json").read_text())
    cur = None
    for e in idx:
        p = e["id"].split("/")[0]
        if only and p != only:
            continue
        if p != cur:
            cur = p
            print(f"\n[{p}]")
        print(" ", e["id"].split("/", 1)[1], end="")
    print()


def main(argv):
    if not argv or argv[0] not in ("sync", "add", "search", "list"):
        sys.exit(__doc__)
    cmd, rest = argv[0], argv[1:]
    if cmd == "sync":
        sync()
    elif cmd == "add":
        add(rest)
    elif cmd == "search":
        remote = "--remote" in rest
        search(" ".join(r for r in rest if r != "--remote"), remote)
    else:
        list_(rest[rest.index("--set") + 1] if "--set" in rest else None)


if __name__ == "__main__":
    main(sys.argv[1:])
