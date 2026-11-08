#!/usr/bin/env python3
"""Video engine.

  ./make-video check  series/<s>/episodes/<ep>       validate script + estimate duration (dir or script.json)
  ./make-video render series/<s>/episodes/<ep> --voice V --music M [--mode demo|full]
  ./make-video lint   series/<s>/episodes/<ep> [--png]  measure real element boxes in every beat: overlaps, text crossing frames
  ./make-video youtube upload <episode> [--dry-run]   upload to YouTube (auth/status/upload/resume/public)
  ./make-video catalog                                rebuild catalog.md (all episodes + status)
  ./make-video publish <episode-dir> --url URL        mark episode as published
  ./make-video book ingest <file> --slug S --title T  extract book text + figures into books/S/
  ./make-video say "câu cần nghe thử" [--voice V] [--dry]   hear/inspect pronunciation
"""
import argparse, hashlib, json, math, os, random, re, shutil, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from progress import Progress  # noqa: E402
import episodes as EP  # noqa: E402

CFG = json.loads((ROOT / "config.json").read_text())

REQUIRED = {
    "title": ["heading"], "outro": ["heading"], "bullets": ["items"],
    "compare": ["top", "bottom"], "versus": ["left", "right"], "flow": ["nodes"],
    "fanout": [], "scheduler": [], "code": ["lines"], "stat": ["value", "label"],
    "image": ["src"],
    "diagram": ["nodes", "beats"],
    "intro": ["name"], "endcard": ["question"], "signoff": [],
}

# keep in sync with GLYPHS in src/icons.tsx; "brand:<slug>" uses simple-icons
CUSTOM_ICONS = {"db", "server", "client", "phone", "user", "cloud", "msg", "file", "cpu", "lock",
                "queue", "gear", "browser", "terminal", "cube", "shield", "key", "clock", "check",
                "cross", "warning", "bolt", "globe", "folder", "chart", "bug", "rocket", "thread",
                "balance", "search", "bell"}
NODE_TYPES = {"icon", "box", "group", "cells", "pill", "text", "code", "badge", "mascot", "equation", "plot", "stat", "table"}
SERIES_TYPES = {"points", "line", "fn", "bars", "segments"}
FN_RE = re.compile(r"^[0-9a-zA-Z_+\-*/^().,\s]+$")
FN_NAMES = {"x", "PI", "E", "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh", "exp", "log",
            "log2", "log10", "sqrt", "abs", "pow", "min", "max", "floor", "ceil", "round", "sign"}


def fn_ok(expr):
    """Plot expressions are evaluated in the browser: allow only x, numbers, operators and Math functions."""
    if not FN_RE.match(expr):
        return False
    if re.search(r"\.", re.sub(r"\d+\.\d+|\.\d+|\d+\.(?!\w)", "", expr)):  # '.' only inside numbers
        return False
    return all(t in FN_NAMES for t in re.findall(r"[A-Za-z_]\w*", re.sub(r"\d+[eE][+-]?\d+", "", expr)))
EXPRS = {"idle", "happy", "wow", "think", "oops", "wink", "aha"}
LOOKS = {"center", "left", "right", "up", "down"}
SFX_NAMES = {"pop", "tick", "ding", "buzz", "boop", "whoosh"}
THEMES = {"classic", "sketch", "neon", "sticker", "minimal", "terminal", "ai", "dusk", "spectrum"}
CHARS = {"bit", "miu", "cu", "giot", "pix", "bong"}

# layout grid: col 1..7, row 1..5 (fractions allowed) -> canvas 1920x1080
GRID_X0, GRID_DX, GRID_Y0, GRID_DY = 160.0, 1600.0 / 6, 190.0, 170.0


LIB = ROOT / "assets" / "library"
_SETS = json.loads((LIB / "sets.json").read_text()) if (LIB / "sets.json").exists() else {}
# built-in single-colour glyph -> colour artwork from the library (used when icon_style == "color")
ICON_ALIASES = json.loads((LIB / "aliases.json").read_text()) if (LIB / "aliases.json").exists() else {}


def _lib_has(ref):
    return (LIB / (ref + ".svg")).exists()


def resolve_icons(script):
    """brand:<x> -> original-colour logo when the library has it; glyph names -> colour art (icon_style);
    default `tile` for logo sets. Per node: "mono": true keeps simple-icons, "glyph": true keeps the built-in glyph."""
    style = script.get("meta", {}).get("icon_style") or CFG.get("icon_style", "color")
    for sc in script.get("scenes", []):
        if sc.get("kind") != "diagram":
            continue
        for n in sc.get("props", {}).get("nodes", []):
            ic = n.get("icon")
            if n.get("type", "icon") != "icon" or not ic:
                continue
            if ic.startswith("brand:") and not n.get("mono"):
                b = ic[6:].lower()
                for cand in (b, b + "-icon", b + "-1"):
                    if _lib_has("logos/" + cand):
                        n["icon"] = ic = "img:logos/" + cand
                        break
            elif style == "color" and not n.get("glyph") and ic in ICON_ALIASES and _lib_has(ICON_ALIASES[ic]):
                n["icon"] = ic = "img:" + ICON_ALIASES[ic]
            if ic.startswith("img:") and "tile" not in n:
                n["tile"] = bool(_SETS.get(ic[4:].split("/")[0], {}).get("tile"))
    return script


def stage_library(script):
    """Copy the library icons a script uses into public/lib/ (served by Remotion's staticFile)."""
    for sc in script.get("scenes", []):
        for n in sc.get("props", {}).get("nodes", []) if sc.get("kind") == "diagram" else []:
            ic = n.get("icon") or ""
            if ic.startswith("img:") and _lib_has(ic[4:]):
                dst = ROOT / "public" / "lib" / (ic[4:] + ".svg")
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(LIB / (ic[4:] + ".svg"), dst)


def resolve_layout(script):
    """Turn node col/row into x/y (explicit x/y win). Mutates and returns script."""
    resolve_icons(script)
    for sc in script.get("scenes", []):
        if sc.get("kind") != "diagram":
            continue
        for n in sc.get("props", {}).get("nodes", []):
            if "x" not in n and "col" in n:
                n["x"] = round(GRID_X0 + (float(n["col"]) - 1) * GRID_DX)
            if "y" not in n and "row" in n:
                n["y"] = round(GRID_Y0 + (float(n["row"]) - 1) * GRID_DY)
    return script


def scene_text(sc):
    """Narration of a scene: plain text, or all beats joined for diagram scenes."""
    if sc.get("kind") == "diagram":
        return " ".join(b.get("text", "") for b in sc.get("props", {}).get("beats", []))
    return sc.get("text", "")


_LANG = {"cur": "vi"}


def script_lang(script):
    """Primary language of the on-screen text and of the main audio track (meta.lang, default vi)."""
    return (script.get("meta", {}) or {}).get("lang", "vi")


def set_lang(script):
    _LANG["cur"] = script_lang(script)
    return _LANG["cur"]


def lang_cfg(lang):
    return CFG.get("languages", {}).get(lang, {})


def words_per_sec(lang=None):
    return lang_cfg(lang or _LANG["cur"]).get("words_per_sec", CFG["words_per_sec"])


def secondary_langs(script):
    """Extra audio tracks: a beat carrying text_<lang> gets a dub in that language (meta.audio_langs)."""
    prim = script_lang(script)
    return [l for l in script.get("meta", {}).get("audio_langs", []) if l != prim]


def load_pronunciation(script=None, lang="vi"):
    """pronunciation.json (global, Vietnamese reading) or pronunciation.<lang>.json + optional script override."""
    d = {}
    p = ROOT / ("pronunciation.json" if lang == "vi" else f"pronunciation.{lang}.json")
    if p.exists():
        d.update({k: v for k, v in json.loads(p.read_text()).items() if not k.startswith("_")})
    if script:
        d.update(script.get("pronunciation" if lang == "vi" else f"pronunciation_{lang}", {}))
    return d


def apply_pronunciation(text, mapping):
    """Replace whole-word terms (case-sensitive, longest first) — TTS text only."""
    for term in sorted(mapping, key=len, reverse=True):
        text = re.sub(rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])",
                      lambda m, v=mapping[term]: v, text)
    return text


def pronunciation_warnings(scenes, mapping):
    """Find ALL-CAPS/CamelCase terms the TTS normalizer would spell out in Vietnamese letter names."""
    try:
        from sea_g2p import Normalizer
        norm = Normalizer(lang="vi")
    except Exception:  # noqa: BLE001
        return []
    seen, out = set(), []
    pat = re.compile(r"(?<![A-Za-z0-9])(?:[A-Z]{2,}[A-Za-z0-9]*|[a-z]+[A-Z][A-Za-z0-9]*|[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*)(?![A-Za-z0-9])")
    for sc in scenes:
        for term in pat.findall(scene_text(sc)):
            if term in seen or term in mapping:
                continue
            seen.add(term)
            # normalize in sentence context: a bare term is handled differently from one in a sentence
            res = norm.normalize(f"dùng {term} trong dự án", punc_norm=False).strip()
            res = res.removeprefix("dùng ").removesuffix(" trong dự án").strip()
            ok = res.startswith("<en>") or res.replace(" ", "") == term.lower() or res == term.lower()
            if not ok:
                out.append((term, res))
    return out


def apply_voice_fx(wav, preset):
    """Post-process a TTS clip in place: tempo, small pitch shift (duration kept), and optional tone shaping."""
    p = CFG.get("voice_fx_presets", {}).get(preset) if preset else None
    if not p:
        return
    sr = int(subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
         "-of", "csv=p=0", str(wav)], text=True).strip())
    chain = []
    if p.get("pitch"):
        f = 2 ** (p["pitch"] / 12)
        chain += [f"asetrate={sr * f:.0f}", f"atempo={1 / f:.5f}", f"aresample={sr}"]
    if p.get("tempo") and abs(p["tempo"] - 1) > 1e-6:
        chain += [f"atempo={p['tempo']:.4f}"]
    if any(p.get(k) for k in ("body", "low", "presence", "air")):
        chain += [
            "highpass=f=80",
            f"equalizer=f=130:t=o:w=1.0:g={p.get('low', 0)}",
            f"equalizer=f={p.get('body_f', 220)}:t=o:w=1.2:g={p.get('body', 0)}",
            f"equalizer=f=3000:t=o:w=1.5:g={p.get('presence', 0)}",
            f"highshelf=f=7500:g={p.get('air', 0)}",
            "deesser=i=0.35",
            "acompressor=threshold=-21dB:ratio=2:attack=12:release=160:makeup=2",
        ]
    if not chain:
        return
    tmp = Path(str(wav) + ".fx.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", ",".join(chain), str(tmp)], check=True)
    tmp.replace(wav)


