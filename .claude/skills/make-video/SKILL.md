---
name: make-video
description: Interactive workflow to create a Vietnamese tech explainer video (script → voice + music → demo/full render with progress bar). Use when the user runs /make-video, or asks to make/generate a video about a technology topic.
---

# /make-video — tạo video giải thích công nghệ

Project root: `/Users/khang/generate-video`. Engine: `./make-video` (CLI). Config: `config.json`.
Always talk to the user in **Vietnamese**. Work in the project root.

## Quy trình (làm tuần tự, chờ người dùng ở mỗi bước)

### Bước 1 — Chủ đề / tập
Mọi video là một **tập** trong `series/<series>/episodes/<NN-slug>/` (gồm `episode.json`, `script.json`, `description.md`, `assets/`).
- Nếu người dùng nêu tập (`/make-video series/ml/episodes/03-hoi-quy`, hoặc "làm tập 3"), đọc `episode.json`
  (và `book`, `outline`, `figures`), rồi đọc phần sách tương ứng ở `books/<book>/text/` — **kịch bản bám theo sách**, ghi nguồn.
  Mặc định `target_seconds` = `episode.target_seconds` (thường 600 = 10 phút); không cần hỏi lại thời lượng trừ khi người dùng muốn đổi.
- Nếu chưa có tập nào / không có sách: hỏi *"Bạn muốn làm video về chủ đề gì?"*, tạo tập mới trong `series/standalone/episodes/<slug>/`
  (kèm `episode.json` `status: "draft"`). Lộ trình theo sách do skill `/plan-series` lập.

### Bước 1b — Thông tin kênh (một lần duy nhất)
Mọi video **luôn có intro nhận diện kênh** (tự động chèn ở đầu). Đọc `config.json → channel`
(`name`, `tagline`, `font`, `font_weight`, `avatar`). Nếu `channel.name` đang trống, hỏi người dùng **tên kênh** và
**khẩu hiệu** (ngắn), ghi vào `config.json`. Không tự bịa tên kênh.
Intro **chỉ gồm icon + tên kênh + khẩu hiệu** (không có dòng "Hôm nay…" và không có nhãn series). Hết intro, icon và tên kênh
**bay lên góc phải trên và ở lại suốt video**. Vì vậy **không đặt nội dung ở góc phải trên** (x > 1700, y < 110).

### Bước 2 — Giọng đọc, nhạc nền, thời lượng
Đọc `config.json` rồi dùng **AskUserQuestion** (một lần, nhiều câu) để chọn:
- **Giọng đọc**: các giá trị trong `voices` + lựa chọn "Ngẫu nhiên". Ghi chú kèm: **Khang Mix = giọng của người dùng pha Hải Đăng (mặc định đã chốt)**; Khang = giọng clone thuần của người dùng; Hải Đăng = nam Bắc tự nhiên; Ngọc Huyền = nữ Bắc tự nhiên; Thùy Dung = nữ Nam tin tức. Nếu `config.json` có `default_voice`, mặc định chọn giọng đó và chỉ hỏi lại nếu người dùng muốn đổi.
- **Nhạc nền**: các giá trị trong `music` (lofi_chill = nhẹ nhàng thư giãn; minimal_techno = nhịp đều, hiện đại; soft_jazz = jazz cà phê nhẹ; synthwave_soft = synthwave mơ màng; acoustic_warm = guitar acoustic ấm áp; chillhop_keys = chillhop mellow) + "Ngẫu nhiên".

Sau đó hỏi **thời lượng** bằng văn bản: "Bạn muốn video dài bao nhiêu? (nhập số phút + số giây, ví dụ: 2 phút 30 giây)". Quy ra `target_seconds`.
Gợi ý thực tế: ≈ `words_per_sec` (4.3) từ lời đọc mỗi giây; mỗi cảnh nên dài 5–12 giây → số cảnh ≈ target/8.

