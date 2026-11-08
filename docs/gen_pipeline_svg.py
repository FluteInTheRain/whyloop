"""Draws docs/img/pipeline.svg (the README pipeline figure). Run:  python3 docs/gen_pipeline_svg.py

Reads the colour icons from assets/library/ and inlines them, so the SVG is self-contained (GitHub shows it as an <img>,
which cannot inherit page colours: the figure carries its own dark panel and reads on light and dark themes).
Claim of the figure: one script feeds both the picture and the sound; the lint gate stops a bad layout before the render.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "assets" / "library"
OUT = ROOT / "docs" / "img" / "pipeline.svg"

BG, PANEL, TEXT, MUTED = "#12161e", "#1b2130", "#eef2f8", "#9aa7b8"
CYAN, PURPLE, YELLOW, GREEN, RED = "#22d3ee", "#a78bfa", "#fcd34d", "#4ade80", "#f87171"
W, H = 1200, 452
BW, BH, GAP, X0 = 168, 126, 80, 20
COL = [X0 + i * (BW + GAP) for i in range(5)]
ROW_A, ROW_B = 62, 292


def icon(path, x, y, size=38):
    svg = (LIB / path).read_text()
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    return f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="{vb}">{inner}</svg>'


def box(col, row, ic, title, lines, color, badge=None):
    x, y = COL[col], row
    out = [f'<rect x="{x}" y="{y}" width="{BW}" height="{BH}" rx="14" fill="{PANEL}" stroke="{color}" stroke-width="2"/>',
           icon(ic, x + 14, y + 12),
           f'<text x="{x + 14}" y="{y + 70}" font-size="16" font-weight="700" fill="{TEXT}">{title}</text>']
    for i, ln in enumerate(lines):
        out.append(f'<text x="{x + 14}" y="{y + 89 + i * 15}" font-size="11.5" fill="{MUTED}">{ln}</text>')
    if badge:
        out.append(f'<rect x="{x + BW - 46}" y="{y + 14}" width="32" height="20" rx="10" fill="{color}"/>'
                   f'<text x="{x + BW - 30}" y="{y + 28}" font-size="12" font-weight="700" fill="{BG}" text-anchor="middle">{badge}</text>')
    return "\n".join(out)


def line(d, color=MUTED, marker="a", dash=False):
    da = ' stroke-dasharray="6 5"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2"{da} marker-end="url(#{marker})"/>'


def label(x, y, s, color=MUTED, anchor="middle"):
    return f'<text x="{x}" y="{y}" font-size="11" fill="{color}" text-anchor="{anchor}">{s}</text>'


cx = lambda c: COL[c] + BW // 2
mid_a, mid_b = ROW_A + BH // 2, ROW_B + BH // 2

parts = [
    f'<rect width="{W}" height="{H}" rx="18" fill="{BG}"/>',
    label(X0, 24, "PICTURE", MUTED, "start").replace('font-size="11"', 'font-size="11" font-weight="700" letter-spacing="2"'),
    label(W - X0, 282, "SOUND AND DELIVERY", MUTED, "end").replace('font-size="11"', 'font-size="11" font-weight="700" letter-spacing="2"'),
    # row A
    box(0, ROW_A, "fluent-emoji-flat/books.svg", "Textbook chapter", ["re-explained, new data,", "pages cited"], MUTED),
    box(1, ROW_A, "fluent-emoji-flat/chart-increasing.svg", "gen_script.py", ["simulate data, fit the", "models from scratch"], CYAN),
    box(2, ROW_A, "fluent-emoji-flat/memo.svg", "script.json", ["EN + VI text per beat;", "numbers computed once"], PURPLE),
    box(3, ROW_A, "fluent-emoji-flat/magnifying-glass-tilted-left.svg", "Layout lint", ["Chrome measures real", "text boxes. No pass,", "no render"], YELLOW),
    box(4, ROW_A, "flat-color-icons/film-reel.svg", "Remotion render", ["React to frames,", "2560x1440, 30 fps"], GREEN),
    line(f"M{COL[0] + BW} {mid_a} H{COL[1] - 4}"), label(COL[0] + BW + GAP // 2, mid_a - 8, "chapter"),
    line(f"M{COL[1] + BW} {mid_a} H{COL[2] - 4}"), label(COL[1] + BW + GAP // 2, mid_a - 8, "numbers"),
    line(f"M{COL[2] + BW} {mid_a} H{COL[3] - 4}"), label(COL[2] + BW + GAP // 2, mid_a - 8, "beats"),
    line(f"M{COL[3] + BW} {mid_a} H{COL[4] - 4}", GREEN, "g"), label(COL[3] + BW + GAP // 2, mid_a - 8, "0 issues", GREEN),
    # lint failure loops back to the generator (the rule that refuses a bad render)
    line(f"M{cx(3)} {ROW_A} V40 H{cx(1)} V{ROW_A - 4}", RED, "r", dash=True),
    label((cx(1) + cx(3)) // 2, 34, "problems found: fix the script, run again", RED),
    # row B
    box(0, ROW_B, "fluent-emoji-flat/speech-balloon.svg", "Kokoro TTS", ["English narration", "(the main audio)"], CYAN, "EN"),
    box(1, ROW_B, "fluent-emoji-flat/speech-balloon.svg", "VieNeu TTS", ["Vietnamese dub fitted", "into each beat's slot"], CYAN, "VI"),
    box(2, ROW_B, "fluent-emoji-flat/control-knobs.svg", "ffmpeg mix", ["voice + ACE-Step music", "+ sfx, -16 LUFS"], PURPLE),
    box(3, ROW_B, "fluent-emoji-flat/package.svg", "Two outputs", ["EN mp4 + VI m4a,", "same length"], GREEN),
    box(4, ROW_B, "fluent-emoji-flat/rocket.svg", "YouTube", ["captions, description,", "thumbnail via Data API", "(private first)"], YELLOW),
    # script.json feeds both voices; Remotion feeds the mix
    line(f"M{cx(2)} {ROW_A + BH} V214 H{cx(1)} V{ROW_B - 4}"),
    f'<path d="M{cx(1)} 214 H{cx(0)} V{ROW_B - 4}" fill="none" stroke="{MUTED}" stroke-width="2" marker-end="url(#a)"/>',
    label(cx(2) - 12, 208, "text, text_vi", MUTED, "end"),
    line(f"M{cx(4)} {ROW_A + BH} V248 H{cx(2) + 40} V{ROW_B - 4}", GREEN, "g"),
    label(cx(4) - 12, 242, "frames", GREEN, "end"),
    # voices to the mix
    line(f"M{COL[1] + BW} {mid_b} H{COL[2] - 4}"), label(COL[1] + BW + GAP // 2, mid_b - 8, "VI voice"),
    line(f"M{cx(0)} {ROW_B + BH} V{ROW_B + BH + 24} H{cx(2) - 40} V{ROW_B + BH + 4}"),
    label(cx(1), ROW_B + BH + 19, "EN voice"),
    line(f"M{COL[2] + BW} {mid_b} H{COL[3] - 4}"), label(COL[2] + BW + GAP // 2, mid_b - 8, "mix"),
    line(f"M{COL[3] + BW} {mid_b} H{COL[4] - 4}"), label(COL[3] + BW + GAP // 2, mid_b - 8, "publish"),
]

defs = "".join(
    f'<marker id="{i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">'
    f'<polygon points="0,0 10,5 0,10" fill="{c}"/></marker>'
    for i, c in (("a", MUTED), ("g", GREEN), ("r", RED))
)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
       f'aria-label="One script feeds both the picture and the sound; the layout lint blocks a bad render before it starts" '
       f'font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif"><defs>{defs}</defs>\n'
       + "\n".join(parts) + "\n</svg>\n")
OUT.write_text(svg)
print("wrote", OUT, len(svg) // 1024, "KB")
