# Công thức dựng sơ đồ (recipes)

Mẫu chạy được nằm ở `templates/`: `before-after`, `pipeline`, `compare-two`, `client-server`, `layers`, `feedback-loop`, `timeline`, `tech-stack`, `data-pipeline`, `math-plot`. Chép sang `series/<series>/episodes/<NN-slug>/script.json` rồi thay chữ/icon/lời đọc.

| Mẫu | Dùng khi | Hình |
|---|---|---|
| `before-after.json` | Cách cũ chậm/tệ → cách mới nhanh/tốt (song song, cache, index, CDN...) | Nguồn nối 3 đích; đỏ + "chậm" → xanh + camera zoom |
| `pipeline.json` | Một luồng đi qua nhiều tầng (request, CI/CD, ETL, auth) | 5 icon nối nhau, sáng lên + gói tin chạy |
| `compare-two.json` | So sánh hai phương án A/B | Hai khung nét đứt, ưu/nhược điểm hiện dần |

## Bố cục lưới
`col` 1–7 → x = 160…1760 (cách 267px); `row` 1–5 → y = 190…870 (cách 170px). Số lẻ hợp lệ (`row: 1.75`).
**Biểu đồ toàn chiều rộng luôn căn giữa màn hình**: `col: 4`, `w: 1440`, `center: true` (từ tập 6; không có `center` thì khung vẽ lệch phải ~140 px vì `w` gồm cả lề nhãn trục). Bố cục hai cột (plot + bảng/số) không cần `center`.
- Cột 1 hàng 5: mascot. Cột 2: nguồn/đầu vào. Cột 6: các đích. Cột 4: giữa (tiêu đề, bộ điều phối, chú thích).
- Icon cao ~176px kể cả nhãn: giữ cách nhau ≥ 1.25 hàng. Không đặt node chồng lên đường nối.
- Khung `group` đặt tâm giữa nội dung và `w`,`h` đủ rộng; node bên trong chỉ cần nằm trong vùng.

## Nhịp kể chuyện (30–60s ≈ 6–9 beat)
1. Hook: đặt tình huống cụ thể (hiện nguồn + đích).
2. Vấn đề: đường nối đỏ, con số tệ, mascot `oops`.
3. Ý tưởng: node/mã mới xuất hiện, `highlight` để dẫn mắt, mascot `think`.
4. Kết quả: nối xanh, gói tin chạy, con số tốt, camera zoom, mascot `happy`.
5. Mở rộng / số lượng lớn: `clear` + `cells` hoặc sơ đồ mới.
6. **Kết (bắt buộc)**: `clear`, một beat `role: summary` (2–3 ý chính), rồi một beat `role: question`
   (câu hỏi mở, mascot `think`). Intro đầu video và màn hình kết cuối video do hệ thống tự thêm.

## Âm thanh tự động
`show`→pop · `highlight`→tick · `clear`/`camera`→whoosh · đổi màu đỏ→buzz · đổi màu khác→ding · đổi `expr`→boop.
Ghi đè trong beat: `"sfx": "ding"`, `"sfx": ["pop","ding"]` hoặc `"sfx": false`.

## Camera
`"camera": {"focus": "<node id>", "zoom": 1.4}` hoặc `{"x":1040,"y":540,"zoom":1.15}`; trả về `{"x":960,"y":540,"zoom":1}`.
Mascot và thẻ thương hiệu (góc phải trên) cố định trên màn hình, không bị camera kéo đi. Luôn có trôi zoom rất nhẹ để cảnh tĩnh không "đóng băng".

## Vai trò màu (theme spectrum)
| Vai trò | Màu | Ví dụ |
|---|---|---|
| Dữ liệu / đối tượng chính | `primary` (cyan) | các chấm dữ liệu, server, người dùng |
| Mô hình / kết quả đúng | `green` | đường tốt nhất, trạng thái thành công |
| Sai số / lỗi / phương án tệ | `red` | khoảng cách sai số, đường ngang |
| Điểm nhấn / con số then chốt | `accent` (vàng) | số cần để ý, highlight |
| Công thức / khái niệm | `purple` | phương trình, đường trung bình |
| Phụ / so sánh | `orange`, `pink`, `blue` | phương án thử, nhãn trục |
Mỗi sơ đồ dùng ít nhất 3 màu; chữ nền luôn trắng. Tránh dùng một màu cho mọi thứ.


