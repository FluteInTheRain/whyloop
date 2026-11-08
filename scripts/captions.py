"""Build SRT caption files for an episode from its script and the timing of the last real render.

  python scripts/captions.py series/<s>/episodes/<ep> [out.srt] [--lang vi|en]
Without --lang a bilingual script (meta.lang = en, beats with text_vi) writes captions.en.srt and captions.vi.srt; an
old Vietnamese-only script writes captions.vi.srt. The picture is the same for every language, so one timing serves all.
Cues follow the beats (speech starts at the beat start; the beat's text is split into sentences/clauses and the beat's
duration is shared by character count). Spelling hacks used for the TTS are reversed ("i dài" -> Y, "pê" -> p).
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAXLINE, MAXCUE = 42, 84


def probe(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).decode())


def display(t):
    t = re.sub(r"(?<![^\W\d_])i dài(?![^\W\d_])", "Y", t)
    t = re.sub(r"(?<![^\W\d_])pê(?![^\W\d_])", "p", t)
    t = re.sub(r"(?<![^\W\d_])ca(?![^\W\d_])", "K", t)   # episode 5: the letter K is spoken "ca" in the dub
    return t.strip()


def pieces(text):
    out = []
    for sent in re.split(r"(?<=[.!?])\s+", text):
        sent = sent.strip()
        while len(sent) > MAXCUE:   # break long sentences at the last comma/colon before MAXCUE, else at a space
            cut = max(sent.rfind(",", 0, MAXCUE), sent.rfind(":", 0, MAXCUE))
            if cut < 20:
                cut = sent.rfind(" ", 0, MAXCUE)
            out.append(sent[:cut + 1].strip())
            sent = sent[cut + 1:].strip()
        if sent:
            out.append(sent)
    merged = []
    for piece in out:   # a cue of only a few words flashes by: glue it to the previous one when it still fits
        if merged and len(piece) < 18 and len(merged[-1]) + 1 + len(piece) <= MAXCUE:
            merged[-1] += " " + piece
        else:
            merged.append(piece)
    return merged


def wrap(t):
    if len(t) <= MAXLINE:
        return t
    mid = len(t) // 2
    cut = min((i for i, c in enumerate(t) if c == " "), key=lambda i: abs(i - mid))
    return t[:cut] + "\n" + t[cut + 1:]


def ts(sec):
    ms = int(round(sec * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def intro_seconds(total, content):
    """Length of the intro clip that was really used: the cached brand clip whose intro + content + outro = the video."""
    best = None
    for m in sorted((ROOT / "assets" / "brand" / "build").glob("*/meta.json")):
        j = json.loads(m.read_text())
        err = abs(j["intro_sec"] + content + j["outro_sec"] - total)
        if best is None or err < best[0]:
            best = (err, j["intro_sec"])
    if best is None or best[0] > 0.3:
        return probe(ROOT / "assets" / "brand" / "intro.mp4")
    return best[1]


def build(ep_dir, lang="vi"):
    ep_dir = Path(ep_dir)
    ep = json.loads((ep_dir / "episode.json").read_text())
    final = ROOT / ep["render"]["file"]
    props = ROOT / "out" / "work" / (final.stem + ".props.json")
    pj = json.loads(props.read_text())
    tl = pj.get("timeline", pj)
    fps = tl.get("fps", 30)
    real = next(s for s in tl["scenes"] if s["kind"] == "diagram")["props"]["beats"]
    sj = json.loads((ep_dir / "script.json").read_text())
    script = sj["scenes"][0]["props"]["beats"]
    assert len(real) == len(script), "script changed since the last render: re-render first"
    primary = sj.get("meta", {}).get("lang", "vi")
    key = "text" if lang == primary else f"text_{lang}"
    assert all(b.get(key) for b in script), f"some beats have no {key}"
    rep_f = props.parent / f"{final.stem}.{lang}.report.json"   # dubbed track: real length of each spoken beat
    spoken_len = [r["final"] for r in json.loads(rep_f.read_text())] if lang != primary and rep_f.exists() else None
    content = sum(s["durationInFrames"] for s in tl["scenes"]) / fps
    t = intro_seconds(probe(final), content)
    cues = []
    for k, (sb, rb) in enumerate(zip(script, real)):
        dur = rb["durationInFrames"] / fps
        speech = max(dur - 0.3, 0.5)
        if spoken_len is not None:
            speech = min(speech, spoken_len[k] + 0.15)
        ps = [display(p) for p in pieces(sb[key])]
        total = sum(len(p) for p in ps) or 1
        c = t
        for p in ps:
            d = speech * len(p) / total
            cues.append((c, c + d - 0.05, wrap(p)))
            c += d
        t += dur
    return cues


def write(ep_dir, lang, out=None):
    out = Path(out) if out else Path(ep_dir) / f"captions.{lang}.srt"
    cues = build(ep_dir, lang)
    out.write_text("\n".join(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n" for i, (a, b, txt) in enumerate(cues, 1)))
    print(f"{out}: {len(cues)} cue, tổng {ts(cues[-1][1])}")


def main():
    args = sys.argv[1:]
    lang = None
    if "--lang" in args:
        i = args.index("--lang")
        lang = args[i + 1]
        del args[i:i + 2]
    ep_dir = args[0]
    out = args[1] if len(args) > 1 else None
    if lang:
        return write(ep_dir, lang, out)
    sj = json.loads((Path(ep_dir) / "script.json").read_text())
    primary = sj.get("meta", {}).get("lang", "vi")
    for lg in dict.fromkeys([primary] + sj.get("meta", {}).get("audio_langs", [])):
        write(ep_dir, lg)


if __name__ == "__main__":
    main()