### Bước 3 — Viết kịch bản và trình bày
**Phong cách mặc định: một sơ đồ kể chuyện (`kind: "diagram"`)**, dựng dần theo lời nói, có mascot Bít, camera và âm thanh.
Chỉ dùng các kind rời (title/bullets/versus...) khi thật sự cần (ví dụ cảnh mở/kết ngắn). Đọc [scene-kinds.md](scene-kinds.md)
phần `diagram` và [recipes.md](recipes.md) trước khi viết.

1. Chọn mẫu gần nhất ở `templates/` (`before-after`, `pipeline`, `compare-two`) làm điểm xuất phát, hoặc dựng mới theo recipes.
   Lưu vào `series/<series>/episodes/<NN-slug>/script.json`; `meta` gồm topic, target_seconds, question, `subtitles: false` (không dùng `series`, `next`).
   **Tập dựa trên sách bắt buộc có `meta.source_line`** (hiện ở màn hình kết; `check` báo lỗi nếu thiếu), dạng ngắn gọn, ví dụ:
   `Nguồn: <tác giả>, <tên sách> (<năm>), chương 3, tr. 45–58 · CC BY 4.0`. Hình lấy từ sách: chép vào `assets/`, dùng kind `image`
   với `caption` ghi nguồn + giấy phép. Số liệu/định nghĩa lấy từ sách phải đúng và có trang để đối chiếu.
   Tập 10 phút ≈ 2.600 từ lời đọc, ~70–80 beat; chia thành 4–6 "màn" bằng `clear`, mỗi màn một ý lớn trong `outline`.
2. Cấu trúc: hook (1 beat) → bối cảnh/vấn đề cụ thể → cách giải quyết → hệ quả/số liệu → mở rộng.
   **Phần kết là BẮT BUỘC, luôn đúng thứ tự (check sẽ báo lỗi ✗ nếu thiếu):**
   - beat áp chót có `"role": "summary"` — tóm tắt / kết luận (2–3 ý chính, ngắn gọn);
   - beat cuối có `"role": "question"` — một **câu hỏi mở** để người xem tự suy nghĩ, gợi sang video tiếp theo
     (không phải câu hỏi có/không; không "cảm ơn" suông);
   - `meta.question` = bản rút gọn câu hỏi (≤ 14 từ) hiện ở màn hình kết **"Câu hỏi dành cho bạn"** (không có "video tiếp theo").
   Intro, màn hình câu hỏi và **outro mời đăng ký kênh** (có giọng đọc, thẻ thương hiệu quay lại giữa màn hình) do hệ thống **tự thêm**,
   không viết vào kịch bản.
   Mỗi **beat** = một ý ngắn (8–20 từ, 3–6s) và **phải làm hình thay đổi** (hiện thêm, highlight, đổi màu, gói tin chạy, camera).
   Dùng **một ví dụ cụ thể xuyên suốt**; tránh liệt kê ba ý đối xứng kiểu "đầu tiên, thứ hai, thứ ba".
3. Bố cục: dùng lưới `col` (1–7) / `row` (1–5, cho phép số lẻ) thay vì tự đoán x,y. Mascot đặt `col:1,row:5`.
   Mỗi vài beat nên `clear` để sang "màn" mới; mascot được giữ nguyên khi `clear`.
4. Sinh động: để mascot phản ứng ngắn (`set` expr + label, ≤3 từ như "Chậm quá!"), dùng `camera` (focus/zoom) ở 1–2 điểm nhấn,
   đổi màu cạnh đỏ→xanh để thể hiện trước/sau. Âm thanh tự động theo hành động (có thể ghi đè bằng `sfx` trong beat).
   Hệ thống tự thêm chuyển động: phần tử nảy vào có đà, icon/hộp trôi nhẹ, mascot nhún khi đổi biểu cảm, dòng code hiện lần lượt.
   Khoảnh khắc "à ra thế!" (phát hiện, kết luận then chốt) dùng mascot `expr: "aha"` + `point: "eureka"` (giơ tay lên).
   Vì vậy hãy **đổi biểu cảm/nhãn của mascot ở nhiều beat** và dùng `highlight`, `flow`, `camera` để hình luôn chuyển động.