def channel_cfg(a=None, lang="vi"):
    ch = dict(CFG.get("channel", {}))
    ch.setdefault("intro_line", "Chào mừng bạn đến với {name}.")
    ch.setdefault("outro_line", "Hãy đăng ký kênh {name} để không bỏ lỡ video mới. Hẹn gặp lại bạn!")
    if lang != "vi":
        lc = lang_cfg(lang)
        ch["intro_line"] = lc.get("intro_line", ch["intro_line"])
        ch["outro_line"] = lc.get("outro_line", ch["outro_line"])
        ch["labels"] = lc.get("labels", {})
    if a is not None and getattr(a, "channel_name", None):
        ch["name"] = a.channel_name
    if a is not None and getattr(a, "tagline", None):
        ch["tagline"] = a.tagline
    return ch


def slug(s):
    s = unicodedata.normalize("NFD", s.replace("Đ", "D").replace("đ", "d"))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().replace(" ", "_")


def est_seconds(text, beats=1):
    return len(text.split()) / words_per_sec() + CFG["pad_sec"] + CFG.get("beat_gap_sec", 0.25) * (beats - 1)


def _nbeats(sc):
    return max(1, len(sc.get("props", {}).get("beats", []))) if sc.get("kind") == "diagram" else 1


def probe_duration(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
        text=True).strip())


def mean_volume(p):
    r = subprocess.run(["ffmpeg", "-i", str(p), "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: (-?[\d.]+) dB", r).group(1))


def node_dims(n):
    """Approximate bounding box (w, h) — mirrors dims() in src/diagram.tsx incl. label space."""
    t = n.get("type", "icon")
    if t == "box":
        return n.get("w", 240), n.get("h", 92)
    if t == "group":
        return n.get("w", 400), n.get("h", 300)
    if t == "cells":
        return n.get("cols", 8) * 40 - 8, n.get("rows", 4) * 40 - 8 + (50 if n.get("label") else 0)
    if t == "pill":
        return n.get("w", 260), n.get("h", 56)
    if t == "badge":
        return 60, 60
    if t == "mascot":
        sz = n.get("size", 150)
        return sz, sz * 1.1
    if t == "code":
        fs, lines = n.get("size", 34), n.get("lines", [])
        return n.get("w", max([len(l) for l in lines] + [8]) * fs * 0.62 + 80), len(lines) * fs * 1.7 + 50
    if t == "text":
        fs = n.get("size", 44)
        return n.get("w", len(n.get("label", "")) * fs * 0.55), fs * 1.3
    if t == "equation":  # keep in sync with eqDims in src/math.tsx
        fs, tex = n.get("size", 56), n.get("tex", "")
        plain = re.sub(r"[{}^_ ]", "", re.sub(r"\\[a-zA-Z]+", "x", tex))
        return n.get("w", max(160, len(plain) * fs * 0.52 + 40)), n.get("h", fs * 1.7 * len(tex.split("\\\\")))
    if t == "plot":
        return n.get("w", 760), n.get("h", 520)
    if t == "stat":  # keep in sync with statDims in src/math.tsx
        size = n.get("size", 96)
        v = n.get("value", 0)
        txt = f"{n.get('prefix', '')}{v:,.{n.get('decimals', 0)}f}{n.get('suffix', '')}"
        return n.get("w", max(220, len(txt) * size * 0.62 + 40)), n.get("h", size * 1.25 + (size * 0.62 if n.get("label") else 0))
    if t == "table":
        rows = n.get("rows", [])
        cols = max([len(r) for r in rows] + [1])
        cw = sum(n["colws"]) if n.get("colws") else cols * n.get("colw", 170)
        return n.get("w", cw), n.get("h", len(rows) * n.get("rowh", 58))
    sz = n.get("size", 124)
    return sz, sz + (52 if n.get("label") else 0)


def _rect(n):
    w, h = node_dims(n)
    t = n.get("type", "icon")
    if t == "mascot":  # include a typical speech bubble to the right
        if n.get("side") == "left":
            return n["x"] - w / 2 - 330, n["y"] - h / 2 - 12, n["x"] + w / 2, n["y"] + h / 2
        return n["x"] - w / 2, n["y"] - h / 2 - 12, n["x"] + w / 2 + 330, n["y"] + h / 2
    top = n["y"] - (node_dims({**n, "label": ""})[1] / 2 if t == "icon" else h / 2)
    return n["x"] - w / 2, top, n["x"] + w / 2, top + h


def _seg_hits_rect(a, b, r, pad=4):
    x0, y0, x1, y1 = r[0] - pad, r[1] - pad, r[2] + pad, r[3] + pad
    for k in range(0, 21):
        t = k / 20
        x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
        if x0 < x < x1 and y0 < y < y1:
            return True
    return False


def lint_diagram(i, pr, subtitles):
    """Warn about layout problems among things visible at the same time."""
    warns = []
    nodes = {n["id"]: n for n in pr.get("nodes", []) if "x" in n and "y" in n}
    edges = {e["id"]: e for e in pr.get("edges", [])}
    vis, seen = set(), set()
    tag = f"Cảnh {i}"
    bottom = 1000 if not subtitles else 900
    for j, b in enumerate(pr.get("beats", []), 1):
        a = b.get("do", {}) or {}
        if a.get("clear"):
            vis = {k for k in vis if nodes.get(k, {}).get("type") == "mascot"}
        vis -= set(a.get("hide", []))
        vis |= set(a.get("show", []))
        for nid in a.get("show", []):
            n = nodes.get(nid)
            if n and n.get("type") not in ("group", "mascot"):  # the mascot is a fixed overlay at the bottom edge
                x0, y0, x1, y1 = _rect(n)
                if x0 < 30 or x1 > 1890 or y0 < 70 or y1 > bottom:
                    warns.append(f"{tag} beat {j}: '{nid}' gần/ra ngoài mép an toàn "
                                 f"({x0:.0f},{y0:.0f})–({x1:.0f},{y1:.0f})")
        vn = [nodes[k] for k in vis if k in nodes and nodes[k].get("type") != "group"]
        for p in range(len(vn)):
            for q in range(p + 1, len(vn)):
                ra, rb = _rect(vn[p]), _rect(vn[q])
                if ra[0] < rb[2] - 6 and rb[0] < ra[2] - 6 and ra[1] < rb[3] - 6 and rb[1] < ra[3] - 6:
                    key = tuple(sorted((vn[p]["id"], vn[q]["id"])))
                    if key not in seen:
                        seen.add(key)
                        warns.append(f"{tag} beat {j}: '{key[0]}' chồng lên '{key[1]}'")
        for eid in vis:
            e = edges.get(eid)
            if not e or e["from"] not in nodes or e["to"] not in nodes:
                continue
            A, B = nodes[e["from"]], nodes[e["to"]]
            if e.get("route") in ("hv", "vh"):
                continue  # elbows are laid out by hand; skip
            for k in vis:
                n = nodes.get(k)
                if not n or k in (e["from"], e["to"]) or n.get("type") == "group":
                    continue
                key = ("edge", eid, k)
                if key not in seen and _seg_hits_rect((A["x"], A["y"]), (B["x"], B["y"]), _rect(n)):
                    seen.add(key)
                    warns.append(f"{tag} beat {j}: đường nối '{eid}' cắt qua '{k}'")
    return warns


def validate_plot(tag, nid, n):
    out = []
    for key in ("xrange", "yrange"):
        r = n.get(key, [0, 10])
        if not (isinstance(r, list) and len(r) == 2 and all(isinstance(v, (int, float)) for v in r) and r[0] < r[1]):
            out.append(f"{tag}: plot '{nid}' {key} phải là [min, max] với min < max")
    series = n.get("series")
    if not isinstance(series, list) or not series:
        return out + [f"{tag}: plot '{nid}' thiếu series (danh sách)"]
    for k, s in enumerate(series):
        st = s.get("type")
        where = f"{tag}: plot '{nid}' series[{k}]"
        if st not in SERIES_TYPES:
            out.append(f"{where} type '{st}' không hợp lệ ({', '.join(sorted(SERIES_TYPES))})")
        elif st == "fn":
            if not fn_ok(str(s.get("fn", ""))):
                out.append(f"{where}: fn chỉ gồm số, x, + - * / ^ ( ) và hàm Math ({', '.join(sorted(FN_NAMES - {'x'}))})")
        else:
            width = 4 if st == "segments" else 2
            d = s.get("data")
            if not (isinstance(d, list) and d and all(isinstance(r, list) and len(r) == width for r in d)):
                out.append(f"{where}: data phải là danh sách các [{'x1,y1,x2,y2' if width == 4 else 'x,y'}]")
    step = n.get("step")
    if step is not None and not (isinstance(step, int) and 0 <= step <= len(series)):
        out.append(f"{tag}: plot '{nid}' step phải là số nguyên 0..{len(series)}")
    return out


