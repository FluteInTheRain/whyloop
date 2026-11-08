# Schema kịch bản & các loại cảnh

File: `series/<series>/episodes/<NN-slug>/script.json`

```json
{
  "title": "Tên video",
  "meta": {"topic": "...", "target_seconds": 150, "question": "...", "subtitles": false},
  "scenes": [
    {"id": "hook", "kind": "title", "text": "Lời đọc của cảnh", "props": {...}, "visual_note": "Mô tả hình/animation cho người duyệt"}
  ]
}
```
`id` là duy nhất, không dấu, không khoảng trắng. `text` là lời đọc (cũng hiện làm phụ đề). Mỗi cảnh dài đúng bằng lời đọc + 0.6s.

## Các `kind` hỗ trợ

| kind | props | Hình ảnh |
|---|---|---|
| `title` | `heading`, `sub?` | Tiêu đề lớn + dòng phụ. Dùng cho hook mở đầu. |
| `outro` | `heading`, `sub?` | Như title, dùng để kết/dẫn sang chủ đề sau. |
| `bullets` | `heading?`, `items: string[]` (≤5, mỗi item ngắn), `numbered?: bool` | Danh sách hiện từng dòng. `numbered:true` cho các bước. |
| `versus` | `left: {title, points[]}`, `right: {title, points[]}` | Hai cột so sánh A vs B (≤4 point mỗi cột). |
| `compare` | `top: {label, value, ratio?}`, `bottom: {label, value, ratio?}` | Hai thanh ngang so sánh độ lớn. `ratio` 0–1 là độ dài thanh (top mặc định 1, bottom 0.004). |
| `flow` | `nodes: string[]` (2–6), `caption?` | Chuỗi hộp nối bằng mũi tên, sáng lên lần lượt. Dùng cho quy trình/pipeline/luồng request. |
| `fanout` | `left?`, `middle?`, `right?`, `count?` (12), `workers?` (3), `caption?` | Nhiều chấm (tác vụ) chảy qua bộ điều phối rồi vào vài worker. Dùng cho scheduler, load balancer, queue, thread pool. |
| `code` | `lines: string[]`, `highlight?: number[]` (chỉ số dòng, từ 0), `lanes?: string[]`, `emphasis?: string[]` | Khung code có tô từ khóa; `highlight` làm nổi dòng; `lanes` là các thanh tiến độ chạy song song bên phải. |
| `stat` | `value`, `label`, `sub?` | Một con số lớn gây ấn tượng (ví dụ `"10x"`, `"99.9%"`). |
| `image` | `src` (tên file trong `assets/` của tập; engine chép sang `public/images/` khi check/render), `caption?` | Ảnh tĩnh zoom nhẹ. File phải tồn tại. Hình lấy từ sách: `caption` ghi nguồn + giấy phép. |

## Gợi ý chọn kind
- Khái niệm "là gì" → `title` + `bullets`/`stat`
- So sánh hai thứ → `versus` (định tính) hoặc `compare` (định lượng)
- Quy trình, kiến trúc, request đi qua các lớp → `flow`
- Song song, hàng đợi, phân phối tải → `fanout`
- Cú pháp, ví dụ lập trình → `code`
- Các bước làm → `bullets` với `numbered:true`

## Chưa hỗ trợ
Video clip thật, ảnh AI tự sinh, chuyển động camera phức tạp, biểu đồ số liệu. Nếu người dùng cần, nói thẳng là chưa có và đề xuất kind gần nhất.

---

# `diagram` — kiểu sơ đồ kể chuyện (ƯU TIÊN cho giải thích kiến trúc/quy trình)

Một sơ đồ **duy nhất, được dựng dần** theo từng nhịp lời nói; phần tử giữ nguyên giữa các nhịp rồi biến đổi
(đổi màu, highlight, gói tin chạy, ẩn đi). Gần cách người làm video hơn nhiều so với các kind rời rạc ở trên.
Một scene `diagram` có thể kéo dài cả chương (nhiều beat). Không có `text` ở cấp scene; lời đọc nằm trong `beats`.

```json
{"id": "story", "kind": "diagram", "visual_note": "...",
 "props": {
   "nodes": [ {"id":"main","type":"box","label":"main()","x":330,"y":540,"w":290,"h":110}, ... ],
   "edges": [ {"id":"e1","from":"main","to":"s1"}, ... ],
   "beats": [
     {"text": "Lời đọc của nhịp này.", "do": {"show": ["main","s1","e1"]}},
     {"text": "Nhịp kế tiếp.", "do": {"highlight": ["s1"], "flow": ["e1"], "set": {"e1": {"color": "#f0625f"}}}}
   ]}}
```

Toạ độ: canvas 1920×1080, `x,y` là **tâm** node; hoặc dùng lưới `col` (1–7) / `row` (1–5, cho phép lẻ). Vùng an toàn: x 40–1880, y 90–1000.
Mỗi node/edge cần `id` duy nhất.