## Công thức + biểu đồ (hồi quy, hàm mất mát, phân phối...)
Nhịp dựng gợi ý: (1) `show` biểu đồ rỗng-ish với `step: 1` (chỉ điểm dữ liệu, `label` "Dữ liệu"), (2) `set step: 2` vẽ đường mô hình +
`show` công thức `equation` (màu `purple`), (3) `set step: 3` hiện sai số bằng `segments` màu `red`, `highlight` công thức hàm mất mát,
(4) `set` đổi tham số (đổi `fn` của series qua `set` trên node `plot` với `series` mới) để cho thấy đường thay đổi.
Đặt công thức bên trái (col 1–3), biểu đồ bên phải (col 4–7); mascot `col:1,row:5`. Mỗi beat chỉ làm hiện/đổi MỘT thứ.


## Dùng hình màu (đa dạng, giống ảnh gốc)
- Mỗi sơ đồ nên có ít nhất 3–4 icon **khác bộ/khác màu**: logo thật (`img:logos/...`) cho công nghệ cụ thể, `img:fluent-color/...` cho khái niệm
  (cơ sở dữ liệu, đám mây, người dùng), `img:fluent-emoji-flat/...` cho ý "con người"/cảm xúc/ẩn dụ (bóng đèn, tên lửa, não, kính lúp).
- Đừng dùng cùng một icon cho hai khái niệm khác nhau trong một sơ đồ; đừng trộn quá 3 bộ trong một cảnh (khó đọc).
- Tìm icon trước khi viết: `./make-video assets search <từ khóa>`; chưa có thì `assets add`.


## Quy tắc "dày hình" (người xem ưu tiên nhìn hơn nghe)
- **Mỗi beat đổi ít nhất một thứ trên hình**, và cứ 2–3 beat phải có một thứ "có số": `stat` đếm lên, `table`, `plot` thêm series, `cells`.
  Một beat chỉ chữ (không đổi gì) là lỗi thiết kế.
- **Mỗi "màn" có ít nhất một hình dữ liệu** (biểu đồ hoặc bảng), không chỉ chữ/icon. Khái niệm trừu tượng phải có ví dụ số cụ thể trên hình.
- **Số liệu phải thật**: tạo dữ liệu minh họa bằng mã (hạt giống cố định), rồi **tính mọi con số hiện trên hình và đọc trong lời** từ chính dữ liệu đó
  (hệ số, sai số, RSS, MSE...). Không gõ tay số "cho đẹp". Lời đọc dùng f-string với số đã tính để hình và lời luôn khớp.
- Dùng `step` của `plot`/`table` để dựng dần, `set {value, from}` của `stat` để số chạy, `camera` focus (zoom ≤ 1.15 để không cắt chữ) ở 1–2 điểm nhấn mỗi màn.
- Ưu tiên chuỗi "hiện → so sánh → số thay đổi": ví dụ 3 đường thẳng thử với RSS giảm dần; mô hình bậc 1, 2, 9 với MSE huấn luyện vs kiểm tra.
- Kiểm tra bằng hình thật trước khi trình bày: dựng vài khung hình (Remotion `still`) ở các beat dày nhất; lỗi hay gặp là chữ/số tràn mép phải
  (x > 1880), nhãn dài đè biểu đồ, camera zoom cắt công thức.


## Bố cục sạch: không đè chữ, không cắt (bắt buộc)
- **Bot** nằm góc dưới trái, rất sát đáy: `{"id":"bit","type":"mascot","x":150,"y":985,"size":150}` (không dùng `col/row`).
  Nội dung dùng được tới khoảng y ≈ 870 (hàng 4,9). Bong bóng bot nằm phía trên bot, đừng đặt chữ ngay sát đó.
- **Không dùng camera zoom/pan** (focus) trừ khi nội dung nằm hẳn ở giữa: zoom làm chữ ở mép bị cắt và đè lên nhau.
- **Năm trên dòng thời gian**: chỉ hiện số năm (`stat` với `group:false`, không `label`), đặt thấp hơn hàng icon (hàng ~4,5), không đè nhãn icon.
- **Bảng** (`table`): đặt `colws:[...]` cho từng cột; chữ trong ô tự co nhưng vẫn nên ngắn (< ~40 ký tự). Khung bảng chỉ cao bằng số hàng đang hiện.
- **Biểu đồ cột**: đặt `xticks:[1,2,3]` để trục không hiện 0,5 / 1,5. Chú giải (legend) tự nằm phía trên biểu đồ, không đè dữ liệu.
- Chữ nhãn trong khung `group` phải nằm hẳn trong khung (đừng để chạm viền); nhãn dài thì rút gọn hoặc giảm `size`.
- **Luôn chạy `./make-video lint series/<s>/episodes/<ep> --png`** trước khi trình bày: đo hộp thật của từng phần tử ở mọi beat và báo
  chữ đè chữ, chữ cắt viền khung, chữ tràn mép, chữ ở góc logo. Phải ra "0 vấn đề", rồi xem ảnh trong `out/review/<ep>/`.