def validate_diagram(i, pr):
    out, ids, eids = [], set(), set()
    tag = f"Cảnh {i} (diagram)"
    brands = []
    for n in pr.get("nodes", []):
        nid = n.get("id")
        if not nid:
            out.append(f"{tag}: có node thiếu id")
            continue
        if nid in ids:
            out.append(f"{tag}: id '{nid}' bị trùng")
        ids.add(nid)
        if "x" not in n or "y" not in n:
            out.append(f"{tag}: node '{nid}' thiếu x/y")
        t = n.get("type", "icon")
        if t not in NODE_TYPES:
            out.append(f"{tag}: node '{nid}' type '{t}' không hợp lệ ({', '.join(sorted(NODE_TYPES))})")
        if t == "mascot":
            if n.get("expr", "idle") not in EXPRS:
                out.append(f"{tag}: mascot '{nid}' expr '{n.get('expr')}' không hợp lệ ({', '.join(sorted(EXPRS))})")
            if n.get("char", "bit") not in CHARS:
                out.append(f"{tag}: mascot '{nid}' char '{n.get('char')}' không có ({', '.join(sorted(CHARS))})")
            if n.get("look", "center") not in LOOKS:
                out.append(f"{tag}: mascot '{nid}' look '{n.get('look')}' không hợp lệ")
        if t == "equation" and not str(n.get("tex", "")).strip():
            out.append(f"{tag}: equation '{nid}' thiếu tex (chuỗi KaTeX)")
        if t == "plot":
            out += validate_plot(tag, nid, n)
        if t == "stat" and not isinstance(n.get("value"), (int, float)):
            out.append(f"{tag}: stat '{nid}' thiếu value (số)")
        if t == "table":
            rws = n.get("rows")
            if not (isinstance(rws, list) and rws and all(isinstance(r, list) and r for r in rws)):
                out.append(f"{tag}: table '{nid}' thiếu rows (danh sách các hàng, mỗi hàng là danh sách ô)")
        ic = n.get("icon")
        if t == "icon" and ic:
            if ic.startswith("img:"):
                if not (ROOT / "assets" / "library" / (ic[4:] + ".svg")).exists():
                    out.append(f"{tag}: icon '{ic}' không có trong assets/library "
                               f"(tìm: ./make-video assets search <từ khóa> [--remote])")
            elif ic.startswith("brand:"):
                brands.append(ic[6:].lower())
            elif ic not in CUSTOM_ICONS:
                out.append(f"{tag}: icon '{ic}' không có (có: {', '.join(sorted(CUSTOM_ICONS))}, hoặc brand:<tên>)")
    for e in pr.get("edges", []):
        eid = e.get("id")
        eids.add(eid)
        if eid in ids:
            out.append(f"{tag}: id '{eid}' trùng giữa node và edge")
        for end in ("from", "to"):
            if e.get(end) not in ids:
                out.append(f"{tag}: edge '{eid}' {end}='{e.get(end)}' không phải node")
    known = ids | eids
    if not pr.get("beats"):
        out.append(f"{tag}: thiếu beats")
    for j, b in enumerate(pr.get("beats", []), 1):
        if not b.get("text", "").strip():
            out.append(f"{tag}: beat {j} thiếu text")
        a = b.get("do", {}) or {}
        for key in ("show", "hide", "highlight", "flow"):
            for ref in a.get(key, []):
                if ref not in known:
                    out.append(f"{tag}: beat {j} {key} → '{ref}' không tồn tại")
        for ref, vals in (a.get("set") or {}).items():
            if ref not in known:
                out.append(f"{tag}: beat {j} set → '{ref}' không tồn tại")
            elif "expr" in vals and vals["expr"] not in EXPRS:
                out.append(f"{tag}: beat {j} set {ref}.expr '{vals['expr']}' không hợp lệ")
        cam = a.get("camera") or {}
        if cam.get("focus") and cam["focus"] not in ids:
            out.append(f"{tag}: beat {j} camera.focus → '{cam['focus']}' không phải node")
        sx = b.get("sfx")
        for nm in ([] if sx in (None, False) else sx if isinstance(sx, list) else [sx]):
            if nm not in SFX_NAMES:
                out.append(f"{tag}: beat {j} sfx '{nm}' không có ({', '.join(sorted(SFX_NAMES))})")
    if brands:  # verify logos exist in simple-icons
        names = ["si" + b[:1].upper() + b[1:] for b in brands]
        r = subprocess.run(["node", "-e",
            "const s=require('simple-icons');console.log(JSON.stringify(process.argv.slice(1).filter(n=>!s[n])))",
            *names], cwd=ROOT, capture_output=True, text=True)
        try:
            for n in json.loads(r.stdout or "[]"):
                out.append(f"{tag}: không có logo brand:{n[2:].lower()} trong simple-icons")
        except json.JSONDecodeError:
            pass
    return out


def validate_structure(script):
    """Every video must end with a summary and an open question, and carry meta.question / meta.next."""
    out = []
    meta = script.get("meta", {})
    if not str(meta.get("question", "")).strip():
        out.append("meta.question: thiếu (câu hỏi mở hiển thị ở màn hình kết, nên ≤ 14 từ)")
    scenes = script.get("scenes", [])
    if not scenes:
        return out
    if scenes[-1].get("kind") == "diagram":
        roles = [b.get("role") for b in scenes[-1].get("props", {}).get("beats", [])]
        unit = "beat"
    else:
        roles = [sc.get("role") for sc in scenes]
        unit = "cảnh"
    if not roles or roles[-1] != "question":
        out.append(f"Kết: {unit} cuối phải có role \"question\" (câu hỏi mở để người xem tự suy nghĩ)")
    if len(roles) < 2 or roles[-2] != "summary":
        out.append(f"Kết: {unit} ngay trước câu hỏi phải có role \"summary\" (tóm tắt / kết luận)")
    return out


def validate(script):
    problems = []
    for i, sc in enumerate(script.get("scenes", []), 1):
        k = sc.get("kind")
        if k not in REQUIRED:
            problems.append(f"Cảnh {i}: kind '{k}' không được hỗ trợ (có: {', '.join(REQUIRED)})")
            continue
        if k == "diagram":
            problems += validate_diagram(i, sc.get("props", {}))
        elif not sc.get("text", "").strip():
            problems.append(f"Cảnh {i}: thiếu 'text' (lời đọc)")
        for key in REQUIRED[k]:
            if key not in sc.get("props", {}):
                problems.append(f"Cảnh {i} ({k}): thiếu props.{key}")
        if k == "image" and "src" in sc.get("props", {}):
            if not (ROOT / "public" / "images" / sc["props"]["src"]).exists():
                problems.append(f"Cảnh {i}: không thấy public/images/{sc['props']['src']}")
    problems += validate_structure(script)
    return problems


def _truncate_diagram(sc, budget):
    """Keep the first beats of a diagram scene until ~budget seconds (at least one beat)."""
    import copy
    out = copy.deepcopy(sc)
    kept, cum = [], 0.0
    for b in out["props"]["beats"]:
        kept.append(b)
        cum += len(b["text"].split()) / words_per_sec() + CFG.get("beat_gap_sec", 0.25)
        if cum >= budget - 0.5:
            break
    out["props"]["beats"] = kept
    return out


def pick_demo_scenes(scenes):
    """Scenes from the start until ~demo_seconds. A long diagram scene is cut at beat level."""
    limit, cum, chosen = CFG["demo_seconds"], 0.0, []
    for sc in scenes:
        e = est_seconds(scene_text(sc), _nbeats(sc))
        if cum + e > limit * 1.25:
            remaining = limit - cum
            if sc.get("kind") == "diagram" and remaining > 5:
                chosen.append(_truncate_diagram(sc, remaining))
            elif not chosen:
                chosen.append(sc)
            break
        chosen.append(sc)
        cum += e
        if cum >= limit:
            break
    return chosen


def cmd_check(a):
    sf = EP.script_file(a.script)
    EP.stage_assets(sf)
    script = resolve_layout(json.loads(sf.read_text()))
    lang = set_lang(script)
    stage_library(script)
    probs = validate(script) + EP.source_problems(sf, script)
    scenes = script.get("scenes", [])
    print(f"{'#':>2}  {'kind':<9} {'từ':>4} {'~giây':>6}  lời đọc")
    total = 0.0
    for i, sc in enumerate(scenes, 1):
        e = est_seconds(scene_text(sc), _nbeats(sc))
        total += e
        t = scene_text(sc)
        print(f"{i:>2}  {sc.get('kind','?'):<9} {len(t.split()):>4} {e:>6.1f}  {t[:70]}{'…' if len(t) > 70 else ''}")
    target = script.get("meta", {}).get("target_seconds")
    m, s = divmod(round(total), 60)
    print(f"\nƯớc tính tổng: {m} phút {s} giây ({total:.0f}s)" +
          (f" | mục tiêu: {target // 60} phút {target % 60} giây" if target else ""))
    if target and abs(total - target) > max(8, target * 0.12):
        diff = total - target
        print(f"⚠ Lệch {diff:+.0f}s so với mục tiêu (≈ {abs(diff) * words_per_sec():.0f} từ)")
    for p in probs:
        print("✗", p)
    lw = []
    for i, sc in enumerate(scenes, 1):
        if sc.get("kind") == "diagram":
            lw += lint_diagram(i, sc.get("props", {}), script.get("meta", {}).get("subtitles", True))
    if lw:
        print("\n⚠ Bố cục sơ đồ:")
        for w in lw:
            print("   " + w)
    ch = channel_cfg(lang=lang)
    meta = script.get("meta", {})
    for dl in secondary_langs(script):
        miss = [f"{sc['id']}#{j}" for sc in scenes if sc.get("kind") == "diagram"
                for j, b in enumerate(sc["props"]["beats"]) if not b.get(f"text_{dl}")]
        have = sum(len(sc["props"]["beats"]) for sc in scenes if sc.get("kind") == "diagram") - len(miss)
        print(f"\nLồng tiếng {dl}: {have} beat có text_{dl}" + (f", thiếu {len(miss)} beat" if miss else " (đủ)"))
    print(f"\nIntro tự động : {ch.get('name') or '⚠ CHƯA ĐẶT TÊN KÊNH (config.json → channel.name)'}"
          f"{' — ' + ch['tagline'] if ch.get('tagline') else ''}")
    print(f"Màn hình kết  : câu hỏi \"{meta.get('question', '⚠ thiếu')}\"")
    print(f"Outro (đọc)   : {ch.get('outro_line', '').format(name=ch.get('name', ''))}")
    pw = pronunciation_warnings(scenes, load_pronunciation(script)) if lang == "vi" else []
    if pw:
        print("\n⚠ Từ có thể bị đọc theo tên chữ cái tiếng Việt (thêm vào pronunciation.json):")
        for term, res in pw:
            print(f"   {term:<14} → \"{res}\"")
    sys.exit(1 if probs else 0)


