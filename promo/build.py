#!/usr/bin/env python3
"""Builds everything the Promo composition needs, then (optionally) renders it. Run from the repo root:

  python3 promo/build.py            voice-over (Kokoro), assets into public/promo/, promo/timeline.json
  python3 promo/build.py --render   ... and render out/promo.mp4 (1920x1080) with the music mixed and loudness-normalised

The promo is a ~90 s introduction to the project, made with the project itself: Remotion composition src/Promo.tsx, the Kokoro
voice and ACE-Step music used by the episodes. Real frames and thumbnails are copied from the episodes (not committed:
public/promo/ is ignored).
"""
import json, shutil, subprocess, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public" / "promo"
FPS = 30
LEAD, TAIL, MIN_SCENE = 12, 24, 150          # frames of silence before the voice, after it, and the shortest scene
SCRIPT = json.loads((ROOT / "promo" / "script.json").read_text())


def wav_seconds(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def split_sentences(text):
    out, cur = [], ""
    for ch in text:
        cur += ch
        if ch in ".?!" and len(cur.strip()) > 3:
            out.append(cur.strip()); cur = ""
    if cur.strip():
        out.append(cur.strip())
    return out


def voice():
    (PUB / "vo").mkdir(parents=True, exist_ok=True)
    jobs = [{"text": s["vo"], "voice": SCRIPT["voice"], "speed": SCRIPT["speed"], "out": str(PUB / "vo" / f"{s['id']}.wav")}
            for s in SCRIPT["scenes"] if not (PUB / "vo" / f"{s['id']}.wav").exists()]
    if jobs:
        jf = PUB / "jobs.json"; jf.write_text(json.dumps(jobs))
        py = ROOT / "tools" / "kokoro" / ".venv" / "bin" / "python"
        subprocess.run([str(py), str(ROOT / "scripts" / "kokoro_tts.py"), str(jf)], check=True)


def assets():
    (PUB / "thumbs").mkdir(parents=True, exist_ok=True)
    (PUB / "icons").mkdir(parents=True, exist_ok=True)
    for i, d in enumerate(sorted((ROOT / "series" / "machine-learning" / "episodes").glob("*/thumbnail.jpg"))[:14], 1):  # the 14 public episodes
        shutil.copy(d, PUB / "thumbs" / f"{i:02d}.jpg")
    for n in ("frame-plot.png", "frame-table.png", "pipeline.svg"):
        shutil.copy(ROOT / "docs" / "img" / n, PUB / n)
    shutil.copy(ROOT / "assets" / "brand" / "avatar.png", PUB / "avatar.png")
    shutil.copy(ROOT / "assets" / "music" / "lofi_chill_80s.wav", PUB / "music.wav")
    lib = ROOT / "assets" / "library"
    for p in ("fluent-emoji-flat/books", "fluent-emoji-flat/memo", "fluent-emoji-flat/speech-balloon", "fluent-emoji-flat/globe-with-meridians",
              "fluent-emoji-flat/magnifying-glass-tilted-left", "fluent-emoji-flat/rocket", "fluent-emoji-flat/chart-increasing",
              "fluent-emoji-flat/control-knobs", "fluent-emoji-flat/package", "fluent-emoji-flat/light-bulb",
              "fluent-emoji-flat/check-mark-button", "fluent-emoji-flat/hourglass-not-done", "flat-color-icons/film-reel"):
        shutil.copy(lib / f"{p}.svg", PUB / "icons" / (p.split("/")[1] + ".svg"))


def timeline():
    scenes = []
    for s in SCRIPT["scenes"]:
        secs = wav_seconds(PUB / "vo" / f"{s['id']}.wav")
        vo_f = round(secs * FPS)
        dur = max(MIN_SCENE, round(s.get("minSec", 0) * FPS), LEAD + vo_f + TAIL)
        sents = split_sentences(s["vo"]); total = sum(len(x) for x in sents)
        t, parts = LEAD, []
        for x in sents:
            n = round(vo_f * len(x) / total)
            parts.append({"text": x, "from": t, "to": t + n}); t += n
        scenes.append({"id": s["id"], "vo": f"promo/vo/{s['id']}.wav", "voFrames": vo_f, "lead": LEAD,
                       "durationInFrames": dur, "sentences": parts})
    tl = {"fps": FPS, "theme": "spectrum", "scenes": scenes}
    (ROOT / "promo" / "timeline.json").write_text(json.dumps(tl, indent=1))
    tot = sum(x["durationInFrames"] for x in scenes) / FPS
    print(f"timeline: {len(scenes)} scenes, {tot:.1f} s -> promo/timeline.json")


def render():
    out = ROOT / "out"; out.mkdir(exist_ok=True)
    raw, final = out / "work" / "promo.raw.mp4", out / "promo.mp4"
    raw.parent.mkdir(exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "Promo", str(raw), "--props", "promo/timeline.json",
                    "--concurrency", "10", "--gl", "angle"], cwd=ROOT, check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-c:v", "copy", "-af",
                    "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(final)], check=True)
    print("wrote", final)


if __name__ == "__main__":
    voice(); assets(); timeline()
    if "--render" in sys.argv:
        render()
