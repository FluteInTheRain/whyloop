# WhyLoop · an automated pipeline that turns a textbook into bilingual explainer videos

WhyLoop is a one-person video studio written as code. It takes a chapter of a machine-learning textbook and produces a
finished YouTube episode: a script whose numbers are computed, English narration, a Vietnamese dub, animated diagrams,
music, thumbnail, captions and upload metadata. Everything renders locally.

**Channel:** [WhyLoop on YouTube](https://www.youtube.com/channel/UCxnTeZD7YM3adHAdMTf2kpQ) · *"Ask why. Then ask again."*

| | |
|---|---|
| Episodes | 14 public, 16 scripted (Machine Learning series, 36 planned) |
| Content | 967 animated beats in the 16 scripts, about 2.5 hours of rendered video |
| Output | 2560×1440, English picture with English audio, plus a same-length Vietnamese audio track |
| Code | about 6.7k lines of TypeScript, Python and JS (Remotion front end, Python engine) |

![Machine Learning #4: bias vs variance](docs/img/thumb-04.jpg)

## What I built

- **A script generator per episode** (`gen_script.py` in each episode folder). It simulates the data, fits the models
  from scratch (for example logistic regression by Newton/IRLS), and writes `script.json`. Every number on screen and in
  the voice-over comes from the same computed value, so picture and narration cannot disagree.
- **A scene engine in Remotion** (`src/`). Scripts are JSON; the engine draws plots, tables, equations (KaTeX), icons and
  the mascot Bít, and animates them in step with the narration.
- **A bilingual audio stack.** English narration with Kokoro TTS, Vietnamese dub with VieNeu-TTS. The dub is fitted into
  each beat's time slot, and a report flags any line that had to be cut so the script can be shortened.
- **A layout linter that looks at real pixels** (`scripts/lint_frames.mjs`). It renders the end of every beat in headless
  Chrome with the real theme and font, measures element boxes, and fails the build on text over text, text crossing a
  frame border, text off-screen, or text in the logo corner. `render` refuses to start until it prints zero problems.
- **A CLI that runs the whole chain** (`./make-video`): check, lint, render, captions, catalog, YouTube upload (Data API
  v3, dry-run first, private by default), with progress tracking safe for parallel renders.
- **Brand and asset tooling:** a themed design system, intro/outro clips cached per voice, a licence-filtered icon
  library of about 730 icons, and a thumbnail generator that draws a real-life metaphor scene per episode.

## Pipeline

```mermaid
flowchart LR
    B[Textbook chapter] --> S[gen_script.py<br/>simulate data, fit models]
    S --> J[script.json<br/>EN text + VI text per beat]
    J --> C[check + lint<br/>headless Chrome]
    C -->|0 problems| R[Remotion render<br/>2560x1440]
    J --> T1[Kokoro TTS<br/>English]
    J --> T2[VieNeu TTS<br/>Vietnamese dub]
    M[ACE-Step music] --> F
    T1 --> F[ffmpeg mix<br/>loudness -16 LUFS]
    T2 --> F
    R --> F
    F --> O[mp4 EN + m4a VI]
    O --> P[upload pack<br/>captions, description,<br/>thumbnail]
    P --> Y[YouTube Data API]
```

## What it looks like

Frames from episode 13 (logistic regression), taken by the linter. Both are checked automatically before rendering.

| Plot | Table |
|---|---|
| ![plot frame](docs/img/frame-plot.png) | ![table frame](docs/img/frame-table.png) |

More thumbnails: [#5](docs/img/thumb-05.jpg), [#13](docs/img/thumb-13.jpg), [#14](docs/img/thumb-14.jpg).

## Problems I had to solve

- **Layout bugs I could not see by eye.** A label wrapped onto the next icon and passed my first lint, which used the
  wrong theme. The lint now shares the exact theme and font of the real render.
- **Non-integer render height.** Rendering at 2K with a decimal scale made Remotion fail; the scale must be exactly 4/3.
- **Pronunciation.** The TTS read "WhyLoop" like "qui-loop". A pronunciation dictionary (`pronunciation*.json`) fixes
  the channel name and technical terms without matching single letters inside Vietnamese words.
- **Dub timing.** Vietnamese is longer than English. The dub is fitted per beat and reported, instead of stretching audio.
- **Copyright.** The source book is under copyright, so the repo stores only metadata. Episodes re-explain it with new
  examples and synthetic data, redraw every figure, and cite page numbers.

## Repo map

```
make-video           CLI entry point
scripts/             engine (make_video.py), linter, captions, YouTube upload, TTS, music, catalog
src/                 Remotion app: scenes, diagrams, mascot, math, thumbnails, theme
series/<s>/episodes/ per episode: gen_script.py, script.json, description, captions, thumbnail, youtube.json
                     (episode content is kept out of this public repo; the videos are on the channel)
assets/              brand, icon library with attribution, sound effects
templates/           script templates (compare-two, feedback-loop, math-plot ...)
docs/USAGE.md        full operating manual (Vietnamese)
LICENSES.md          licence and copyright review of every component
CLAUDE.md            the rules the AI assistant follows when making an episode
```

## Run it

Setup, voices and music are covered in the [usage manual](docs/USAGE.md). The repo does not contain the TTS models, the
rendered media, the background music or the voice samples, so a fresh clone needs `./scripts/setup.sh` and your own
voice and music first. YouTube credentials live outside the repo (`~/.config/whyloop/`).

```bash
./make-video check  series/<series>/episodes/<episode>
./make-video lint   series/<series>/episodes/<episode> --png
./make-video render series/<series>/episodes/<episode>
```

## How AI was used

The episodes are written and rendered with Claude Code, driven by project skills (`.claude/skills/`) and the rules in
`CLAUDE.md`. The engineering decisions (data-driven scripts, pixel-level lint, bilingual dub fitting) are mine; the
assistant executes them under those rules.

## Limits

Visuals are vector animation only, with no live-action footage or AI-generated images. Narration length varies by
10-15% from the estimate, and TTS pronunciation is not guaranteed. The Vietnamese preset voices have licence questions
noted in [LICENSES.md](LICENSES.md).

## Credits

Content follows *An Introduction to Statistical Learning* (James, Witten, Hastie, Tibshirani; Springer, 2013), re-written
with original examples. Third-party tools and licences: see [LICENSES.md](LICENSES.md).
