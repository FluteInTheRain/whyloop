#!/usr/bin/env python3
"""Writes docs/demo/script.json: the short English episode used for the README demo GIF.

Every number on screen and in the narration is computed here from one simulated data set (fixed seed),
the same way real episodes are made. Run:  python3 docs/demo/gen_demo.py

docs/img/demo.gif = beats 1-5 of this script, 54 frames per beat, no audio:
  python3 scripts/lint_props.py docs/demo/script.json out/work/demo.props.json 54   # then keep the first 5 beats
  npx remotion render src/index.ts Main out/demo.gif --props=out/work/demo.props.json --codec=gif --every-nth-frame=2 --scale=0.5
  (then ffmpeg palettegen/paletteuse at 880 px wide to shrink it)
docs/img/themes.jpg = the end of beat 4 rendered with `remotion still` in six themes.
"""
import json, random
from pathlib import Path

rng = random.Random(7)
xs = [round(1 + 8 * i / 11, 2) for i in range(12)]                       # hours of practice
ys = [round(32 + 6.5 * x + rng.gauss(0, 9), 1) for x in xs]              # test score

n = len(xs)
mx, my = sum(xs) / n, sum(ys) / n
b1 = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
b0 = my - b1 * mx
pred = [b0 + b1 * x for x in xs]
rss = sum((y - p) ** 2 for y, p in zip(ys, pred))
rows = [0, 5, 11]                                                         # three students for the table

script = {
    "title": "WhyLoop demo: the best straight line",
    "meta": {"topic": "Least squares in one minute", "target_seconds": 30, "subtitles": False, "lang": "en",
             "audio_langs": ["en"], "question": "Would a curve beat this line?"},
    "scenes": [{"id": "story", "kind": "diagram", "visual_note": "README demo: plot, equation, residuals, stat, table",
        "props": {
            "nodes": [
                {"id": "bit", "type": "mascot", "x": 150, "y": 985, "size": 150, "expr": "idle", "look": "right"},
                {"id": "pl", "type": "plot", "col": 5.2, "row": 2.7, "w": 940, "h": 620, "xrange": [0, 10],
                 "yrange": [20, 100], "xlabel": "Hours of practice", "ylabel": "Test score", "step": 1,
                 "series": [
                     {"type": "points", "data": [[x, y] for x, y in zip(xs, ys)], "label": "Students", "color": "primary"},
                     {"type": "fn", "fn": f"{b0:.3f}+{b1:.3f}*x", "label": "Best line", "color": "green"},
                     {"type": "segments", "data": [[x, y, x, round(p, 2)] for x, y, p in zip(xs, ys, pred)],
                      "label": "Errors", "color": "red", "width": 5}]},
                {"id": "eq", "type": "equation", "tex": f"\\hat{{y}} = {b0:.1f} + {b1:.2f}\\,x", "col": 2, "row": 1.5,
                 "size": 60, "color": "accent"},
                {"id": "rss", "type": "stat", "value": round(rss), "label": "sum of squared errors (RSS)",
                 "col": 2, "row": 2.9, "color": "red", "size": 96},
                {"id": "tb", "type": "table", "col": 2, "row": 2.4, "colws": [170, 170, 210], "fs": 40, "rowh": 72,
                 "rows": [["Hours", "Score", "Line says"]] + [[f"{xs[i]:.1f}", f"{ys[i]:.0f}", f"{pred[i]:.0f}"] for i in rows],
                 "step": 0, "hi": [2]},
                {"id": "sum_t", "type": "text", "label": "One line, one number to beat", "col": 4, "row": 2.5, "size": 60,
                 "color": "accent"},
                {"id": "qn_t", "type": "text", "label": "Would a curve beat this line?", "col": 4, "row": 2.5, "size": 60,
                 "color": "purple"}],
            "edges": [],
            "beats": [
                {"text": f"Here are {n} students: hours of practice against their test score.",
                 "do": {"show": ["bit", "pl"]}},
                {"text": f"The best straight line: about {b1:.1f} extra points for every hour.",
                 "do": {"show": ["eq"], "set": {"pl": {"step": 2}, "bit": {"expr": "wow", "label": "A trend!"}},
                        "highlight": ["eq"]}},
                {"text": "Each student sits a little above or below it. Those gaps are the errors.",
                 "do": {"set": {"pl": {"step": 3}, "bit": {"expr": "think", "label": "How far?"}}, "highlight": []}},
                {"text": f"Square them and add them up: {round(rss)}. No other line gets lower.",
                 "do": {"show": ["rss"], "highlight": ["rss"], "set": {"bit": {"expr": "aha", "label": "Lowest!"}}}},
                {"text": "Check three students: the line lands close to every one of them.",
                 "do": {"hide": ["eq", "rss"], "show": ["tb"], "set": {"tb": {"step": 3}, "bit": {"expr": "happy",
                        "label": "Close!"}}}},
                {"text": "So the best line is the one with the smallest sum of squared errors.", "role": "summary",
                 "do": {"clear": True, "show": ["sum_t"], "set": {"bit": {"expr": "happy", "label": "Recap"}}}},
                {"text": "Would a curve beat this line on new students?", "role": "question",
                 "do": {"hide": ["sum_t"], "show": ["qn_t"], "set": {"bit": {"expr": "think", "label": "Hmm?"}}}}]}}],
}
out = Path(__file__).resolve().parent / "script.json"
out.write_text(json.dumps(script, ensure_ascii=False, indent=1) + "\n")
print(f"slope {b1:.2f}, intercept {b0:.1f}, RSS {rss:.0f} -> {out}")
