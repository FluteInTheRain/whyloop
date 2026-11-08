# WhyLoop video generator: rules for Claude

## Before creating or re-rendering ANY video
1. `./make-video check series/<s>/episodes/<ep>`: no ✗ errors, no layout warnings.
2. `./make-video lint series/<s>/episodes/<ep> --png`: **must print "0 vấn đề"**. It renders the end of every beat in
   headless Chrome with the real theme/font and measures element boxes (text over text, text crossing a frame border,
   text off-screen, text in the logo corner). Fix the script and re-run until it is clean, then look at the images in
   `out/review/<ep>/` yourself.
3. Only then render. `./make-video render` also runs the lint and refuses to start if problems remain
   (`--no-lint` exists but must not be used unless the user asks).

Never trust the layout of a script you have not linted: the lint once passed with the wrong theme and missed a label
that wrapped onto the next icon. `scripts/lint_props.py` now uses the same theme and channel font as the real render.

## Style rules
- Visuals first: every beat changes something on screen; every 2-3 beats show a number (stat/table/plot). See
  `.claude/skills/make-video/recipes.md` ("Quy tắc dày hình", "Bố cục sạch").
- Numbers on screen and in the voice-over come from the same computed data (never typed by hand).
- Mascot Bít lives at the very bottom-left (`x:150, y:985`); no camera zoom; plots use thin strokes.
- Render at 2K (2560x1440): `config.json -> render.scale` is `1.3333333333333333` (exactly 4/3; any other decimal makes Remotion fail with a non-integer
  height). The layout is still designed on a 1920x1080 canvas. Override once with `WHYLOOP_RENDER_SCALE=1|2`. Episode 6 went out at 4K.
- Plots are centred on the screen from episode 6 on: a full-width plot is `col: 4`, `w: 1440`, **`center: true`** (the node's `w` includes the
  label gutter on the left, so without `center` the axes box sits ~140 px right of the middle; episodes 1-5 are left as they were).
  Two-column layouts (plot + table/stat) do not need `center`.
- Pronunciation: channel name is "WhyLoop" read "quai lúp" (the TTS turns "wai" into /waɪ/ which sounds like "qui"; "quai" gives /kwaːj/); add every new term to `pronunciation.json`
  (do not add single-letter keys: they also match the last letter of Vietnamese words).
- Book content (series/machine-learning) is under copyright: re-write, redraw, synthetic data, cite pages.

## Voice
Each episode stores its voice/music in `episode.json → voice_music`; `render` and `brand build --episode <dir>` use it unless
`--voice/--music` is given. Intro/outro are built per voice (cache key includes the voice): never run `brand build`
without `--episode`/`--voice` for an episode that does not use the config default, or the intro will not match the content.

## Bilingual episodes (English picture, English + Vietnamese audio)
New episodes use `meta.lang = "en"` and `meta.audio_langs = ["en","vi"]`: every beat has `text` (English: on-screen language and
main audio, Kokoro `am_michael`/`af_heart`) and `text_vi` (Vietnamese dub, VieNeu, paired by `config.languages.en.voices`).
`render` writes only `out/<tag>.mp4` (English picture + audio) and `out/<tag>.vi.m4a` (same length, same music and sfx); it no longer
makes a `.vi.mp4` preview; the dub is fitted into each
beat's slot (report: `out/work/<tag>.vi.report.json`; fix any "bị cắt đuôi" by shortening `text_vi`). `--no-dub` skips it.
YouTube: main language en, localized vi title/description (`youtube.json → localizations`), captions `captions.en.srt` +
`captions.vi.srt` (`python scripts/captions.py <episode dir>`), thumbnail in English. The Vietnamese audio track cannot be sent
through the API: add it by hand in Studio (see `youtube.md`). `description.md` = English, `description.vi.md` = Vietnamese; both
follow the description format below. Deleting a video: `./make-video youtube delete <id> --yes` (irreversible: confirm with the user).