**Node `type`**: `icon` (mặc định; `icon`, `label`, `sub?`, `size?` mặc định 124) · `box` (`label`, `sub?`, `w`,`h`, `color`) ·
`group` (khung nét đứt, `label`, `w`,`h`; vẽ dưới cùng) · `cells` (lưới ô màu: `rows`,`cols`,`fill?`,`hi?[]`,`color?`,`label?`) ·
`pill` (`label`,`w`,`color`) · `text` (`label`,`size`,`color`) · `code` (`lines[]`,`size`) · `badge` (`label` số bước) ·
`equation` (công thức KaTeX: `tex`, `size?` mặc định 56, `color?`, `w?`,`h?`; xem bên dưới) · `plot` (biểu đồ: xem bên dưới) ·
`mascot` (cố định trên màn hình; `char`: bit|miu|cu|giot|pix|bong, mặc định theo theme; `expr`: idle|happy|wow|think|oops|wink|aha (phấn khích, "Eureka!"), `look`: center|left|right|up|down,
`point`: left|right|up|eureka (giơ tay chỉ lên), `label` = bóng thoại ≤3 từ, `side`: left|right, `size`). Dùng `set` để đổi `expr`/`label` theo beat; `clear` không ẩn mascot.

**`equation`**: `tex` là chuỗi KaTeX, nhớ nhân đôi dấu `\\` trong JSON (`"\\frac{1}{n}\\sum_{i=1}^{n}(y_i-\\hat{y}_i)^2"`).
Xuống dòng bằng `\\\\`. Kích thước tự ước lượng (`size` 56 ≈ cao 95px); công thức dài/nhiều tầng thì đặt `w`,`h` tay.
Dùng `color` theo vai trò (`accent` cho kết quả then chốt, `purple` cho công thức/khái niệm), `highlight` để làm nổi, `set {"id":{"tex": "..."}}`
để đổi công thức giữa các beat.

**`stat`** (số lớn đếm lên): `value` (số), `decimals?` (0), `prefix?`, `suffix?` (ví dụ `"%"`), `label?` (dòng nhỏ bên dưới), `color?` (mặc định `accent`),
`size?` (96), `group?` (false = không tách nghìn, dùng cho năm). Số tự đếm từ 0 lên `value` khi hiện; ở beat sau đổi bằng
`"set": {"<id>": {"value": 3.1, "from": 5.2}}` để đếm từ `from` sang `value` (tăng hoặc giảm). Dấu thập phân hiện bằng dấu phẩy.

**`table`** (bảng số liệu): `rows: [[...], ...]` (hàng đầu là tiêu đề trừ khi `header: false`), `colw?` (170) hoặc `colws?: [w1,w2,...]` (rộng từng cột), `rowh?` (58), `fs?` (30), `color?`,
`hi?: [chỉ số hàng]` (làm nổi), `step?` (số hàng dữ liệu đang hiện; đổi bằng `set` để hàng hiện dần theo lời đọc, `0` = chỉ tiêu đề).
Dùng cho dữ liệu thô, bảng so sánh, ký hiệu. Ô nên ngắn (font đơn cách); cột đầu dài thì tăng `colw`.

**`plot`**: `x`,`y` (tâm), `w?` 760, `h?` 520, `xrange:[min,max]`, `yrange:[min,max]`, `xlabel?`, `ylabel?`, `grid?` (true), `axes?` (true),
`series: [...]` vẽ theo thứ tự khai báo, `step?` (xem dưới). Mỗi series có `color?` (tên vai trò hoặc hex), `label?` (hiện ở chú giải), `dashed?`, `width?`:
- `{"type":"points","data":[[x,y],...],"r?":11}` · `{"type":"line","data":[[x,y],...]}` · `{"type":"bars","data":[[x,y],...]}` (x là vị trí cột)
- `{"type":"fn","fn":"1.2+1.2*x"}` (biểu thức theo `x`: số, `+ - * / ^ ( )`, hàm `sin cos tan exp log sqrt abs pow min max floor ceil...`, `PI`, `E`;
  `check` từ chối mọi thứ khác)
- `{"type":"bars",...,"barw":0.1}`: `xticks?`/`yticks?: [số,...]` (đặt vạch trục thủ công, ví dụ `[1,2,3]` cho cột); `barw` là bề rộng cột theo tỉ lệ bề rộng biểu đồ; đặt nhỏ để hai nhóm cột đặt cạnh nhau (x lệch ±0.2)
- `{"type":"segments","data":[[x1,y1,x2,y2],...]}` (đoạn thẳng, hợp để vẽ sai số/residual)

`step` điều khiển cách series hiện dần: `"step": 1` = chỉ series đầu; ở beat sau `"set": {"<plot id>": {"step": 2}}` làm series thứ 2 được vẽ dần vào
(đường vẽ từ trái sang, điểm hiện lần lượt, đoạn mọc ra). Bỏ `step` = hiện hết cùng lúc khi node xuất hiện. Dữ liệu lấy từ sách phải ghi nguồn.
Xem mẫu thật: `npx remotion still src/index.ts MathSheet out/work/math.png`.