def ensure_music(music, need_sec, prog):
    base = ROOT / "assets" / "music" / f"{music}.wav"
    if probe_duration(base) >= need_sec or music not in CFG.get("music_captions", {}):
        return base  # long enough, or a ready-made extended file (e.g. lofi_chill_590s): it just loops if short
    n = min(600, int(math.ceil((need_sec + 3) / 10) * 10))
    ext = ROOT / "assets" / "music" / f"{music}_{n}s.wav"
    if ext.exists():
        return ext
    prog.update("music", 0.0, f"Sinh nhạc nền dài {n}s (ACE-Step)")
    import time
    cmd = ["uv", "run", "--project", str(ROOT / "tools" / "acestep"), "python",
           str(ROOT / "scripts" / "gen_music.py"), "--caption", CFG["music_captions"][music],
           "--duration", str(n), "--seed", "7", "--out", str(ext)]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0, est = time.time(), 30 + n / 5
    while proc.poll() is None:
        prog.update("music", min(0.95, (time.time() - t0) / est))
        time.sleep(1)
    if proc.returncode != 0 or not ext.exists():
        raise RuntimeError("Sinh nhạc nền dài thất bại")
    return ext


_TTS = {}


def get_tts(voice):
    """One shared VieNeu instance per process (model load is slow)."""
    from vieneu import Vieneu
    if "t" not in _TTS:
        _TTS["t"] = Vieneu()
    ensure_voice(_TTS["t"], voice)
    return _TTS["t"]


def en_voice_id(voice, lang):
    """Vietnamese voice name -> the paired voice of the other language (config.languages.<lang>.voices)."""
    m = lang_cfg(lang).get("voices", {})
    if voice not in m:
        sys.exit(f"Chưa ghép giọng '{voice}' với giọng {lang} (config.json → languages.{lang}.voices)")
    return m[voice]


def kokoro_synth(jobs):
    """jobs: [(text, kokoro_voice, wav_path)] -> wav files, via tools/kokoro (own venv, one model load)."""
    py = ROOT / "tools" / "kokoro" / ".venv" / "bin" / "python"
    if not py.exists():
        sys.exit("Chưa cài giọng tiếng Anh: chạy scripts/setup.sh (tạo tools/kokoro) và brew install espeak-ng")
    import tempfile
    (ROOT / "out" / "work").mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".json", prefix="kokoro_jobs_", dir=ROOT / "out" / "work",
                                     delete=False, encoding="utf-8") as fh:  # unique per call: renders may overlap
        json.dump([{"text": t, "voice": v, "out": str(w)} for t, v, w in jobs], fh, ensure_ascii=False)
    try:
        subprocess.run([str(py), "-I", str(ROOT / "scripts" / "kokoro_tts.py"), fh.name], check=True)
    finally:
        Path(fh.name).unlink(missing_ok=True)


def speak_many(items, lang, voice, fx, pron):
    """items: [(text, wav_path)] -> wav files in `lang`. Vietnamese: VieNeu (+voice fx); English: Kokoro."""
    if lang == "vi":
        tts = get_tts(voice)
        for text, wav in items:
            tts.save(tts.infer(apply_pronunciation(text, pron), voice=voice), str(wav))
            apply_voice_fx(wav, fx)
        return
    kokoro_synth([(apply_pronunciation(text, pron), en_voice_id(voice, lang), wav) for text, wav in items])


def fit_clip(wav, limit, max_speedup):
    """Speed a clip up (pitch kept) so it lasts <= limit seconds. Returns (final_duration, overflow_seconds)."""
    d = probe_duration(wav)
    if d <= limit:
        return d, 0.0
    r = min(d / limit, max_speedup)
    tmp = Path(str(wav) + ".fit.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", f"atempo={r:.4f}", str(tmp)], check=True)
    tmp.replace(wav)
    d2 = probe_duration(wav)
    if d2 <= limit + 0.02:
        return d2, 0.0
    tmp = Path(str(wav) + ".cut.wav")  # still too long: cut with a short fade so it never runs into the next beat
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-t", f"{limit:.3f}", "-af",
                    f"afade=t=out:st={max(0.0, limit - 0.12):.3f}:d=0.12", str(tmp)], check=True)
    tmp.replace(wav)
    return limit, d2 - limit


def remotion_scale():
    """Output scale factor (2 = 3840x2160). Part of the intro/outro cache key: clips are joined by stream copy."""
    return os.environ.get("WHYLOOP_RENDER_SCALE", CFG.get("render", {}).get("scale")) or 1


def remotion_perf_flags(audio_only=False):
    """Speed flags from config.json -> render (concurrency / hardware_acceleration / gl); env WHYLOOP_RENDER_* overrides."""
    rc = CFG.get("render", {})
    def pick(key):
        v = os.environ.get("WHYLOOP_RENDER_" + key.upper(), rc.get(key))
        return str(v) if v not in (None, "") else None
    flags = []
    if pick("concurrency"):
        flags.append(f"--concurrency={pick('concurrency')}")
    if pick("gl"):
        flags.append(f"--gl={pick('gl')}")
    if not audio_only and float(remotion_scale()) != 1:
        flags.append(f"--scale={remotion_scale()}")
    if pick("hardware_acceleration") and not audio_only:
        flags.append(f"--hardware-acceleration={pick('hardware_acceleration')}")
    return flags


def run_remotion(props, out_mp4, prog=None, stage="render", label="Dựng hình", audio_only=False):
    proc = subprocess.Popen(
        ["npx", "remotion", "render", "src/index.ts", "Main", str(out_mp4), "--props", str(props)]
        + (["--codec=wav"] if audio_only else []) + remotion_perf_flags(audio_only),
        cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    buf, rendered, encoded, total, tail = "", 0, 0, 1, []
    while True:
        chunk = proc.stdout.read1(4096)
        if not chunk:
            break
        buf += chunk.decode("utf-8", "replace")
        parts = re.split(r"[\r\n]", buf)
        buf = parts.pop()
        for ln in parts:
            tail = (tail + [ln])[-15:]
            m = re.search(r"Rendered (\d+)/(\d+)", ln)
            if m:
                rendered, total = int(m.group(1)), int(m.group(2))
            m2 = re.search(r"Encoded (\d+)/(\d+)", ln)
            if m2:
                encoded, total = int(m2.group(1)), int(m2.group(2))
            if (m or m2 or rendered) and prog:
                prog.update(stage, 0.5 * rendered / total + 0.5 * encoded / total,
                            f"{label}: {rendered}/{total} khung")
    if proc.wait() != 0:
        raise RuntimeError("Remotion render lỗi:\n" + "\n".join(tail))


def video_seconds(p):
    try:
        return float(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                              "stream=duration", "-of", "csv=p=0", str(p)], text=True).strip())
    except Exception:  # noqa: BLE001
        return probe_duration(p)


def finish_clip(src, dst):
    """Two-pass loudness normalisation (short clips need measured values) + fixed audio format,
    so separately made clips can be joined by stream copy."""
    target = CFG["target_lufs"]
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af",
                        f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    af = f"loudnorm=I={target}:TP=-1.5:LRA=11"
    if m:
        st = json.loads(m.group(0))
        af += (f":measured_I={st['input_i']}:measured_TP={st['input_tp']}:measured_LRA={st['input_lra']}"
               f":measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af + ",aresample=48000",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                    "-t", f"{video_seconds(src):.3f}", str(dst)],
                   check=True)