## After a render: upload pack
For every rendered episode create (in its folder): `thumbnail_S.jpg` (see "Thumbnail" below; copy to `thumbnail.jpg` only when the user
approves), `captions.vi.srt` (`python scripts/captions.py <episode dir>`, needs the render's
props file in out/work), `description.md` (+ `description.vi.md` for bilingual episodes; paste-ready, chapters from real beat timing, sources) and `youtube.md`
(title options, tags, settings, pinned comment, end screen, pre-publish notes).

## Thumbnail (the user's final style; every episode)
One **full-bleed scene** (1280x720, JPG < 2 MB), never a boxed or framed picture: the illustration IS the whole thumbnail and the text sits on it
(dark outline for legibility). The scene is a **real-life metaphor of the episode's topic** (ep1 suspension bridge whose cable is f, ep2 fork in the
road readable vs flexible, ep3 practice test vs real exam, ep4 two dartboards bias vs variance, ep5 town map with the new house and its
neighbours): a viewer must see what the video is about at a glance, with the data/formula idea hidden inside the metaphor (dots, curve, residual lines).
- Text: series tag top-left (`MACHINE LEARNING · 0N`), a 2-line title of at most 3 words per line (second line yellow), one short hook line bottom-left,
  `WhyLoop` top-right. English (main language).
- Bit (the mascot) is part of the story and placed wherever it is creative (pointing at the signpost, holding the pen, next to the house...); not a fixed corner.
- Colours follow the video theme (spectrum): green = good/pass, red = error/fail, purple = model/boundary, yellow = key point, cyan = data.
- Build: add a scene to `src/Thumbnail.tsx` (`Scene`/`Illus`), variant `"S"` with `figure`, then
  `npx remotion still src/index.ts Thumbnail <out.png> --props='{"variant":"S","figure":"<scene>","series":"...","big":"A\nB","hook":"..."}'`,
  look at it at full size and at 168x94 px, check nothing overlaps (title vs scene objects, labels vs shapes).
- Never put it live (`thumbnails.set`) without the user's approval of the picture.

## Keep the generator with the episode
Episodes with computed data keep their generator next to the script (`series/<s>/episodes/<ep>/gen_script.py`, writes
`script.json` beside itself; run with `python3`, needs numpy). Edit it and regenerate; do not hand-edit `script.json`, and
do not leave generators in a temp folder.

## Publishing to YouTube
`./make-video youtube upload <episode>` (see README 8c). Never upload without the user's explicit go-ahead and the title chosen;
the series playlist is a single one, set `"playlist": "PLQl0hqo1kejQ"` (the ID, not a title) in every `youtube.json`; always `--dry-run` first; default privacy is **public** (the user's rule from episode 15 on; set `"privacy": "public"` in every new `youtube.json`; episodes 15-16 were uploaded private before this rule); never commit or print the OAuth client secret/token
(`~/.config/whyloop/`). After a successful public upload run `./make-video catalog`.

## Video description format (the user's final version; keep it for every episode)
`description.md` = exactly these blocks, in this order, plain text (no `<` `>`), channel voice "ta":
1. Hook paragraph (first two lines are what shows above "xem thêm": the question + the promise).
2. One paragraph: which episode of the series, what we go through, the twist.
3. `Trong video:` + 4-5 bullets (`•`).
4. `Mốc thời gian:` chapters from real beat timing, first at `0:00`.
5. `Nguồn tham khảo:` full citation (+ pages) and one line saying content is re-written / diagrams redrawn / data synthetic.
6. `Đăng ký kênh để không bỏ lỡ tập sau: <title of the next episode>.` then `Ask why. Then ask again.`
7. Three hashtags.
Do NOT add: a "Câu hỏi cho bạn" paragraph, or a credits line for voice/music/icons (the user removed both from episode 1).
Episode 1's `description.md` is the reference example.
