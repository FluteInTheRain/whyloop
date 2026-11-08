"""Turn lint.json (from lint_frames.mjs) into a list of layout problems per beat."""
import json, sys
from pathlib import Path

W, H = 1920, 1080
TOL = 3

def inter(a, b):
    x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    return (x0, y0, x1, y1) if x1 - x0 > TOL and y1 - y0 > TOL else None

def contained(inner, outer, tol=6):
    return inner[0] >= outer[0] - tol and inner[1] >= outer[1] - tol and inner[2] <= outer[2] + tol and inner[3] <= outer[3] + tol

def analyse(lint, script_beats):
    problems = {}
    cam_zoom = 1.0
    for rec in lint:
        k = rec["beat"]
        cam = (script_beats[k - 1].get("do") or {}).get("camera")
        if cam is not None:
            cam_zoom = cam.get("zoom", 1.5 if cam.get("focus") else 1.0)
        out = []
        nodes = rec["nodes"] or []
        groups = []
        items = []   # (node id, kind, rect, what)
        for n in nodes:
            rs = [r for r in n["rects"]]
            if not rs:
                continue
            if n["type"] == "group":
                big = max(rs, key=lambda r: (r[2] - r[0]) * (r[3] - r[1]))
                groups.append((n["id"], big[:4]))
                continue
            for r in rs:
                items.append((n["id"], n["type"], r[:4], str(r[4])))
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                if a[0] == b[0]:
                    continue
                x = inter(a[2], b[2])
                if x:
                    if a[3] == "b" and b[3] == "b":
                        continue   # two backgrounds touching is only a problem when text is involved
                    out.append(("overlap", f"'{a[0]}' ({a[3][:26]}) đè '{b[0]}' ({b[3][:26]})", x))
        # text that overlaps other text inside the same block (e.g. table cells that are too narrow)
        by_node = {}
        for nid, kind, r, what in items:
            if what.startswith("t:") and kind != "equation":   # KaTeX stacks accents/indices on purpose
                by_node.setdefault(nid, []).append((r, what))
        for nid, lst in by_node.items():
            for i in range(len(lst)):
                for j in range(i + 1, len(lst)):
                    x = inter(lst[i][0], lst[j][0])
                    if x:
                        out.append(("chữ", f"'{nid}': \"{lst[i][1][2:22]}\" đè \"{lst[j][1][2:22]}\" trong cùng khối", x))
        for gid, g in groups:
            for nid, kind, r, what in items:
                if inter(r, g) and not contained(r, g):
                    out.append(("khung", f"'{nid}' ({what[:26]}) cắt qua đường viền khung '{gid}'", inter(r, g)))
        if cam_zoom <= 1.001:
            for nid, kind, r, what in items:
                if r[0] < -2 or r[1] < -2 or r[2] > W + 2 or r[3] > H + 2:
                    out.append(("tràn", f"'{nid}' ({what[:26]}) tràn ra ngoài khung hình {r}", r))
                elif r[2] > 1700 and r[3] < 112 and what != "b":
                    out.append(("góc", f"'{nid}' ({what[:26]}) nằm ở góc phải trên dành cho logo", r))
        # de-duplicate
        seen, uniq = set(), []
        for t in out:
            key = (t[0], t[1])
            if key not in seen:
                seen.add(key); uniq.append(t)
        if uniq:
            problems[k] = uniq
    return problems

if __name__ == "__main__":
    lint = json.loads(Path(sys.argv[1]).read_text())
    sb = json.loads(Path(sys.argv[2]).read_text())["scenes"][0]["props"]["beats"]
    pr = analyse(lint, sb)
    tot = 0
    for k, lst in sorted(pr.items()):
        for kind, msg, _ in lst:
            tot += 1
            print(f"beat {k:>3} [{kind}] {msg}")
    print(f"\n{tot} vấn đề ở {len(pr)}/{len(lint)} beat")