def join_clips(parts, out):
    """Concatenate clips (stream copy; re-encode only if the copy is not clean)."""
    lst = Path(str(out) + ".txt")
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-c", "copy", str(out)], capture_output=True, text=True)
    ok = r.returncode == 0 and abs(sum(probe_duration(p) for p in parts) - probe_duration(out)) < 0.25
    mode = "copy"
    if not ok:
        mode = "re-encode"
        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for p in parts:
            cmd += ["-i", str(p)]
        n = len(parts)
        fc = "".join(f"[{k}:v][{k}:a]" for k in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
        subprocess.run(cmd + ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264",
                              "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(out)],
                       check=True)
    lst.unlink(missing_ok=True)
    return mode


def brand_key(ch, voice, fx, theme, lang="vi"):
    """Hash of everything that changes how the intro / outro look or sound (cache key)."""
    h = hashlib.sha1()
    for f in ("src/Video.tsx", "src/scenes.tsx", "src/theme.ts", "src/mascot.tsx", "src/icons.tsx",
              "assets/brand/avatar.png", "assets/sfx/sting.wav"):
        fp = ROOT / f
        h.update(fp.read_bytes() if fp.exists() else b"-")
    mix = CFG.get("voice_mixes", {}).get(voice)
    base = mix["user"] if mix else voice
    cv = custom_voices().get(base)
    if cv and Path(cv).exists():
        h.update(Path(cv).read_bytes())
    info = {"ch": {k: ch.get(k) for k in ("name", "tagline", "font", "font_weight", "intro_line", "outro_line")},
            "voice": voice, "mix": mix, "fx": fx, "fxp": CFG.get("voice_fx_presets", {}).get(fx) if fx else None,
            "theme": theme, "scale": remotion_scale(), "pron": load_pronunciation(),
            "t": [CFG["fps"], CFG["pad_sec"], CFG.get("intro_min_sec"), CFG.get("signoff_min_sec"), CFG["target_lufs"]]}
    if lang != "vi":  # keep Vietnamese cache keys unchanged
        info.update({"lang": lang, "lang_voice": lang_cfg(lang).get("voices", {}).get(voice),
                     "lang_pron": load_pronunciation(lang=lang), "labels": ch.get("labels")})
    h.update(json.dumps(info, sort_keys=True, ensure_ascii=False).encode())
    return h.hexdigest()[:12]


def brand_paths(a, voice, fx, theme, lang="vi"):
    ch = channel_cfg(a, lang)
    key = brand_key(ch, voice, fx, theme, lang)
    d = ROOT / "assets" / "brand" / "build" / key
    return ch, key, d, d / "intro.mp4", d / "outro.mp4"


def build_brand(a, voice, fx, theme, force=False, prog=None, lang="vi"):
    """Make (or reuse) the standalone intro and outro clips. Returns (intro, outro, rebuilt)."""
    ch, key, d, intro_p, outro_p = brand_paths(a, voice, fx, theme, lang)
    if intro_p.exists() and outro_p.exists() and not force:
        return intro_p, outro_p, False
    d.mkdir(parents=True, exist_ok=True)
    fps = CFG["fps"]
    pron = load_pronunciation(lang=lang)
    if lang != "vi":
        fx = None
    rel = f"audio/_brand/{key}"
    (ROOT / "public" / rel).mkdir(parents=True, exist_ok=True)
    avatar_src = ROOT / ch.get("avatar", "assets/brand/avatar.png")
    avatar_rel = None
    if avatar_src.exists():
        (ROOT / "public" / "brand").mkdir(parents=True, exist_ok=True)
        shutil.copy(avatar_src, ROOT / "public" / "brand" / "avatar.png")
        avatar_rel = "brand/avatar.png"
    chan = {"name": ch["name"], "tagline": ch.get("tagline", ""), "font": ch.get("font", "quicksand"),
            "fontWeight": ch.get("font_weight", 600), "avatar": avatar_rel}

    def speak(text, nm):
        wav = ROOT / "public" / rel / f"{nm}.wav"
        speak_many([(text, wav)], lang, voice, fx, pron)
        return f"{rel}/{nm}.wav", probe_duration(wav)

    if prog:
        prog.update("brand", 0.0, "Tạo giọng intro / outro")
    ia, isec = speak(ch["intro_line"].format(name=ch["name"]), "intro")
    oa, osec = speak(ch["outro_line"].format(name=ch["name"]), "outro")
    ifr = max(round((isec + CFG["pad_sec"]) * fps), round(CFG.get("intro_min_sec", 4.0) * fps))
    ofr = max(round((osec + CFG["pad_sec"]) * fps), round(CFG.get("signoff_min_sec", 4.6) * fps))
    base = {"fps": fps, "subtitles": False, "channel": chan, "theme": theme}
    timelines = {
        "intro": {**base, "title": "intro", "scenes": [
            {"id": "intro", "kind": "intro", "text": "", "audio": ia, "durationInFrames": ifr,
             "props": {"name": ch["name"], "tagline": ch.get("tagline", "")}},
            {"id": "pad", "kind": "pad", "text": "", "props": {}, "audio": None, "durationInFrames": 14}]},
        "outro": {**base, "title": "outro", "scenes": [
            {"id": "pad", "kind": "pad", "text": "", "props": {}, "audio": None, "durationInFrames": 6},
            {"id": "signoff", "kind": "signoff", "text": "", "audio": oa, "durationInFrames": ofr,
             "props": {"name": ch["name"], **ch.get("labels", {})}}]},
    }
    for k, (nm, tl) in enumerate(timelines.items()):
        props = d / f"{nm}.props.json"
        props.write_text(json.dumps({"timeline": tl}, ensure_ascii=False))
        raw = d / f"{nm}.raw.mp4"
        run_remotion(props, raw, prog, "brand", f"Dựng {nm}")
        finish_clip(raw, d / f"{nm}.mp4")
        raw.unlink(missing_ok=True)
    (d / "meta.json").write_text(json.dumps({
        "key": key, "voice": voice, "lang": lang, "theme": theme, "intro_sec": round(probe_duration(intro_p), 2),
        "outro_sec": round(probe_duration(outro_p), 2)}, ensure_ascii=False, indent=2))
    if lang == "vi":  # assets/brand/{intro,outro}.mp4 stay the Vietnamese convenience copies
        shutil.copy(intro_p, ROOT / "assets" / "brand" / "intro.mp4")
        shutil.copy(outro_p, ROOT / "assets" / "brand" / "outro.mp4")
    return intro_p, outro_p, True


# ---------------- dubbing: the same video, another language ----------------
def silence_wav(path, sec=0.1):
    if not path.exists():
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                        "-t", str(sec), str(path)], check=True)
    return path


def finish_audio(src, dst):
    """Loudness-normalise (two-pass) to the channel target; fixed 48 kHz stereo wav so parts can be concatenated."""
    target = CFG["target_lufs"]
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af",
                        f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    af = f"loudnorm=I={target}:TP=-1.5:LRA=11"
    if m:
        st = json.loads(m.group(0))
        af += (f":measured_I={st['input_i']}:measured_TP={st['input_tp']}:measured_LRA={st['input_lra']}"
               f":measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af + ",aresample=48000",
                    "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", str(dst)], check=True)


def build_brand_dub(a, voice, theme, lang, key_dir, intro_p, outro_p, ch_main, prog=None):
    """Intro / outro audio in another language, exactly as long as the primary clips (same visuals, same sting).
    Returns (intro.<lang>.wav, outro.<lang>.wav)."""
    out_i, out_o = key_dir / f"intro.{lang}.wav", key_dir / f"outro.{lang}.wav"
    if out_i.exists() and out_o.exists():
        return out_i, out_o
    fps = CFG["fps"]
    chd = channel_cfg(a, lang)
    ifr = round(probe_duration(intro_p) * fps) - 14   # clip = scene + 14 / 6 frames of padding (see build_brand)
    ofr = round(probe_duration(outro_p) * fps) - 6
    fx = CFG.get("voice_fx", {}).get(voice) if lang == "vi" else None
    pron = load_pronunciation(lang=lang)
    rel = f"audio/_brand/{key_dir.name}_{lang}"
    (ROOT / "public" / rel).mkdir(parents=True, exist_ok=True)
    wi, wo = ROOT / "public" / rel / "intro.wav", ROOT / "public" / rel / "outro.wav"
    speak_many([(chd["intro_line"].format(name=ch_main["name"]), wi),
                (chd["outro_line"].format(name=ch_main["name"]), wo)], lang, voice, fx, pron)
    ms = lang_cfg(lang).get("max_speedup", 1.25)
    fit_clip(wi, ifr / fps - 0.2, ms)
    fit_clip(wo, ofr / fps - 0.2, ms)
    avatar_rel = "brand/avatar.png" if (ROOT / "public" / "brand" / "avatar.png").exists() else None
    chan = {"name": ch_main["name"], "tagline": ch_main.get("tagline", ""), "font": ch_main.get("font", "quicksand"),
            "fontWeight": ch_main.get("font_weight", 600), "avatar": avatar_rel}
    base = {"fps": fps, "subtitles": False, "channel": chan, "theme": theme}
    tls = {"intro": {**base, "title": "intro", "scenes": [
               {"id": "intro", "kind": "intro", "text": "", "audio": f"{rel}/intro.wav", "durationInFrames": ifr,
                "props": {"name": ch_main["name"], "tagline": ch_main.get("tagline", "")}},
               {"id": "pad", "kind": "pad", "text": "", "props": {}, "audio": None, "durationInFrames": 14}]},
           "outro": {**base, "title": "outro", "scenes": [
               {"id": "pad", "kind": "pad", "text": "", "props": {}, "audio": None, "durationInFrames": 6},
               {"id": "signoff", "kind": "signoff", "text": "", "audio": f"{rel}/outro.wav", "durationInFrames": ofr,
                "props": {"name": ch_main["name"], **ch_main.get("labels", {})}}]}}
    for nm, tl in tls.items():
        props = key_dir / f"{nm}.{lang}.props.json"
        props.write_text(json.dumps({"timeline": tl}, ensure_ascii=False))
        raw = key_dir / f"{nm}.{lang}.raw.wav"
        run_remotion(props, raw, prog, "brand", f"Âm thanh {nm} ({lang})", audio_only=True)
        finish_audio(raw, key_dir / f"{nm}.{lang}.wav")
        raw.unlink(missing_ok=True)
        props.unlink(missing_ok=True)
    return out_i, out_o


