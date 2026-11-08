# WhyLoop · usage manual (Vietnamese)

> Operating manual. For the project overview see the [README](../README.md).

Tạo video giải thích khoa học máy tính bằng tiếng Việt (1080p, 30 fps, chuẩn YouTube) **hoàn toàn trên máy local**:
kịch bản → giọng đọc → sơ đồ hoạt họa → nhạc nền → ghép intro/outro → MP4.

| Thành phần | Công cụ | Chạy ở đâu |
|---|---|---|
| Viết và chỉnh kịch bản | Claude Code (skill `/make-video`) | Cloud |
| Giọng đọc tiếng Việt | [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) v3 Turbo (clone + pha giọng) | Local (`tools/vieneu`) |
| Hình ảnh / hoạt họa | [Remotion](https://www.remotion.dev) (React → video) | Local |
| Nhạc nền | [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) | Local (`tools/acestep`) |
| Ghép, chuẩn hóa âm lượng | ffmpeg | Local |

**Kênh:** WhyLoop · khẩu hiệu *"Ask why. Then ask again."* · mascot **Bít** · font thương hiệu **Mali** · theme **Spectrum**.

---

## 1. Cài đặt (máy mới)

```bash
./scripts/setup.sh        # clone VieNeu-TTS + ACE-Step vào tools/, cài phụ thuộc, tạo âm thanh hiệu ứng
```

Repo **không** chứa: `tools/`, model đã tải, `node_modules/`, video/audio sinh ra (`out/`, `public/audio/`), nhạc nền
(`assets/music/*.wav`), mẫu giọng cá nhân (`assets/voices/*.wav|json`). Sau `setup.sh`:

1. Đăng ký giọng: `./make-video voice add <file-audio> --name "Khang"` (rồi chạy lại để tạo giọng pha, xem mục 5).
2. Sinh hai bản nhạc gốc `assets/music/lofi_chill.wav`, `minimal_techno.wav` (xem `scripts/gen_music.py`, caption ở `config.json`).
3. `./make-video brand build` để dựng intro/outro.

---

## 2. Làm video mới (cách dùng chính)

Mở Claude Code **trong thư mục dự án** và gõ `/make-video` (hoặc `/make-video Docker là gì`).
Nếu lệnh không hiện, khởi động lại Claude Code một lần để nhận skill ở `.claude/skills/make-video/`.

| # | Bước | Chi tiết |
|---|---|---|
| 1 | Chủ đề | Bạn nhập chủ đề (nên hẹp, vẽ được thành sơ đồ) |
| 2 | Giọng, nhạc, thời lượng | Chọn từ danh sách (hoặc ngẫu nhiên), nhập số phút + giây. Giọng mặc định: **Khang Mix** |
| 3 | Kịch bản | Bảng theo từng beat: lời đọc · hình/animation · thời lượng. Lưu ở `series/<series>/episodes/<NN-slug>/script.json` |
| 4 | Chỉnh sửa qua lại | Mỗi lần sửa đều lưu file và kiểm tra lại độ dài, bố cục, phát âm |
| 5 | Chốt → Demo (~30s) hoặc Chính thức | Nên làm demo trước |
| 6 | Dựng | Trang tiến độ tự mở (thanh %, giai đoạn, thời gian còn lại); xong tự mở video ở `out/` |

Thời gian dựng đã đo (M4 Pro, 48 GB): video 5 phút ≈ 3.5–5.5 phút, thêm khoảng 1 phút nếu phải sinh nhạc nền dài hơn bản đã có.

---

## 3. Cấu trúc của mọi video

```
[intro 4.5s]  +  [nội dung ... tóm tắt → câu hỏi mở → màn "Câu hỏi dành cho bạn" 5s]  +  [outro 5s]
```

| Phần | Do ai tạo | Nội dung |
|---|---|---|
| **Intro** | Hệ thống (clip dựng sẵn) | Icon + tên kênh + khẩu hiệu (hiện từng chữ, từng từ), âm nhận diện, lời chào. Hết intro, icon và tên kênh **bay lên góc phải trên và ở lại suốt video** |
| **Nội dung** | Kịch bản | Sơ đồ kể chuyện dựng dần theo lời đọc |
| **Tóm tắt** | Kịch bản (`"role": "summary"`) | 2–3 ý chính |
| **Câu hỏi mở** | Kịch bản (`"role": "question"`) | Câu hỏi để người xem tự suy nghĩ |
| **Màn hình câu hỏi** | Hệ thống | "Câu hỏi dành cho bạn" + `meta.question` (không có "video tiếp theo") |
| **Outro** | Hệ thống (clip dựng sẵn) | Thẻ thương hiệu quay lại giữa màn hình, nút **Đăng ký kênh** được bấm, lời mời đăng ký |

`./make-video check` **báo lỗi** nếu thiếu `meta.question`, beat `summary`, hoặc beat `question` ở cuối. Chế độ demo có intro nhưng không có màn hình câu hỏi và outro.

### Intro/outro dựng sẵn (cache)

Intro và outro giống nhau ở mọi video nên được dựng một lần, lưu ở `assets/brand/intro.mp4`, `outro.mp4`,
rồi ghép bằng **sao chép luồng** (không mã hóa lại). Ghép đã đo: không click, chênh khung hình ở chỗ nối nhỏ hơn mức thường, lệch hình-tiếng
dưới ~25 ms. Nhạc nền chỉ chạy dưới phần nội dung.

```bash
./make-video brand build            # dựng (≈20s); tự dùng lại nếu không có gì đổi
./make-video brand build --force    # ép dựng lại
./make-video brand status           # xem khóa cache
```

Cache tự dựng lại khi đổi: tên/khẩu hiệu/font/lời đọc kênh, avatar, giọng, theme, từ điển phát âm, hoặc mã
`src/Video.tsx`, `scenes.tsx`, `theme.ts`, `mascot.tsx`, `icons.tsx`. Dùng `--inline-brand` để dựng kiểu cũ (intro/outro trong cùng một lần render).

---

## 4. Lệnh CLI (`./make-video`)

```bash
./make-video check  series/standalone/episodes/x                          # lỗi ✗, cảnh báo bố cục/phát âm, ước tính thời lượng
./make-video render series/standalone/episodes/x --mode demo              # demo ~30s
./make-video render series/standalone/episodes/x                          # bản chính thức (giọng/nhạc/theme theo config)
./make-video render series/standalone/episodes/x --voice "Hải Đăng" --music lofi_chill --theme dusk --seed 42
./make-video render series/standalone/episodes/x --no-open --no-web       # không mở trình duyệt / trang tiến độ
./make-video say "Dùng GET và POST" [--voice V] [--dry] [--fx cham] [--out f.wav] [--no-play]
./make-video voice add <audio> --name "Tên" [--start giây]  # clone giọng; | list | remove --name "Tên"
./make-video brand build|status [--force]
```

Kết quả: `out/<tên>[__demo]__<giọng>__<nhạc>__<theme>.mp4`; tiến độ ở `out/work/progress.json`.

---

## 5. Giọng đọc

| Giọng | Mô tả |
|---|---|
| **Khang Mix** (mặc định) | 50% giọng của bạn + 50% Hải Đăng (miền Bắc), mã đọc của Hải Đăng, giảm tốc 7% (`voice_fx: cham`) |
| Khang | Clone thuần từ file thu của bạn (đoạn mẫu 8 giây) |
| Hải Đăng, Ngọc Huyền, Thùy Dung | Preset VieNeu |

- **Clone**: `voice add` tự chọn đoạn nói rõ nhất ≤ 8s, khử ồn. Nên thu phòng yên tĩnh, nói liền mạch.
- **Pha giọng**: `voice_mixes` trong `config.json` (`alpha` = tỉ lệ giọng bạn; `codes` = lấy nhịp đọc/giọng vùng miền từ bên nào).
  Âm sắc pha được; **giọng vùng miền đi theo mã đọc**, không chỉnh được bằng EQ.
- **Chỉnh giọng** (`voice_fx_presets`): `cham` (tempo 0.93, đang dùng), `nhe|vua|manh` (sáng/thanh hơn), `tram_nhe|vua|ro` (trầm, bớt dày).
- **Phát âm**: từ viết HOA lạ có thể bị đánh vần theo tên chữ cái tiếng Việt (`GET` → "gờ e tê"). Sửa ở `pronunciation.json`
  (`"GET": "get"`, `"HTTPS": "<en>h t t p s</en>"`). `check` tự cảnh báo; `say "câu thử"` để nghe thử.
- Chữ cái trong công thức: viết lời đọc dạng phiên âm ("i-grếch", "ích", "bê"), hình vẫn hiện `y = a·x + b`.

---

## 6. Kịch bản (`series/*/episodes/*/script.json`)

```json
{
  "title": "Hồi quy tuyến tính",
  "meta": {"topic": "...", "target_seconds": 300, "question": "Câu hỏi mở (≤ 14 từ)?", "subtitles": false},
  "scenes": [{"id": "story", "kind": "diagram", "visual_note": "...",
              "props": {"nodes": [...], "edges": [...], "beats": [{"text": "...", "do": {...}}]}}]
}
```

**Kiểu chính: `diagram`**: một sơ đồ dựng dần theo từng beat (≈ 8–20 từ, 3–6s). Mỗi beat phải làm hình thay đổi. Có:
mascot Bít (biểu cảm `idle happy wow think oops wink aha`, tư thế `point: right|left|up|eureka`, bóng thoại ≤ 3 từ),
~31 icon vẽ sẵn + logo thật (`brand:go`, `brand:docker`...), camera pan/zoom, âm thanh tự động, chuyển động nảy/trôi,
bố cục lưới `col` (1–7) / `row` (1–5), màu theo **vai trò** (`primary` dữ liệu, `green` mô hình tốt, `red` lỗi, `accent` số then chốt,
`purple` công thức, `orange|pink|blue` phụ). Kiểu `diagram` còn có kind rời: `title bullets versus compare flow fanout code stat image`.

- Mẫu để bắt đầu: `templates/` (`before-after`, `pipeline`, `compare-two`).
- Đặc tả đầy đủ: `.claude/skills/make-video/scene-kinds.md`; công thức/nhịp kể/vai trò màu: `recipes.md`.

---

## 7. Nhận diện kênh

| Thứ | Nằm ở | Ghi chú |
|---|---|---|
| Tên, khẩu hiệu, lời intro/outro, font, avatar | `config.json → channel` | `font`: `quicksand nunito comfortaa varela baloo2 mali grandstander pangolin`; `font_weight` 500 |
| Avatar | `assets/brand/avatar.png` (800×800) | Bít giơ tay "Eureka", mặt cười mỉm, bóng đèn trên ăng-ten. Vẽ lại: `npx remotion still src/index.ts Avatar assets/brand/avatar.png --props=<json {"variant":"C"}>` |
| Theme | `config.json → theme` | `spectrum` (mặc định). Khác: `dusk neon terminal ai`; lưu tham khảo: `sketch sticker minimal classic` |
| Font nội dung | `src/theme.ts` | Mali cho mọi chữ; bảng số và khung code dùng font đơn cách để cột thẳng hàng. Toàn bộ chữ nhẹ hơn một bậc (`weightShift`) |

---

## 8. Cấu hình (`config.json`)

| Khóa | Ý nghĩa | Hiện tại |
|---|---|---|
| `voices`, `default_voice` | Giọng cho phép / mặc định | `Khang Mix` |
| `voice_mixes`, `voice_fx`, `voice_fx_presets` | Pha giọng, chỉnh giọng theo từng giọng | xem mục 5 |
| `music`, `music_captions` | Nhạc nền và mô tả để sinh bản dài | `lofi_chill`, `minimal_techno`, `soft_jazz`, `synthwave_soft`, `acoustic_warm`, `chillhop_keys` |
| `music_offset_db` | Nhạc dưới giọng bao nhiêu dB (số nhỏ = nhạc to hơn) | 8 |
| `target_lufs` | Độ lớn đầu ra | -16 |
| `words_per_sec`, `beat_gap_sec`, `pad_sec` | Ước tính thời lượng / khoảng nghỉ giữa các beat / sau cảnh | 4.3 / 0.45 / 0.6 |
| `demo_seconds` | Độ dài bản demo | 30 |
| `theme` | Theme mặc định | `spectrum` |
| `channel` | Nhận diện kênh (mục 7) | WhyLoop |
| `intro_min_sec`, `signoff_min_sec`, `endcard_sec` | Độ dài tối thiểu intro / outro / màn câu hỏi | 4.0 / 4.6 / 5.0 |

Nhạc nền gốc dài 40s; video dài hơn thì tự sinh bản dài (cache `assets/music/<tên>_<N>s.wav`, thêm ~0.5–1 phút lần đầu).

---

## 8a. Thư viện icon màu

`assets/library/` chứa ~730 icon **giữ nguyên màu gốc** (logo công nghệ thật, icon khái niệm, emoji phẳng), tải từ Iconify, chỉ nhận giấy phép
MIT / Apache-2.0 / CC0 / BSD / ISC (xem `assets/library/ATTRIBUTION.md`). Dùng trong kịch bản: `"icon": "img:logos/python"`.

```bash
./make-video assets search kubernetes            # tìm trong thư viện
./make-video assets search "machine learning" --remote   # tìm thêm trên Iconify (chỉ các bộ đã cho phép)
./make-video assets add logos/rust fluent-emoji-flat/robot   # tải thêm (cập nhật manifest.json)
./make-video assets list --set fluent-color
./make-video assets sync                          # tải lại theo manifest.json
```

`brand:<tên>` và các tên glyph có sẵn (`db`, `server`, `user`...) tự dùng hình màu khi có (`config.json → icon_style: "color"`).
Mẫu sơ đồ mới: `templates/` (`client-server`, `layers`, `feedback-loop`, `timeline`, `tech-stack`, `data-pipeline`, `math-plot`).

---

## 8b. Sách, series và kho nội dung

Luồng làm theo sách (mỗi tập ≈ 10 phút, luôn ghi nguồn):

```bash
./make-video book ingest ~/Downloads/sach.pdf --slug ml-book --title "Tên sách" --author "Tác giả" \
    --year 2024 --license "CC BY 4.0" --license-url https://creativecommons.org/licenses/by/4.0/ --page-offset 12
# trong Claude Code:  /plan-series   → đọc sách, đề xuất lộ trình, ghi series/<series>/ (sau khi bạn duyệt)
# trong Claude Code:  /make-video series/<series>/episodes/03-...   → kịch bản bám sách → render
./make-video catalog                                     # catalog.md: tập nào đang ở trạng thái nào
./make-video publish series/<series>/episodes/03-... --url https://youtu.be/... --date 2026-10-20
```

- Trạng thái tập (`episode.json → status`): `planned` → `draft` → `scripted` → `rendered` → `published`.
  `render` bản chính thức tự ghi `render` (giọng, nhạc, file) và đặt `rendered`; `publish` ghi link + ngày đăng.
- Tập dựa trên sách **bắt buộc** có `meta.source_line` (hiện ở màn hình kết); `check`/`render` báo lỗi nếu thiếu.
  Hình từ sách chép vào `episodes/<ep>/assets/`, dùng kind `image` kèm caption ghi nguồn + giấy phép.
- `books/*/source/` (file gốc) không vào git. Sách giấy phép mở: văn bản/hình trích và `book.json` vào git. Sách có bản quyền: chỉ `book.json` vào git
  (`books/<book>/.gitignore` tự tạo khi nạp). Xem một trang sách: `./make-video book page <book> <trang in>`. Chú ý giấy phép: `NC` (phi thương mại) và `ND`
  (không phái sinh) cần xem lại khi kênh có kiếm tiền hoặc biên soạn lại; `BY`/`SA` bắt buộc ghi nguồn/chia sẻ tương tự.

---

## 8c. Đăng YouTube tự động

`./make-video youtube upload <tập>` tải video, thumbnail, phụ đề và gắn vào danh sách phát bằng YouTube Data API v3.
Metadata đọc từ `<tập>/youtube.json` (tiêu đề, thẻ, danh sách phát...) và `description.md`. Khóa/token nằm ngoài repo
(`~/.config/whyloop/`), không bao giờ commit.

**Thiết lập một lần**
1. Vào https://console.cloud.google.com → tạo project (ví dụ "WhyLoop") → *APIs & Services → Library* → bật **YouTube Data API v3**.
2. *OAuth consent screen* → loại **External** → điền tên app và email → thêm chính tài khoản Google sở hữu kênh vào **Test users**.
   Nếu để trạng thái *Testing*, token hết hạn sau 7 ngày (phải `auth` lại); chuyển sang *In production* (app chưa xác minh, chỉ bạn dùng)
   để khỏi hết hạn.
3. *Credentials → Create credentials → OAuth client ID → Desktop app* → tải file JSON → lưu thành
   `~/.config/whyloop/youtube_client_secret.json`.
4. Chạy (tương tác, mở trình duyệt): `./make-video youtube auth`. Khi hỏi, **chọn đúng kênh WhyLoop** (nếu là Brand Account).
5. Kiểm tra: `./make-video youtube status` phải in "ĐÚNG kênh trong config" (`config.json → channel.youtube_channel_id`).

**Mỗi tập**
```bash
./make-video youtube upload series/machine-learning/episodes/01-hoc-thong-ke-la-gi --dry-run   # xem trước, không gọi API
./make-video youtube upload series/machine-learning/episodes/01-hoc-thong-ke-la-gi             # mặc định: riêng tư (private)
./make-video youtube resume <tập>     # làm lại bước thumbnail / phụ đề / danh sách phát nếu có bước lỗi
./make-video youtube public <tập>     # chuyển sang công khai + đánh dấu published
```
Có thể hẹn giờ: `--publish-at 2026-10-20T09:00:00+07:00` (tải lên ở chế độ riêng tư rồi tự công khai).

**Lưu ý**
- Project API chưa qua *audit* của Google: video tải lên bằng API có thể bị **khóa ở chế độ riêng tư**; khi đó bạn đổi sang
  Công khai thủ công trong YouTube Studio (hoặc xin audit tại YouTube API Compliance Audit).
- Hạn mức mặc định 10.000 đơn vị/ngày, mỗi video ~1.700 đơn vị: tối đa ~5 video/ngày.
- Thumbnail tùy chỉnh yêu cầu kênh đã xác minh số điện thoại.
- API **không ghim** được bình luận; ghim tay sau khi đăng (nội dung ở `youtube.md`).
- `contains_synthetic_media` trong `youtube.json`: `null` = không gửi; đặt `true/false` sau khi bạn quyết định về nhãn nội dung tổng hợp.

---

## 9. Cấu trúc thư mục

```
make-video, config.json, pronunciation.json
books/              sách tham khảo: book.json, text/ (theo chương, có marker trang), figures/ (hình trích), source/ (file gốc, không vào git)
series/<series>/    series.json, syllabus.md, episodes/<NN-slug>/{episode.json, script.json, description.md, assets/}
templates/          mẫu kịch bản (before-after, pipeline, compare-two, client-server, layers, feedback-loop, timeline, tech-stack, data-pipeline, math-plot)
assets/library/     icon/logo màu gốc (+ manifest.json, aliases.json, ATTRIBUTION.md); public/lib/ là bản tạm khi render
catalog.md          danh mục mọi tập + trạng thái (tạo bởi ./make-video catalog)
src/                Remotion: Video.tsx (khung, thẻ thương hiệu), scenes.tsx, diagram.tsx, mascot.tsx, icons.tsx, theme.ts, Avatar.tsx
scripts/            make_video.py (engine), episodes.py, book.py, assets.py, captions.py, lint_*.py|mjs, progress.py, gen_music.py, make_sfx.py, setup.sh
assets/brand/       avatar.png, intro.mp4, outro.mp4 (build/ = cache theo khóa)
assets/sfx|music|voices/   âm hiệu ứng, nhạc nền, mẫu giọng + bài đọc mẫu
out/                video thành phẩm; out/work/ = trung gian + progress.json
tools/              VieNeu-TTS, ACE-Step (bên thứ ba, không vào git)
.claude/skills/make-video/   skill /make-video (SKILL.md, scene-kinds.md, recipes.md)
.claude/skills/plan-series/  skill /plan-series (sách → lộ trình + syllabus từng tập)
LICENSES.md         rà soát giấy phép / bản quyền
```

Git: nhánh `main`; chỉ commit khi bạn yêu cầu. Muốn xem trước giao diện: `npm run studio`.

---

## 10. Giới hạn

- Hình ảnh là hoạt họa vector từ các kind có sẵn; **chưa có** video clip thật hay ảnh AI tự sinh. Công thức (KaTeX) và biểu đồ đường/điểm/cột/đoạn thẳng có node `equation`, `plot`; chưa có biểu đồ 3D hay biến đổi công thức từng ký hiệu kiểu Manim.
- Thời lượng thực tế lệch ±10–15% so với ước tính (tùy giọng).
- Giọng vùng miền của clone/pha phụ thuộc đoạn mẫu; không đổi được bằng hậu kỳ.
- Phát âm do model quyết định; từ điển sửa được lỗi đã biết, không bảo đảm tuyệt đối.
- Chuyển động mới chỉ kiểm tra qua khung hình và số đo; luôn xem/nghe video thật trước khi đăng.
- Rủi ro bản quyền giọng preset VieNeu chưa xác minh được hết: xem `LICENSES.md`.