4a. **Ưu tiên hình hơn lời** (xem mục "Quy tắc dày hình" trong [recipes.md](recipes.md)): mỗi beat đổi hình, cứ 2–3 beat có số liệu
   (`stat`/`table`/`plot`/`cells`), số tính từ dữ liệu tự tạo bằng mã, lời đọc dùng đúng số đó; dựng khung hình thử trước khi trình bày.
4b. **Quy ước màu** (theme `spectrum`: nền xám trung tính, màu sáng, tương phản cao). Mỗi sơ đồ phải dùng **từ 3 màu trở lên**,
   theo vai trò, bằng tên ngữ nghĩa (không dùng mã hex): dữ liệu / đối tượng chính = `primary` (cyan); mô hình, đường tốt, kết quả đúng
   = `green`; sai số, lỗi, phương án tệ = `red`; con số then chốt / điểm nhấn = `accent` (vàng); công thức, khái niệm = `purple`;
   so sánh phụ = `orange`, `pink`, `blue`. Chữ luôn trắng; không để cả hình cùng một tông.
5. Lời đọc tiếng Việt tự nhiên, có quan điểm, câu ngắn. Thuật ngữ viết như bình thường; `check` sẽ cảnh báo cách đọc.
   - Phát âm: với mỗi từ bị cảnh báo, thêm vào `pronunciation.json` (chữ thường = đọc như từ tiếng Anh; `<en>j v m</en>` = đánh vần tiếng Anh),
     rồi check lại. Có thể cho người dùng nghe thử bằng `./make-video say "câu thử" --voice "<giọng>"`.
   - Thêm `visual_note` mô tả hình/animation cho người duyệt.
6. Chạy `./make-video check series/<series>/episodes/<NN-slug>` rồi `./make-video lint series/<series>/episodes/<NN-slug> --png`
   (đo thật mọi beat; phải 0 vấn đề, xem ảnh ở `out/review/`): sửa mọi lỗi (✗), cảnh báo bố cục (chồng lấn, đường nối cắt node, ra mép) và lệch thời lượng
   > 12% **trước khi** trình bày.
7. Trình bày bằng bảng Markdown **theo từng beat**: `# | Lời đọc | Hình ảnh / animation (gồm mascot, camera, âm thanh) | ~giây`,
   tổng thời lượng ước tính và đường dẫn file. Nêu 2–3 gợi ý chỉnh sửa cụ thể rồi hỏi họ muốn chỉnh gì.

### Bước 4 — Trao đổi chỉnh sửa (lặp lại)
- Mỗi lần người dùng yêu cầu: sửa file JSON, chạy `check`, trình bày lại **chỉ những cảnh thay đổi** + tổng thời lượng mới.
- Người dùng có thể đổi giọng/nhạc/thời lượng bất kỳ lúc nào; cập nhật `meta`.
- Luôn lưu file sau mỗi lần sửa và nhắc đường dẫn khi cần. Có thể xuất bản đọc được (Markdown) vào cùng thư mục tập (`script.md`) nếu họ yêu cầu.
- Khi người dùng nói đã chốt/ok, chuyển bước 5.

### Bước 5 — Chọn kiểu làm
Dùng AskUserQuestion:
- **Demo (~30 giây)**: intro + các beat đầu tiên đến ~30s (không có màn câu hỏi/outro) để xem thử giọng, nhịp, hình. Nhanh.
- **Chính thức**: dựng toàn bộ kịch bản, rồi ghép intro + nội dung + màn câu hỏi + outro.
Nói rõ ước tính thời gian chờ: demo ≈ 1–2 phút; bản chính thức 5 phút ≈ 3.5–5.5 phút (≈ 0.7–1× thời lượng video) + thêm ~1 phút nếu cần sinh nhạc nền dài.

