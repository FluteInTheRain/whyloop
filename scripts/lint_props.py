"""Build the props file used by lint_frames.mjs for an episode script (every beat gets a fixed length)."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_video as M
import episodes as EP

def main(episode, out, frames=120):
    sf = EP.script_file(episode)
    EP.stage_assets(sf)
    sc = M.resolve_layout(json.loads(sf.read_text()))
    M.stage_library(sc)
    d = next(s for s in sc["scenes"] if s["kind"] == "diagram")
    pr = d["props"]
    beats = [{**b, "audio": "sfx/ding.wav", "durationInFrames": frames} for b in pr["beats"]]
    ch = M.channel_cfg()
    theme = sc.get("meta", {}).get("theme") or M.CFG.get("theme", "classic")
    tl = {"title": "lint", "fps": 30, "subtitles": False, "theme": theme,
          "channel": {"name": ch.get("name", ""), "tagline": ch.get("tagline", ""), "font": ch.get("font", "quicksand"),
                      "fontWeight": ch.get("font_weight", 600)},
          "scenes": [{"id": "s", "kind": "diagram", "text": "", "props": {**pr, "beats": beats,
          "subtitles": False}, "audio": None, "durationInFrames": frames * len(beats)}]}
    Path(out).write_text(json.dumps({"timeline": tl}, ensure_ascii=False))
    print(f"{len(beats)} beats -> {out}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 120)