def render_dub(a, script, scenes, voice, music, name, tag, lang, prog):
    """Dub the already-timed video into `lang`: speak each beat's text_<lang>, squeeze it into the beat's frame slot,
    then let Remotion mix the audio again (audio-only render, so sfx stay on their cues). Returns (content wav, report)."""
    import copy
    work = ROOT / "out" / "work"
    fps = CFG["fps"]
    tl_scenes = copy.deepcopy(scenes)
    rel = f"audio/{name}/{slug(voice)}_{lang}"
    adir = ROOT / "public" / rel
    adir.mkdir(parents=True, exist_ok=True)
    key = f"text_{lang}"
    items, refs = [], []   # refs: (holder dict, wav, slot seconds, label)
    silence = silence_wav(adir / "_silence.wav")
    for si, sc in enumerate(tl_scenes):
        if sc["kind"] == "diagram":
            for bi, b in enumerate(sc["props"]["beats"]):
                if b.get(key):
                    wav = adir / f"{si:02d}_{sc['id']}_b{bi}.wav"
                    items.append((b[key], wav))
                    refs.append((b, wav, b["durationInFrames"] / fps, f"{sc['id']}#{bi}"))
                else:
                    b["audio"] = f"{rel}/{silence.name}"
        elif sc.get("audio"):
            if sc.get(key):
                wav = adir / f"{si:02d}_{sc['id']}.wav"
                items.append((sc[key], wav))
                refs.append((sc, wav, sc["durationInFrames"] / fps, sc["id"]))
            else:
                sc["audio"] = f"{rel}/{silence.name}"
    fx = CFG.get("voice_fx", {}).get(voice) if lang == "vi" else None
    prog.update("dub", 0.0, f"Giọng {lang}: {len(items)} đoạn")
    speak_many(items, lang, voice, fx, load_pronunciation(script, lang))
    ms = lang_cfg(lang).get("max_speedup", 1.25)
    report = []
    for holder, wav, slot, label in refs:
        raw = probe_duration(wav)
        final, over = fit_clip(wav, slot - 0.2, ms)
        holder["audio"] = f"{rel}/{wav.name}"
        report.append({"beat": label, "slot": round(slot, 2), "raw": round(raw, 2), "final": round(final, 2),
                       "speedup": round(raw / final, 2) if final else 1.0, "cut_sec": round(over, 2)})
    props = work / f"{tag}.{lang}.props.json"
    props.write_text(json.dumps({"timeline": {
        "title": script.get("title", name), "fps": fps, "scenes": tl_scenes, "subtitles": False,
        "channel": {"name": "", "tagline": "", "font": "quicksand", "fontWeight": 600, "avatar": None},
        "theme": script.get("meta", {}).get("theme") or CFG.get("theme", "classic")}}, ensure_ascii=False))
    prog.update("dub", 0.4, f"Trộn âm thanh {lang} (sfx giữ nguyên chỗ)")
    vw = work / f"{tag}.{lang}.voice.wav"
    run_remotion(props, vw, prog, "dub", f"Âm thanh {lang}", audio_only=True)
    d = probe_duration(vw)
    mpath = ensure_music(music, d, prog)
    gain = mean_volume(vw) - CFG["music_offset_db"] - mean_volume(mpath)
    fc = (f"[1:a]volume={gain:.1f}dB,afade=t=in:d=1,afade=t=out:st={d - 2:.2f}:d=2[m];"
          f"[0:a][m]amix=inputs=2:duration=first:normalize=0,"
          f"loudnorm=I={CFG['target_lufs']}:TP=-1.5:LRA=11,aresample=48000[a]")
    out = work / f"{tag}.{lang}.content.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(vw), "-stream_loop", "-1", "-i", str(mpath),
                    "-filter_complex", fc, "-map", "[a]", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2",
                    "-t", f"{d:.3f}", str(out)], check=True)
    (work / f"{tag}.{lang}.report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1))
    return out, report


def cmd_lint(a):
    """Render the end of every beat in headless Chrome and report text/box overlaps (see scripts/lint_*.py|mjs)."""
    sf = EP.script_file(a.script)
    name = EP.script_name(sf)
    work = ROOT / "out" / "work" / "lint"
    work.mkdir(parents=True, exist_ok=True)
    props = work / f"{name}.props.json"
    subprocess.run([sys.executable, str(ROOT / "scripts" / "lint_props.py"), str(sf.parent if sf.name == "script.json" else sf),
                    str(props), "120"], check=True)
    outd = ROOT / "out" / "review" / name if a.png else work / name
    outd.mkdir(parents=True, exist_ok=True)
    cmd = ["node", str(ROOT / "scripts" / "lint_frames.mjs"), str(props), str(outd)] + (["--png"] if a.png else [])
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("lint thất bại:\n" + (r.stderr or r.stdout)[-1500:])
    rep = subprocess.run([sys.executable, str(ROOT / "scripts" / "lint_report.py"), str(outd / "lint.json"), str(sf)],
                         capture_output=True, text=True)
    print(rep.stdout.rstrip())
    if a.png:
        print(f"Ảnh từng beat: {outd}")


def cmd_brand(a):
    ep_dir = EP.episode_dir(EP.script_file(a.episode)) if getattr(a, "episode", None) else None
    ep_voice = ((EP.load_episode(ep_dir).get("voice_music") or {}).get("voice")) if ep_dir else None
    cfg_voice = a.voice or ep_voice or CFG.get("default_voice") or CFG["voices"][0]
    lang = "vi"
    if ep_dir and (ep_dir / "script.json").exists():
        lang = script_lang(json.loads((ep_dir / "script.json").read_text()))
    fx = CFG.get("voice_fx", {}).get(cfg_voice) if lang == "vi" else None
    theme = a.theme or CFG.get("theme", "classic")
    ch, key, d, ip, op = brand_paths(a, cfg_voice, fx, theme, lang)
    have = ip.exists() and op.exists()
    if a.action == "status":
        print(f"Khóa cache : {key}  (giọng {cfg_voice}, theme {theme})")
        print(f"Trạng thái : {'ĐÃ CÓ' if have else 'CHƯA CÓ (sẽ dựng ở lần render đầu hoặc bằng `brand build`)'}")
        if have:
            print(f"  intro: {ip}  ({probe_duration(ip):.1f}s)")
            print(f"  outro: {op}  ({probe_duration(op):.1f}s)")
        return
    if not str(ch.get("name", "")).strip():
        sys.exit("Chưa đặt tên kênh: sửa config.json → channel.name")
    prog = Progress(f"Dựng intro + outro · {cfg_voice}", [("brand", "Dựng intro & outro", 100)],
                    ROOT / "out" / "work" / "progress.json", serve=False, open_browser=False)
    ip, op, rebuilt = build_brand(a, cfg_voice, fx, theme, force=a.force, prog=prog, lang=lang)
    prog.finish(ip)
    print(("Đã dựng mới" if rebuilt else "Dùng bản đã có") + f": intro {probe_duration(ip):.1f}s, outro {probe_duration(op):.1f}s")
    print(f"  {ROOT / 'assets' / 'brand' / 'intro.mp4'}\n  {ROOT / 'assets' / 'brand' / 'outro.mp4'}")


def cmd_render(a):
    sf = EP.script_file(a.script)
    EP.stage_assets(sf)
    script = resolve_layout(json.loads(sf.read_text()))
    lang = set_lang(script)
    stage_library(script)
    probs = validate(script) + EP.source_problems(sf, script)
    if probs:
        sys.exit("Kịch bản có lỗi:\n" + "\n".join("  - " + p for p in probs))
    if not getattr(a, "no_lint", False) and any(sc_.get("kind") == "diagram" for sc_ in script.get("scenes", [])):
        print("[lint] kiểm tra đè/cắt chữ ở từng beat (bắt buộc trước khi dựng)…", flush=True)
        r_ = subprocess.run([sys.executable, str(Path(__file__).resolve()), "lint", str(sf)], capture_output=True, text=True)
        tail = (r_.stdout or "").strip().splitlines()
        if r_.returncode != 0 or not tail or not tail[-1].startswith("0 vấn đề"):
            sys.exit("Không dựng được: còn lỗi bố cục (chữ đè/cắt/tràn). Sửa rồi chạy lại.\n" + "\n".join(tail[-40:])
                     + f"\nXem ảnh: ./make-video lint {a.script} --png   (bỏ qua có chủ ý: --no-lint)")
        print("[lint] " + tail[-1], flush=True)
    rng = random.Random(a.seed)
    ep_vm = (EP.load_episode(EP.episode_dir(sf)).get("voice_music") or {}) if EP.episode_dir(sf) else {}
    voice = a.voice or ep_vm.get("voice") or CFG.get("default_voice") or rng.choice(CFG["voices"])
    music = a.music or ep_vm.get("music") or rng.choice(CFG["music"])
    name = EP.script_name(sf)
    ed = EP.episode_dir(sf)
    if ed and EP.load_episode(ed).get("status") == "published":
        print("⚠ Tập này đã đăng lên YouTube; render lại sẽ không khớp bản đã đăng.", flush=True)
    mode = a.mode
    if getattr(a, "demo_seconds", None):
        CFG["demo_seconds"] = a.demo_seconds
    theme = a.theme or script.get("meta", {}).get("theme") or CFG.get("theme", "classic")
    if theme not in THEMES:
        sys.exit(f"Theme '{theme}' không có ({', '.join(sorted(THEMES))})")
    tag = (f"{name}{'__demo' if mode == 'demo' else ''}__{slug(voice)}__{music}"
           f"{'' if theme == 'classic' else '__' + theme}{'' if lang == 'vi' else '__' + lang}")
    ch = channel_cfg(a, lang)
    if not str(ch.get("name", "")).strip():
        sys.exit("Chưa đặt tên kênh: sửa config.json → channel.name (hoặc dùng --channel-name \"...\")")
    inline = getattr(a, "inline_brand", False)
    fx = (getattr(a, "fx", None) or CFG.get("voice_fx", {}).get(voice)) if lang == "vi" else None
    meta0 = script.get("meta", {})
    core = pick_demo_scenes(script["scenes"]) if mode == "demo" else script["scenes"]
    dubs = [] if getattr(a, "no_dub", False) else secondary_langs(script)
    for dl in dubs:  # translations must exist for what we render, otherwise the dub would have silent beats
        miss = [f"{sc['id']}#{j}" for sc in core if sc.get("kind") == "diagram"
                for j, b in enumerate(sc["props"]["beats"]) if not b.get(f"text_{dl}")]
        if miss:
            print(f"⚠ Thiếu text_{dl} ở {len(miss)} beat ({', '.join(miss[:6])}{'…' if len(miss) > 6 else ''}): "
                  f"track {dl} sẽ im lặng ở đó", flush=True)
    endcard = {"id": "endcard", "kind": "endcard", "text": "",
               "props": {"name": ch["name"], "question": meta0["question"],
                         "sources": meta0.get("source_line", ""), **ch.get("labels", {})}}
    if inline:  # legacy: intro/outro rendered inside the same timeline
        intro = {"id": "intro", "kind": "intro", "text": ch["intro_line"].format(name=ch["name"]),
                 "props": {"name": ch["name"], "tagline": ch.get("tagline", "")}}
        signoff = {"id": "signoff", "kind": "signoff", "text": ch["outro_line"].format(name=ch["name"]),
                   "props": {"name": ch["name"], **ch.get("labels", {})}}
        scenes_in = [intro] + core + ([] if mode == "demo" else [endcard, signoff])
    else:
        scenes_in = core + ([] if mode == "demo" else [endcard])
    est_total = sum(est_seconds(scene_text(s), _nbeats(s)) for s in scenes_in) + (0 if mode == "demo" else CFG.get("endcard_sec", 5.0))
    print(f"[pick] voice={voice} music={music} mode={mode} scenes={len(scenes_in)} ~{est_total:.0f}s"
          f"{' (intro/outro nội tuyến)' if inline else ' + intro/outro dựng sẵn'}", flush=True)

    need_brand = (not inline) and not all(p.exists() for p in brand_paths(a, voice, fx, theme, lang)[3:5])
    need_long_music = est_total + 5 > probe_duration(ROOT / "assets" / "music" / f"{music}.wav")
    stages = []
    if need_brand:
        stages.append(("brand", "Dựng intro & outro (một lần, có cache)", 14))
    stages += [("tts", "Tạo giọng đọc", 16), ("render", "Dựng hình & hoạt họa", 54)]
    if need_long_music:
        stages.append(("music", "Sinh nhạc nền dài", 10))
    stages.append(("mix", "Trộn nhạc & chuẩn hóa âm lượng", 8))
    if dubs and not inline:
        stages.append(("dub", "Lồng tiếng: " + ", ".join(dubs), 10))
    if not inline:
        stages.append(("join", "Ghép intro + nội dung + outro", 3))
    title = f"{script.get('title', name)} — {'DEMO' if mode == 'demo' else 'Bản chính thức'} · {voice} · {music}"
    prog = Progress(title, stages, ROOT / "out" / "work" / "progress.json",
                    serve=not a.no_web, open_browser=not a.no_open)
    try:
        if not inline:
            intro_p, outro_p, _ = build_brand(a, voice, fx, theme, prog=prog, lang=lang)
        content, tl_scenes = _render(a, script, scenes_in, voice, music, name, tag, prog)
        dub_out = []
        if inline:
            final = content
        else:
            prog.update("join", 0.0, "Ghép intro + nội dung + outro")
            final = ROOT / "out" / f"{tag}.mp4"
            parts = [intro_p, content] + ([] if mode == "demo" else [outro_p])
            how = join_clips(parts, final)
            print(f"[join] {len(parts)} clip, cách ghép: {how}", flush=True)
            for dl in dubs:
                dwav, report = render_dub(a, script, tl_scenes, voice, music, name, tag, dl, prog)
                ch_d = channel_cfg(a, lang)
                key_dir = brand_paths(a, voice, fx, theme, lang)[2]
                di, do = build_brand_dub(a, voice, theme, dl, key_dir, intro_p, outro_p, ch_d, prog=prog)
                dparts = [di, dwav] + ([] if mode == "demo" else [do])
                lst = ROOT / "out" / "work" / f"{tag}.{dl}.txt"
                lst.write_text("".join(f"file '{p}'\n" for p in dparts))
                joined = ROOT / "out" / "work" / f"{tag}.{dl}.joined.wav"
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                                "-c", "copy", str(joined)], check=True)
                m4a = ROOT / "out" / f"{tag}.{dl}.m4a"
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(joined), "-c:a", "aac", "-b:a", "192k",
                                str(m4a)], check=True)
                over = [r for r in report if r["cut_sec"] > 0]
                fast = [r for r in report if r["speedup"] > 1.05]
                print(f"[dub {dl}] {m4a.name}: {len(report)} beat, {len(fast)} phải đọc nhanh hơn, "
                      f"{len(over)} bị cắt đuôi (xem out/work/{tag}.{dl}.report.json)", flush=True)
                for r in over:
                    print(f"   ✗ {r['beat']}: lời {dl} {r['raw']}s > khung {r['slot']}s (cắt {r['cut_sec']}s): rút gọn text_{dl}",
                          flush=True)
                dub_out.append(m4a)
    except Exception as e:  # noqa: BLE001
        prog.fail(f"{type(e).__name__}: {e}")
        raise
    prog.finish(final)
    EP.mark_rendered(sf, voice, music, mode, final)
    if not a.no_open and sys.platform == "darwin":
        subprocess.Popen(["open", str(final)])


