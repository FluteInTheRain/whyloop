"""Episode / series bookkeeping: locate scripts, stage assets, catalog, publish."""
import json, shutil, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERIES = ROOT / "series"
STATUSES = ["planned", "draft", "scripted", "rendered", "published"]


def script_file(arg):
    """Accept an episode directory or a script json; return the script path."""
    p = Path(arg)
    return p / "script.json" if p.is_dir() else p


def episode_dir(script_path):
    d = Path(script_path).parent
    return d if Path(script_path).name == "script.json" and (d / "episode.json").exists() else None


def script_name(script_path):
    """Name used in output filenames: the episode slug, or the file stem for loose scripts."""
    d = episode_dir(script_path)
    return d.name if d else Path(script_path).stem


def load_episode(d):
    return json.loads((Path(d) / "episode.json").read_text())


def save_episode(d, ep):
    (Path(d) / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=2) + "\n")


def stage_assets(script_path):
    """Copy <episode>/assets/* into public/images so `image` scenes resolve."""
    d = episode_dir(script_path)
    if not d or not (d / "assets").is_dir():
        return
    dst = ROOT / "public" / "images"
    dst.mkdir(parents=True, exist_ok=True)
    for f in (d / "assets").iterdir():
        if f.is_file() and not f.name.startswith("."):
            shutil.copy(f, dst / f.name)


def source_problems(script_path, script):
    """Episodes built from a book must credit it on screen (meta.source_line)."""
    d = episode_dir(script_path)
    if not d:
        return []
    ep = load_episode(d)
    if ep.get("book") and not str(script.get("meta", {}).get("source_line", "")).strip():
        return ["Video dựa trên sách nhưng thiếu meta.source_line (dòng ghi nguồn hiện ở màn hình kết)"]
    return []


def all_episodes():
    out = []
    for f in sorted(SERIES.glob("*/episodes/*/episode.json")):
        out.append((f.parent, json.loads(f.read_text())))
    out.sort(key=lambda t: (t[1].get("series", ""), t[1].get("number") is None, t[1].get("number") or 0, t[1]["slug"]))
    return out


def mark_rendered(script_path, voice, music, mode, final):
    d = episode_dir(script_path)
    if not d:
        return
    ep = load_episode(d)
    if mode != "full" and (ep.get("render") or {}).get("mode") == "full":
        return  # a demo must not replace the record of the full render (youtube/captions read render.file)
    ep["render"] = {"voice": voice, "music": music, "mode": mode, "file": str(Path(final).relative_to(ROOT)),
                    "rendered_at": date.today().isoformat()}
    if mode == "full" and ep.get("status") in ("planned", "draft", "scripted", None):
        ep["status"] = "rendered"
    save_episode(d, ep)


def cmd_catalog(_a=None):
    eps = all_episodes()
    lines = ["# Danh mục nội dung", "", "_Tạo tự động bởi `./make-video catalog`. Đừng sửa tay._", ""]
    cur = None
    for d, ep in eps:
        if ep.get("series") != cur:
            cur = ep.get("series")
            sj = SERIES / cur / "series.json"
            title = json.loads(sj.read_text()).get("title", cur) if sj.exists() else cur
            lines += ["", f"## {title} (`{cur}`)", "", "| # | Tập | Trạng thái | Sách (chương / trang) | Ngày đăng | YouTube |",
                      "|---|---|---|---|---|---|"]
        b = ep.get("book") or {}
        ref = ", ".join(x for x in [b.get("chapter"), b.get("pages") and f"tr. {b['pages']}"] if x) or "—"
        yt = ep.get("youtube", {})
        link = f"[xem]({yt['url']})" if yt.get("url") else "—"
        lines.append(f"| {ep.get('number') or '—'} | {ep.get('title', ep['slug'])} (`{d.relative_to(ROOT)}`) | "
                     f"{ep.get('status', '?')} | {ref} | {yt.get('published_at') or '—'} | {link} |")
    (ROOT / "catalog.md").write_text("\n".join(lines) + "\n")
    print(f"catalog.md: {len(eps)} tập")


def cmd_publish(a):
    d = episode_dir(script_file(a.episode))
    if not d:
        sys.exit(f"Không phải thư mục tập (thiếu episode.json): {a.episode}")
    ep = load_episode(d)
    ep["status"] = "published"
    ep["youtube"] = {"url": a.url, "published_at": a.date or date.today().isoformat()}
    save_episode(d, ep)
    print(f"{ep['slug']}: published {ep['youtube']['published_at']} {a.url}")
    cmd_catalog()