**Icon màu gốc (ưu tiên dùng)**: `"icon": "img:<bộ>/<tên>"` hiển thị file SVG trong `assets/library/` **giữ nguyên màu**, không tô lại.
Các bộ (MIT/CC0/Apache): `logos` (logo công nghệ, nền sáng tự thêm), `flat-color-icons` (khái niệm CNTT/văn phòng, ~330),
`fluent-color` (giao diện/khái niệm hiện đại, ~95), `fluent-emoji-flat` (emoji phẳng: bóng đèn, tên lửa, não, đồng hồ cát...).
- Tìm: `./make-video assets search <từ khóa tiếng Anh>` (thêm `--remote` để tìm trên Iconify trong các bộ đã cho phép);
  liệt kê: `./make-video assets list [--set logos]`; tải thêm: `./make-video assets add logos/rust` (hoặc `fluent-emoji-flat/robot`).
- `"tile": true|false` ép nền sáng bo góc phía sau (mặc định: bật cho `logos`, tắt cho các bộ còn lại).
- `brand:<tên>` tự đổi sang logo màu gốc trong `logos` nếu có (đặt `"mono": true` để giữ logo một màu của simple-icons).
- Tên glyph có sẵn (`db`, `server`, `user`, `cloud`...) tự đổi sang hình màu theo `assets/library/aliases.json` khi `icon_style` là `color`
  (mặc định, ở `config.json`; ghi đè bằng `meta.icon_style: "glyph"` hoặc `"glyph": true` ở từng node).
- Thư viện + giấy phép: `assets/library/ATTRIBUTION.md`. Chỉ nhận giấy phép MIT/Apache-2.0/CC0/BSD/ISC (CC BY bị từ chối để khỏi phải ghi nguồn từng hình).

**Icon glyph một màu**: `db server client phone user cloud msg file cpu lock queue gear browser terminal cube shield key clock check cross
warning bolt globe folder chart bug rocket thread balance search bell`, hoặc logo thật `brand:<tên>`
(`brand:go`, `brand:docker`, `brand:postgresql`, `brand:redis`, `brand:apachekafka`, `brand:kubernetes`... tên theo simple-icons;
`check` sẽ báo nếu không có).

**Edge**: `from`,`to`, `label?`, `color?`, `dashed?` (mặc định nét đứt), `route?` (`straight` | `hv` | `vh` = gấp khúc), `bend?` (độ cong px), `arrow?`.

**`do` trong beat** (áp dụng ở đầu nhịp): `show[]`, `hide[]`, `clear` (ẩn mọi thứ đang hiện), `highlight[]` (thay tập đang highlight;
`[]` = bỏ), `flow[]` (id edge có gói tin chạy trong nhịp này), `set{id:{...}}` (đổi thuộc tính vĩnh viễn: `color`, `label`, `fill`...),
`camera{x,y,zoom}` hoặc `camera{focus:"<node id>",zoom}` (pan/zoom mượt), `sfx` ở cấp beat để ghi đè âm thanh tự động.

**Cách viết**: một beat = một ý ngắn (~8–20 từ, 3–6 giây). Mỗi beat *phải thay đổi gì đó trên hình* (hiện, highlight, đổi màu, chạy).
Dùng một ví dụ cụ thể xuyên suốt. Đặt khớp các node trên lưới, tránh để đường nối cắt qua node khác.
Mặc định `meta.subtitles: false` (người kể chuyện, không phụ đề cả câu); góc phải trên luôn dành cho thẻ thương hiệu của kênh (không đặt nội dung ở đó).


---

# Cấu trúc bắt buộc của mọi video

| Thành phần | Do ai tạo | Ghi chú |
|---|---|---|
| **Intro kênh** (~4s) | Hệ thống, tự chèn đầu video | Chỉ có **icon + tên kênh + khẩu hiệu** (hiện từng chữ, từng từ, âm nhận diện, lời chào). Hết intro, icon và tên kênh **bay lên góc phải trên và ở lại suốt video**. Cấu hình ở `config.json → channel` (`name`, `tagline`, `intro_line`, `font`, `font_weight`) |
| **Tóm tắt / kết luận** | Kịch bản: beat (hoặc cảnh) có `"role": "summary"` | Ngay trước câu hỏi |
| **Câu hỏi mở** | Kịch bản: beat (hoặc cảnh) **cuối** có `"role": "question"` | Để người xem tự suy nghĩ, dẫn sang video sau |
| **Màn hình câu hỏi** (~5s) | Hệ thống, tự thêm cuối video | Chỉ có "**Câu hỏi dành cho bạn**" và câu hỏi (từ `meta.question`); **không** có video tiếp theo |
| **Outro** (~5s) | Hệ thống, tự thêm sau màn câu hỏi | Giọng đọc lời mời đăng ký, thẻ thương hiệu (icon + tên + khẩu hiệu) quay lại giữa màn hình, nút Đăng ký được bấm. Cấu hình `config.json → channel.outro_line` |

`meta` phải có: `question` (≤ 14 từ). Thiếu một trong các mục trên thì `./make-video check` báo lỗi ✗ và không render.
Chế độ demo (~30s) vẫn có intro nhưng không có màn hình câu hỏi và outro.