def _render(a, script, scenes_in, voice, music, name, tag, prog):
    work = ROOT / "out" / "work"
    work.mkdir(parents=True, exist_ok=True)

    # 1. TTS (primary language of the script; other languages are dubbed after the render, see render_dub)
    lang = script_lang(script)
    prog.update("tts", 0.0, "Nạp model giọng đọc")
    if lang == "vi":
        get_tts(voice)
    rel = f"audio/{name}/{slug(voice)}" + ("" if lang == "vi" else f"_{lang}")
    adir = ROOT / "public" / rel
    adir.mkdir(parents=True, exist_ok=True)
    pron = load_pronunciation(script, lang)
    fx = (getattr(a, "fx", None) or CFG.get("voice_fx", {}).get(voice)) if lang == "vi" else None
    meta = script.get("meta", {})
    fps = CFG["fps"]
    plan, items = [], []
    for i, sc in enumerate(scenes_in):
        if sc["kind"] == "endcard":
            plan.append(("endcard", sc, None))
        elif sc["kind"] == "diagram":
            bl = []
            for j, b in enumerate(sc["props"]["beats"]):
                wav = adir / f"{i:02d}_{sc['id']}_b{j}.wav"
                items.append((b["text"], wav))
                bl.append((b, wav))
            plan.append(("diagram", sc, bl))
        else:
            wav = adir / f"{i:02d}_{sc['id']}.wav"
            items.append((sc["text"], wav))
            plan.append(("plain", sc, wav))
    prog.update("tts", 0.1, f"Giọng đọc ({lang}): {len(items)} đoạn")
    speak_many(items, lang, voice, fx, pron)
    extra = lambda d: {k: v for k, v in d.items() if k.startswith("text_")}  # translations ride along for the dub
    scenes = []
    for i, (kind, sc, ref) in enumerate(plan):
        prog.update("tts", 0.5 + 0.5 * i / len(plan), f"Đo thời lượng: cảnh {i + 1}/{len(plan)}")
        if kind == "endcard":
            scenes.append({"id": sc["id"], "kind": "endcard", "text": "", "props": sc["props"], "audio": None,
                           "durationInFrames": round(CFG.get("endcard_sec", 5.0) * fps)})
        elif kind == "diagram":
            pr = dict(sc.get("props", {}))
            beats, total = [], 0
            for j, (b, wav) in enumerate(ref):
                last = j == len(ref) - 1
                gap = CFG["pad_sec"] if last else CFG.get("beat_gap_sec", 0.25)
                fr = round((probe_duration(wav) + gap) * fps)
                total += fr
                beats.append({"text": b["text"], **extra(b), "do": b.get("do"), "audio": f"{rel}/{wav.name}",
                              "durationInFrames": fr})
            pr["beats"] = beats
            scenes.append({"id": sc["id"], "kind": "diagram", "text": scene_text(sc), "props": pr,
                           "audio": None, "durationInFrames": total})
        else:
            scenes.append({
                "id": sc["id"], "kind": sc["kind"], "text": sc["text"], **extra(sc), "props": sc.get("props", {}),
                "audio": f"{rel}/{ref.name}",
                "durationInFrames": max(round((probe_duration(ref) + CFG["pad_sec"]) * fps),
                                        round(CFG.get("intro_min_sec", 4.0) * fps) if sc["kind"] == "intro"
                                        else round(CFG.get("signoff_min_sec", 4.6) * fps) if sc["kind"] == "signoff" else 0),
            })
    chan = channel_cfg(a, lang)
    avatar_src = ROOT / chan.get("avatar", "assets/brand/avatar.png")
    avatar_rel = None
    if avatar_src.exists():
        (ROOT / "public" / "brand").mkdir(parents=True, exist_ok=True)
        shutil.copy(avatar_src, ROOT / "public" / "brand" / "avatar.png")
        avatar_rel = "brand/avatar.png"
    timeline = {"title": script.get("title", name), "fps": fps, "scenes": scenes,
                "subtitles": meta.get("subtitles", True),
                "channel": {"name": chan.get("name", ""), "tagline": chan.get("tagline", ""),
                            "font": chan.get("font", "quicksand"), "fontWeight": chan.get("font_weight", 600),
                            "avatar": avatar_rel},
                "theme": getattr(a, "theme", None) or meta.get("theme") or CFG.get("theme", "classic")}
    props = work / f"{tag}.props.json"
    props.write_text(json.dumps({"timeline": timeline}, ensure_ascii=False))

    # 2. Render
    prog.update("render", 0.0, "Nạp Remotion / Chromium")
    voice_mp4 = work / f"{tag}.voice.mp4"
    run_remotion(props, voice_mp4, prog, "render", "Dựng hình")

    # 3. Music (extend if needed)
    d = probe_duration(voice_mp4)
    mpath = ensure_music(music, d, prog)

    # 4. Mix + loudness
    prog.update("mix", 0.0, "Trộn nhạc nền và chuẩn hóa âm lượng")
    gain = mean_volume(voice_mp4) - CFG["music_offset_db"] - mean_volume(mpath)
    fc = (f"[1:a]volume={gain:.1f}dB,afade=t=in:d=1,afade=t=out:st={d - 2:.2f}:d=2[m];"
          f"[0:a][m]amix=inputs=2:duration=first:normalize=0,"
          f"loudnorm=I={CFG['target_lufs']}:TP=-1.5:LRA=11,aresample=48000[a]")
    final = (ROOT / "out" / f"{tag}.mp4") if getattr(a, "inline_brand", False) else (work / f"{tag}.content.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(voice_mp4), "-stream_loop", "-1",
                    "-i", str(mpath), "-filter_complex", fc, "-map", "0:v", "-map", "[a]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                    "-t", f"{video_seconds(voice_mp4):.3f}", str(final)],
                   check=True)
    return final, timeline["scenes"]


VOICE_DIR = ROOT / "assets" / "voices"


def custom_voices():
    out = {}
    for j in sorted(VOICE_DIR.glob("*.json")) if VOICE_DIR.exists() else []:
        d = json.loads(j.read_text())
        out[d["name"]] = ROOT / d["wav"]
    return out


