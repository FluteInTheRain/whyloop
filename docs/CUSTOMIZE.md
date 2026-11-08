# Make it yours: customise WhyLoop

This guide is for someone who cloned the repo and wants to make **their own** videos: other topics, another look, another
voice, or a setup that does not need a powerful Mac. It assumes you did the install in the [README](../README.md#install).
The Vietnamese operating manual with every command is [USAGE.md](USAGE.md).

Everything below was run on macOS (Apple Silicon). Where I describe Linux or cloud machines I say so: those parts are
**untested by me** and follow the documentation of the tools involved.

## 0. What you can change, and where

| I want to change... | Edit | Command / flag |
|---|---|---|
| The topic and the words | `script.json` of your episode | `check`, `lint`, `render` |
| The colours and style | `config.json → theme`, or `src/theme.ts` | `--theme dusk` |
| Channel name, tagline, font, avatar | `config.json → channel`, `assets/brand/avatar.png` | `--channel-name`, `--tagline`, `brand build --force` |
| Narration voice | `config.json → voices`, `languages` | `--voice`, `say` |
| Music | `assets/music/*.wav`, `config.json → music` | `--music` |
| Resolution and speed | `config.json → render` | `WHYLOOP_RENDER_SCALE`, `WHYLOOP_RENDER_CONCURRENCY` |
| Pronunciation | `pronunciation.json` (Vietnamese), `pronunciation.en.json` (English) | `check` warns about odd words |
| Languages | `meta.lang`, `meta.audio_langs`, `text` / `text_vi` per beat | `--no-dub` |

## 1. Run the included example (5 minutes)

`examples/hello-whyloop/script.json` is a 25-second bilingual episode (English picture, English and Vietnamese audio).
It exists so that you can see the whole chain work before you write anything.

```bash
./make-video check examples/hello-whyloop                 # errors (✗), layout and pronunciation warnings, length estimate
./make-video lint  examples/hello-whyloop --png           # must print "0 vấn đề" (= 0 problems); images in out/review/
./make-video render examples/hello-whyloop --mode demo \
   --voice "Hải Đăng" --music lofi_chill --no-dub          # ~30 s preview, English voice only
```

Notes that save you an hour:

- `--voice "Hải Đăng"` is a built-in preset (English picture: it maps to the Kokoro voice `am_michael`; see
  `config.json → languages.en.voices`). The default voice `Khang Mix` is the author's own cloned voice and does not exist on your machine.
- `lofi_chill` must exist as `assets/music/lofi_chill.wav`. Either generate it (README step 3) or use **your own track**:
  copy any WAV to `assets/music/mytrack.wav`, add `"mytrack"` to `config.json → music`, and pass `--music mytrack`
  (a track that has no entry in `music_captions` is used as it is and looped when the video is longer).
- The result is written to `out/`. The file is named after the script, so move or rename your own episodes into their own folder.
- Drop `--mode demo` for the full render. `render` re-runs the lint first and refuses to start while problems remain.

## 2. Change the content

### The script

An episode is one JSON file. The shape (see `examples/hello-whyloop/script.json` for a complete one):

```json
{
  "title": "How a web request travels",
  "meta": { "lang": "en", "audio_langs": ["en", "vi"], "target_seconds": 25,
            "question": "What if one server went down?" },
  "scenes": [{ "id": "story", "kind": "diagram", "props": {
      "nodes": [ { "id": "n1", "type": "icon", "icon": "user", "label": "You", "col": 1.5, "row": 2.5 } ],
      "edges": [ { "id": "a", "from": "n1", "to": "n2" } ],
      "beats": [ { "text": "Say this in English.", "text_vi": "Câu này bằng tiếng Việt.",
                   "do": { "show": ["n1", "n2", "a"], "flow": ["a"], "highlight": ["n2"] } } ] } }]
}
```

- A **beat** is one sentence of narration plus what changes on screen (`do`): `show`, `hide`, `clear`, `flow` (a packet runs
  along an edge), `highlight`, `set` (change a node, for example the mascot's expression). Every beat should change something.
- Nodes sit on a grid: `col` 1-7, `row` 1-5. Colours are **roles**, not hex codes: `primary` data, `green` good, `red` error,
  `accent` the key number, `purple` formula or model. This keeps every theme readable.
- Beats with `"role": "summary"` and `"role": "question"` produce the recap and the closing question card.
- Node types and every option: `.claude/skills/make-video/scene-kinds.md`. Pacing and layout recipes (how dense a
  scene should be, how to avoid overlaps): `.claude/skills/make-video/recipes.md`.
- `templates/` has starting points (`pipeline`, `before-after`, `compare-two`, `math-plot`...). Their text is Vietnamese:
  copy one and replace the words.
- Icons: `./make-video assets search <word>` searches the bundled library (about 730 colour icons, licences in
  `assets/library/ATTRIBUTION.md`).

### Languages

- Picture language is `meta.lang`. `text` is both the on-screen text and the main audio.
- `meta.audio_langs: ["en", "vi"]` adds a second audio track that is fitted into each beat's time slot
  (needs `text_vi` per beat; it uses VieNeu-TTS). Use `["en"]`, or pass `--no-dub`, for a single language.
- After a render with a dub, read `out/work/<name>.vi.report.json`. A line that did not fit is reported as cut at the end;
  shorten `text_vi` and render again.

### Numbers that cannot disagree with the narration

For anything with data, do not type numbers. Write a small `gen_script.py` next to the script: it simulates data, fits the
model, and writes `script.json` with the computed values inside both the on-screen props and the sentences. That is how
the episodes on the channel are made, and it is the main idea of the project. Re-run the generator instead of editing the JSON.

### Let an AI do the first draft

Open [Claude Code](https://claude.com/claude-code) in the repo and type `/make-video <topic>`. The skill in
`.claude/skills/make-video/` writes the script, runs `check` and `lint`, and fixes layout problems. `CLAUDE.md` holds the
rules it follows; edit them to change its habits (style, density, thumbnail rules).

## 3. Change the look

- **Theme.** Built in: `spectrum` (default), `dusk`, `neon`, `terminal`, `ai`, `classic`, `sketch`, `sticker`, `minimal`.
  Try one with `--theme dusk`, or set `config.json → theme`. To make your own, copy a block in `src/theme.ts` (the
  `spectrum` block is the most complete), give it a new key, and add that key to the `THEMES` set at the top of
  `scripts/make_video.py`.
- **Preview without rendering.** `npm run studio` opens Remotion Studio. The compositions `Main`, `Thumbnail`, `Avatar`,
  `Banner` and the `*Sheet` pages are there; change a colour and see it immediately.
- **Branding.** `config.json → channel` holds the name, tagline, intro and outro lines and the font (`quicksand`, `nunito`,
  `comfortaa`, `varela`, `baloo2`, `mali`, `grandstander`, `pangolin`). Replace `assets/brand/avatar.png`, then
  `./make-video brand build --force` to rebuild the cached intro and outro. The mascot is drawn in `src/mascot.tsx`; use
  your own character or remove it from the scripts.
  Licence note: the name WhyLoop, the mascot Bít and `assets/brand/` are not open-source; replace them in your own channel.
- **Voice.** Voices are listed in `config.json → voices`. Try a line with `./make-video say "Hello there" --voice "Hải Đăng"`.
  To clone yourself (Vietnamese dub): `./make-video voice add my-voice.wav --name "Me"`. Effects: `voice_fx_presets`.
  Never publish a clone of someone else's voice without their consent.
- **Music.** Describe a style in `config.json → music_captions` and the long version is generated by ACE-Step on first use,
  or place your own WAV (section 1).
- **Resolution.** `config.json → render.scale` multiplies the 1920x1080 layout: `1` gives 1080p, `1.3333333333333333` (exactly 4/3)
  gives 2560x1440, `2` gives 4K. Other values can produce non-integer sizes and Remotion refuses them. One-off: `WHYLOOP_RENDER_SCALE=1 ./make-video render ...`.

## 4. A weak computer, or the cloud

What is heavy, and what is not:

| Step | Cost | If your machine is weak |
|---|---|---|
| Write, `check`, `lint` | light (the lint needs headless Chrome) | run anywhere |
| English voice (Kokoro, ONNX) | light, runs on CPU | keep |
| Vietnamese voice (VieNeu-TTS) | medium | use `--no-dub` or `audio_langs: ["en"]` |
| Music generation (ACE-Step) | heavy, wants a GPU or Apple Silicon | **skip it**: use your own WAV (section 1) |
| Rendering frames (Remotion) | CPU and RAM, scales with cores and resolution | lower the scale, fewer processes |

**On the same machine, cheapest first:**

```bash
WHYLOOP_RENDER_SCALE=1 WHYLOOP_RENDER_CONCURRENCY=2 \
  ./make-video render <episode> --voice "Hải Đăng" --music mytrack --no-dub
```

Use `--mode demo` while you iterate, and the full render only at the end. `./make-video check` and `lint` cost almost nothing, so
fix the layout before spending render time.

**On a rented Linux machine** (a VM, a Codespace or a container; untested by me, so expect to adapt):

1. Pick about 8 vCPU and 16 GB of RAM (more cores render faster). A GPU is not needed unless you also generate music or the Vietnamese dub.
2. Install the system packages: `ffmpeg`, `espeak-ng`, Node.js 20+, `uv`, and the libraries headless Chrome needs
   (Remotion lists them for Linux in its docs: `libnss3`, `libdbus-1-3`, `libatk1.0-0`, `libgbm-dev`, `libasound2` and so on).
3. Clone the repo, but do **not** run `scripts/setup.sh` if you want to skip ACE-Step and VieNeu (it installs both). Run the
   parts you need instead:
   ```bash
   npm install
   uv venv tools/kokoro/.venv && uv pip install --python tools/kokoro/.venv/bin/python kokoro-onnx soundfile
   python3 scripts/make_sfx.py
   ```
4. Without a GPU, Remotion recommends software rendering: `WHYLOOP_RENDER_GL=swangle` (the default in `config.json` is
   `angle`, which suits a Mac). Keep `--no-open --no-web`.
5. Copy your episode folder and music in, render, and download `out/*.mp4`. Many people write and lint on the laptop and only
   render in the cloud; the script is just a JSON file.

**Remotion Lambda / Cloud Run** can render a Remotion composition on many machines at once. WhyLoop does **not** use them
today: its pipeline renders the picture locally and mixes the audio with ffmpeg afterwards, so wiring a cloud renderer in
would mean porting that mixing step. Treat it as an advanced project, not a switch.

## 5. If something goes wrong

| Symptom | Cause and fix |
|---|---|
| `lint` prints problems | Text over text, off-screen or crossing a border. Open the PNG in `out/review/<name>/`, move the node (`col`/`row`) or shorten the label, run again. Do not use `--no-lint`. |
| Remotion says the height is not an integer | `render.scale` is not 1, 4/3 or 2 (section 3). |
| A word is read wrongly | Add it to `pronunciation.json` (Vietnamese) or `pronunciation.en.json` (English); hear it with `say`. Do not add single-letter keys. |
| Dub line cut at the end | Read `*.vi.report.json`, shorten that `text_vi`. |
| `Khang Mix` voice not found | It is the author's private voice. Pass `--voice "Hải Đăng"` or change `default_voice` in `config.json`. |
| Music file missing | `assets/music/<name>.wav` is not shipped; generate it or add your own (section 1). |

## 6. The intro video

A 2-minute introduction video can be made with the same stack: the composition is `src/Promo.tsx`, the narration lives in
`promo/script.json`, and `python3 promo/build.py --render` regenerates the voice, the timeline and `out/promo.mp4`. It copies
thumbnails from the author's episode folders (not part of this repo), so to rebuild it for your own channel replace the
`assets()` function in `promo/build.py` with your own images and rewrite `promo/script.json`.

## 7. Share what you make

Keep the licences in mind ([LICENSES.md](../LICENSES.md)): the code is MIT, third-party icons and models keep their own terms, and a
book you explain is still under the author's copyright. Re-write it, redraw the figures, use synthetic data, cite the pages.