### Bước 6 — Dựng video và báo tiến độ
> Intro và outro là **clip dựng sẵn có cache** (`assets/brand/`). Lần render đầu (hoặc sau khi đổi kênh/avatar/giọng/theme/mã giao diện) hệ thống
> tự dựng lại chúng (~20 giây, hiện ở giai đoạn "Dựng intro & outro"); các lần sau chỉ dựng phần nội dung rồi ghép.
> Nếu người dùng đổi avatar, tên kênh, khẩu hiệu hay lời outro, chạy `./make-video brand build --force` hoặc cứ render lại.
1. Chạy bằng Bash **run_in_background: true**:
   `./make-video render series/<series>/episodes/<NN-slug> --voice "<giọng>" --music <nhạc> --mode demo|full`
   (bỏ `--voice`/`--music` nếu người dùng chọn Ngẫu nhiên.) Lệnh tự mở trang tiến độ trong trình duyệt (progress bar, các giai đoạn, thời gian còn lại) và tự mở video khi xong.
2. Nói với người dùng: trang tiến độ đã mở; có thể xem `out/work/progress.json`.
3. Trong lúc chờ, định kỳ đọc `out/work/progress.json` (hoặc output của task) và báo ngắn gọn phần trăm + giai đoạn. Đừng polling quá dày.
4. Khi xong: báo đường dẫn file trong `out/`, thời lượng thực tế, giọng + nhạc đã dùng. Hỏi họ có muốn chỉnh kịch bản/làm bản chính thức tiếp không.
   Engine tự ghi `episode.json → render` và đặt `status: "rendered"` (bản chính thức). Viết/cập nhật `description.md` trong thư mục tập:
   tóm tắt vui, **mốc thời gian**, danh sách nguồn (citation đầy đủ + giấy phép + link), lời mời đăng ký.
5. Khi người dùng đã đăng: `./make-video publish series/<series>/episodes/<NN-slug> --url <link> [--date YYYY-MM-DD]`
   (đặt `status: "published"`, cập nhật `catalog.md`). Tập đã đăng được coi là bản chốt: render lại sẽ cảnh báo.
6. Nếu lỗi: đọc log, báo nguyên nhân thật, sửa nếu là lỗi kịch bản; không nói đã xong khi chưa có file.

## Quy tắc
- Không tự chọn giọng/nhạc/thời lượng thay người dùng; không render khi chưa được chốt kịch bản.
- Mọi video **luôn** có: intro kênh (tự động), tóm tắt/kết luận, câu hỏi mở, màn hình kết. Không bỏ, kể cả khi người dùng muốn video ngắn.
- Không dùng kind/props/icon ngoài scene-kinds.md (render sẽ lỗi); hãy chạy `check`.
- Không vẽ/miêu tả nhân vật có bản quyền; mascot duy nhất là "Bít" (nhân vật gốc của dự án).
- Giọng đọc có thể là giọng clone của người dùng (`./make-video voice list`); không tự ý đổi giọng.
- Thời lượng thực tế có thể lệch ±15% so với ước tính vì tốc độ đọc của từng giọng.


## Thumbnail (bước cuối của mỗi tập)
Theo mục "Thumbnail" trong `CLAUDE.md`: một cảnh phủ kín khung (không khung/ô vuông), là **ẩn dụ đời sống** của chủ đề tập (cầu treo, ngã ba đường,
bài thi, bia phi tiêu, bản đồ khu phố...), chữ nằm trên cảnh, Bít đặt ở chỗ sáng tạo (không cố định góc). Thêm cảnh mới vào `src/Thumbnail.tsx`
(variant `S`), xuất `thumbnail_S.jpg`, cho người dùng duyệt rồi mới chép thành `thumbnail.jpg` và đặt lên YouTube.