def ensure_voice(tts, voice):
    """Register a cloned voice (from assets/voices) with the engine before use."""
    cv = custom_voices()
    if voice in cv:
        tts.add_voice(voice, str(cv[voice]))
        return
    mix = CFG.get("voice_mixes", {}).get(voice)
    if mix:
        # blend speaker embeddings (timbre); codes (reading style / accent) come from one side
        import numpy as np
        ensure_voice(tts, mix["user"])
        pv = tts._preset_voices
        u, p = pv[mix["user"]], pv[mix["preset"]]
        a = float(mix.get("alpha", 0.5))
        eu, ep = np.asarray(u["speaker_emb"]), np.asarray(p["speaker_emb"])
        e = a * eu + (1 - a) * ep
        e = e * ((a * np.linalg.norm(eu) + (1 - a) * np.linalg.norm(ep)) / np.linalg.norm(e))
        v = dict(p if mix.get("codes", "preset") == "preset" else u)
        v["speaker_emb"] = e.astype(eu.dtype)
        v["description"] = f"Mix {a:.0%} {mix['user']} + {1 - a:.0%} {mix['preset']}"
        pv[voice] = v


def _speech_window(src, out, max_sec=8.0):
    """Cut the most speech-dense <=max_sec window of src into out (mono 44.1k wav)."""
    dur = probe_duration(src)
    r = subprocess.run(["ffmpeg", "-i", str(src), "-af", "silencedetect=noise=-35dB:d=0.25", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r)]
    ends = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", r)]
    # speech = complement of silences
    sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
    speech, cur = [], 0.0
    for s0, s1 in sil:
        if s0 - cur > 0.15:
            speech.append((max(0.0, cur), s0))
        cur = max(cur, s1)
    if dur - cur > 0.15:
        speech.append((cur, dur))
    if not speech:
        speech = [(0.0, dur)]
    best, best_cov = (speech[0][0], min(max_sec, dur)), -1.0
    for s0, _ in speech:  # candidate windows start at each speech onset
        a, b = s0, min(dur, s0 + max_sec)
        cov = sum(max(0.0, min(b, e) - max(a, s)) for s, e in speech)
        if cov > best_cov:
            best, best_cov = (a, b), cov
    a, b = best
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.2f}", "-t", f"{b - a:.2f}",
                    "-i", str(src), "-ar", "44100", "-ac", "1", str(out)], check=True)
    return a, b, best_cov


def cmd_voice(a):
    cfg_path = ROOT / "config.json"
    cfg = json.loads(cfg_path.read_text())
    if a.action == "list":
        cv = custom_voices()
        for v in cfg["voices"]:
            print(f"  {v}" + ("   (giọng clone)" if v in cv else ""))
        return
    if a.action == "remove":
        j = VOICE_DIR / f"{slug(a.name)}.json"
        if j.exists():
            d = json.loads(j.read_text())
            (ROOT / d["wav"]).unlink(missing_ok=True)
            j.unlink()
        cfg["voices"] = [v for v in cfg["voices"] if v != a.name]
        cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2))
        print(f"Đã xóa giọng '{a.name}'")
        return
    # add
    src = Path(a.file).expanduser()
    if not src.exists():
        sys.exit(f"Không thấy file: {src}")
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    total = probe_duration(src)
    ref = VOICE_DIR / f"{slug(a.name)}.wav"
    if a.start is not None:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a.start), "-t", "8", "-i", str(src),
                        "-ar", "44100", "-ac", "1", str(ref)], check=True)
        t0, t1 = a.start, min(total, a.start + 8)
    else:
        t0, t1, _ = _speech_window(src, ref)
    got = probe_duration(ref)
    print(f"Nguồn {total:.1f}s → mẫu tham chiếu {got:.1f}s (từ {t0:.1f}s đến {t1:.1f}s)")
    if got < 3:
        print("⚠ Mẫu ngắn hơn 3 giây, chất lượng clone có thể kém. Nên dùng đoạn nói liền mạch 5–8 giây.")
    from vieneu import Vieneu
    tts = Vieneu()
    tts.add_voice(a.name, str(ref))  # denoise + speaker profile (validates the clip)
    (VOICE_DIR / f"{slug(a.name)}.json").write_text(json.dumps(
        {"name": a.name, "wav": str(ref.relative_to(ROOT))}, ensure_ascii=False))
    if a.name not in cfg["voices"]:
        cfg["voices"].append(a.name)
        cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2))
    print(f"Đã đăng ký giọng '{a.name}'. Nghe thử: ./make-video say \"Xin chào, đây là giọng của tôi.\" --voice \"{a.name}\"")


def cmd_say(a):
    text = apply_pronunciation(a.text, load_pronunciation())
    try:
        from sea_g2p import Normalizer
        shown = Normalizer(lang="vi").normalize(text, punc_norm=True)
    except Exception:  # noqa: BLE001
        shown = text
    print(f"Đầu vào   : {a.text}\nSau từ điển: {text}\nBộ đọc nghe: {shown}")
    if a.dry:
        return
    from vieneu import Vieneu
    voice = a.voice or CFG.get("default_voice") or CFG["voices"][0]
    out = Path(a.out) if a.out else ROOT / "out" / "work" / "say.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    tts = Vieneu()
    ensure_voice(tts, voice)
    tts.save(tts.infer(text, voice=voice), str(out))
    apply_voice_fx(out, a.fx or CFG.get("voice_fx", {}).get(voice))
    print(f"Giọng {voice} → {out}")
    if sys.platform == "darwin" and not a.no_play:
        subprocess.run(["afplay", str(out)])


def main():
    argv = sys.argv[1:]
    if argv and argv[0].endswith(".json"):  # backward compatible: ./make-video x.json
        argv = ["render"] + argv
    ap = argparse.ArgumentParser(prog="make-video")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check")
    c.add_argument("script")
    vc = sub.add_parser("voice", help="manage cloned voices")
    vc.add_argument("action", choices=["add", "list", "remove"])
    vc.add_argument("file", nargs="?", help="audio file (for add)")
    vc.add_argument("--name", help="voice name")
    vc.add_argument("--start", type=float, help="start second of the 8s reference window (default: auto)")
    br = sub.add_parser("brand", help="build / inspect the cached intro and outro clips")
    br.add_argument("action", choices=["build", "status"])
    br.add_argument("--force", action="store_true", help="rebuild even if cached")
    br.add_argument("--voice")
    br.add_argument("--episode", help="episode dir: use the voice stored in its episode.json (voice_music.voice)")
    br.add_argument("--theme", choices=sorted(THEMES))
    ln = sub.add_parser("lint", help="measure overlaps / overflow in every beat of a script")
    ln.add_argument("script")
    ln.add_argument("--png", action="store_true", help="also save a PNG of every beat to out/review/<name>/")
    sub.add_parser("catalog", help="rebuild catalog.md")
    sub.add_parser("assets", help="colour icon library: sync | add set/name | search words [--remote] | list",
                   add_help=False)
    pb = sub.add_parser("publish", help="mark an episode as published")
    pb.add_argument("episode")
    pb.add_argument("--url", required=True)
    pb.add_argument("--date", help="YYYY-MM-DD (default: today)")
    sub.add_parser("book", help="ingest a reference book: book ingest <file> --slug S --title T [...]",
                   add_help=False)
    sy = sub.add_parser("say")
    sy.add_argument("text")
    sy.add_argument("--voice", choices=CFG["voices"])
    sy.add_argument("--dry", action="store_true", help="only show normalized text, no audio")
    sy.add_argument("--fx", help="voice effect preset (config.voice_fx_presets) or 'none'")
    sy.add_argument("--out", help="write wav here instead of out/work/say.wav")
    sy.add_argument("--no-play", action="store_true")
    r = sub.add_parser("render")
    r.add_argument("script")
    r.add_argument("--voice", choices=CFG["voices"])
    r.add_argument("--music", choices=CFG["music"])
    r.add_argument("--mode", choices=["demo", "full"], default="full")
    r.add_argument("--seed", type=int)
    r.add_argument("--fx", help="voice effect preset to apply (overrides config.voice_fx)")
    r.add_argument("--channel-name", help="override config.channel.name for this render")
    r.add_argument("--tagline", help="override config.channel.tagline for this render")
    r.add_argument("--inline-brand", action="store_true", help="render intro/outro inside the video (no cached clips)")
    r.add_argument("--theme", choices=sorted(THEMES), help="visual theme (default: meta.theme / config.theme)")
    r.add_argument("--no-lint", action="store_true", help="skip the mandatory layout lint (not recommended)")
    r.add_argument("--demo-seconds", type=int, help="length of --mode demo (default config.demo_seconds)")
    r.add_argument("--no-dub", action="store_true", help="do not make the extra-language audio tracks (meta.audio_langs)")
    r.add_argument("--no-web", action="store_true", help="no progress web page")
    r.add_argument("--no-open", action="store_true", help="do not open browser / final video")
    if argv and argv[0] == "book":  # runs in its own env (needs PyMuPDF); args are parsed by scripts/book.py
        rest = argv[1:]
        if not rest or rest[0] not in ("ingest", "page"):
            sys.exit("Dùng: ./make-video book ingest <file> --slug S --title T [--author A --year Y --license L --page-offset N]\n"
                     "      ./make-video book page <slug> <số trang in> [...] [--zoom 2]   (xuất trang ra PNG)")
        args = rest[1:] if rest[0] == "ingest" else rest
        sys.exit(subprocess.call(["uv", "run", "--no-project", "--with", "pymupdf", "python",
                                  str(ROOT / "scripts" / "book.py"), *args], cwd=ROOT))
    if argv and argv[0] == "youtube":  # Google API client lives in its own throw-away env (uv)
        sys.exit(subprocess.call(["uv", "run", "--no-project", "--with", "google-api-python-client",
                                  "--with", "google-auth-oauthlib", "python", str(ROOT / "scripts" / "youtube.py"), *argv[1:]],
                                 cwd=ROOT))
    if argv and argv[0] == "assets":
        import assets as lib_assets
        return lib_assets.main(argv[1:])
    a = ap.parse_args(argv)
    if a.cmd == "voice" and a.action in ("add", "remove") and not a.name:
        sys.exit("Cần --name \"Tên giọng\"")
    if a.cmd == "voice" and a.action == "add" and not a.file:
        sys.exit("Cần đường dẫn file audio")
    {"check": cmd_check, "render": cmd_render, "say": cmd_say, "voice": cmd_voice, "brand": cmd_brand,
     "lint": cmd_lint, "catalog": EP.cmd_catalog, "publish": EP.cmd_publish}[a.cmd](a)


if __name__ == "__main__":
    main()
