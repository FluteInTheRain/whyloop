---
name: plan-series
description: Turn a reference book (open-license PDF/EPUB) into a series roadmap and per-video syllabus (~10 min each, with citations). Use when the user uploads a book, runs /plan-series, or asks to plan/extend a series, lộ trình, syllabus.
---

# /plan-series — từ sách đến lộ trình + syllabus từng video

Project root: `/Users/khang/generate-video`. Luôn nói tiếng Việt. Mỗi video ≈ **10 phút** (`target_seconds: 600`, ≈ 2.600 từ lời đọc),
bám nội dung sách, **luôn ghi nguồn**. Làm video thật bằng skill `/make-video`.

## Cấu trúc dữ liệu
```
books/<book>/book.json            metadata, giấy phép, citation, danh sách chương (+trang in)
books/<book>/text/NN-*.md         văn bản từng chương, có marker <!-- p.N --> (số trang in)
books/<book>/figures/*.png        hình trích từ sách + figures.json (id, trang, caption_guess)
series/<series>/series.json       tên series, book, mục tiêu, đối tượng
series/<series>/syllabus.md       lộ trình (bảng tập, mục tiêu học, chương/trang nguồn)
series/<series>/episodes/NN-slug/
    episode.json                  status, number, book{slug,chapter,pages}, outline, figures, youtube
    script.json                   kịch bản (do /make-video làm)
    description.md                mô tả YouTube + nguồn + mốc thời gian
    assets/                       hình dùng trong tập (chép từ books/<book>/figures/, đặt tên duy nhất)
```
`./make-video catalog` tạo `catalog.md` tổng hợp mọi tập + trạng thái.

## Quy trình

### 1. Nạp sách (nếu chưa có `books/<book>/`)
`./make-video book ingest <file.pdf|epub> --slug <book> --title "..." --author "..." --year YYYY --license "CC BY 4.0" --license-url <url> --url <nơi công bố> [--page-offset N]`
- `--page-offset`: trang in = trang PDF − offset. Kiểm tra bằng cách mở 1–2 trang rồi chỉnh `book.json` (và chạy lại).
- Sau khi nạp: đọc `book.json` (số chương, số hình), điền `TODO` nếu còn.
- **Đọc kỹ giấy phép** rồi báo người dùng trước khi lập kế hoạch:
  - `NC` (phi thương mại): kênh bật kiếm tiền là mục đích thương mại → hỏi lại, đừng tự quyết.
  - `ND` (không phái sinh): biên soạn lại/cắt ghép hình có thể là tác phẩm phái sinh → hỏi lại.
  - `SA`: video phải chia sẻ theo cùng giấy phép → ghi rõ trong mô tả.
  - `BY`: bắt buộc ghi tên tác giả, tên sách, giấy phép + link, và nêu nếu có chỉnh sửa.

- **Sách có bản quyền (không có giấy phép mở)**: `book.json → license.open = false`. Khi đó:
  - `books/<book>/.gitignore` tự loại `text/`, `figures/`, `source/` khỏi git (chỉ `book.json` được commit): đừng tự ý commit/đăng nội dung trích.
  - **Không chép nguyên văn dài, không dùng nguyên hình/bảng.** Biên soạn lại bằng lời của kênh, **vẽ lại** sơ đồ bằng engine, tự tạo ví dụ số
    (dữ liệu giả lập) thay vì lấy bộ dữ liệu/bảng số từ sách; ý tưởng, định nghĩa, công thức chuẩn thì dùng được, kèm nguồn + trang.
  - Chỉ dùng nguyên hình/bảng khi người dùng xác nhận đã có phép của nhà xuất bản (ghi vào `episode.json → sources[].permission`).
  - Xem một trang để đối chiếu/vẽ lại: `./make-video book page <book> <số trang in>` → `books/<book>/pages/pNNN.png` (không vào git).

### 2. Đọc sách và đề xuất lộ trình
- Đọc `text/` (đủ để hiểu mạch; sách dài thì đọc mục lục + đầu/cuối chương, đọc sâu chương cần dùng).
- Một tập = **một ý lớn vẽ được thành sơ đồ**, vừa ~10 phút. Một chương có thể tách 2–3 tập; chương nhỏ gộp lại.
- Sắp thứ tự theo mạch học (khái niệm nền trước), mỗi tập nêu: tên, mục tiêu học (1 câu), chương/trang nguồn,
  3–6 ý chính, ví dụ/số liệu/hình trong sách có thể dùng, câu hỏi mở dẫn sang tập sau.
- Trình bày bảng lộ trình cho người dùng, **chờ duyệt/chỉnh** trước khi ghi file.

### 3. Ghi file (sau khi được duyệt)
- `series/<series>/series.json`: `{"slug","title","book":"<book>","audience","default_target_seconds":600,"description"}`.
- `series/<series>/syllabus.md`: bảng lộ trình + mô tả từng tập.
- Mỗi tập: thư mục `NN-slug/` với `episode.json`:
  `{"slug","title","series","number":N,"status":"planned","book":{"slug","chapter","pages":"45–58"},"learning_goal","outline":[...],
    "figures":["p045-1"],"sources":[],"target_seconds":600,"youtube":{"url":null,"published_at":null},"render":null}`
- Chạy `./make-video catalog`.

### 4. Quy tắc nội dung
- **Biên soạn lại bằng lời của kênh**, không chép nguyên văn dài; số liệu/định nghĩa giữ đúng và ghi trang.
- Hình trong sách: có thể dùng (theo giấy phép) bằng cách chép từ `books/<book>/figures/` vào `episodes/<ep>/assets/`
  (tên file duy nhất, ví dụ `<slug>-p045-1.png`) và dùng kind `image`, `caption` ghi "Hình X — <tác giả>, <sách>, <giấy phép>".
  Ưu tiên vẽ lại sơ đồ bằng diagram của kênh nếu hình gốc quá phức tạp/độ phân giải thấp.
- Không dùng nguồn ngoài sách mà không ghi rõ; nếu cần bổ sung, thêm vào `episode.json → sources`.
