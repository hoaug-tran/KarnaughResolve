# Đối chiếu tài liệu Kỹ thuật điện tử số

Nguồn: thư mục `Subjects/Kỹ thuật điện tử số` do người dùng cung cấp. Số trang dưới đây là trang PDF, tính từ 1. Kiểm tra này giới hạn các dạng bài thi/ôn tập Câu 1–3; không tuyên bố mô phỏng toàn bộ mọi mạch trong các slide.

| Dạng | Nguồn | Trên web / kiểm tra |
|---|---|---|
| Rút gọn SOP/POS, tùy định X | Đề 15–20, trang 1–6; Bài tập ôn tập trang 1–2; Đề cương trang 1 | Câu 1; kiểm tra bảng chân lý, phủ tối thiểu, nhóm lớn trước |
| Cổng cơ bản, NAND/NOR 2 đầu vào và nhiều đầu vào | Đề trang 1–6; các bước đại số bản chữa trang 8, 10–11, 13, 17 | Câu 1; kiểm tra từng bước đại số và tính đầu ra trực tiếp từ đồ thị cổng |
| Mạch một đầu ra theo điều kiện | Đề 18 trang 4; Ôn tập 2_3 trang 3; Đề cương C5 trang 1; BT chương 1,2 trang 2 | Câu 2: chia hết cho 2/3/5, đếm bit, parity; xét đầy đủ 0–15 trừ khi người dùng chọn X |
| 4 ghế, ít nhất hai ghế kề nhau có người | Điều kiện người dùng xác nhận trong chat, không có trong PDF | Câu 2; F=AB+BC+CD; A và D không kề nhau; đủ 16 tổ hợp |
| Nhị phân ↔ 5211; dư 3 → 5211 | Đề 17 trang 3; bản chữa trang 8; Đề cương C4 trang 1 | Mẫu bảng chuyển mã; mã ngoài bảng gán X |
| 5211 → mã vòng dư 3 | Đề 20 trang 6; Ôn tập 2_2 trang 2–3 | Mẫu chép đúng 10 cặp từ mã, không suy diễn từ tên mã |
| Mã A → mã B tùy ý | Ôn tập 2_1 trang 2 | Mẫu 10 cặp từ mã; thêm bảng tùy chỉnh |
| Nhị phân → mã vòng dư 3 / Gray / 2421 | BT chương 1,2 trang 2; slide mạch tổ hợp 4–5 | Các mẫu có sẵn; Gray đầy đủ 16 tổ hợp và BCD 10 tổ hợp |
| LED 7 thanh, Anot/Cathode, chọn thanh a–g | Đề 15/16/19 trang 1/2/5; Ôn tập 2_4–2_6 trang 3–4; Đề cương C6 trang 2 | Chọn cực tính và thanh; đối chiếu glyph trên hình PDF, kể cả °; mẫu 789AbCdEF có cả hai cực tính |
| Bộ đếm đồng bộ tiến/lùi | Đề 16/17/18/20 trang 2/3/4/6; Ôn tập 3_1–3_2 trang 4; Đề cương trang 2 | Câu 3; modul M có M trạng thái 0…M−1; bảng chỉ hiển thị một hàng thừa đầu tiên theo yêu cầu người dùng |
| Bộ đếm theo dãy tùy ý | Đề 15/19 trang 1/5; Ôn tập 3_5–3_6 trang 5; Đề cương C9 trang 2 | Câu 3, Dãy trạng thái; giữ đúng thứ tự nhập; kiểm tra toàn chu kỳ |
| Dạng Z1, Z2 (RS/JK) | Ôn tập 3_3–3_4 trang 4–5; slide bộ đếm đồng bộ | Câu 3, Giản đồ Z1,Z2; thêm bit phân biệt khi cặp đầu ra lặp |

## Mâu thuẫn trong tài liệu cần giữ tách biệt

- Đề 15, trang 1: `Y = Σ(3,5,6,9,12,14) + d(1,4,11)`, nên Y(3)=1. Phần đáp án mang số 15, trang 8, khoanh nhóm 0 `(3,7,11,15)` và cho POS `(C̄+D̄)(B̄+D̄)(B+C+D)`, nên Y(3)=0. Hai dữ liệu không thể dùng chung một kết quả.
- Đề 15 Câu 2 trang 1 là LED; đáp án mang số 15 trang 8 lại giải chuyển mã 5211 → nhị phân. Đề 17 Câu 2 trang 3 là nhị phân → 5211; phần đáp án mang số 17 trang 14–15 lại giải LED. Không dùng số đề làm khóa ghép dữ liệu tự động.
- Trang 17 có nhóm ghi `(1,5,11,13)` nhưng biểu thức `C̄D` ứng với `(1,5,9,13)`. Nhóm có chỉ số 11 giữ cả C=0 và C=1 nên không thể suy ra `C̄D`. Bộ giải dùng giá trị ô thực tế để giữ đúng hàm.
- Các biểu thức tối thiểu có thể khác cách chọn X hoặc thứ tự nhóm nhưng vẫn tương đương. Kiểm tra đủ các ô xác định thay vì ép chuỗi công thức giống hệt.

## Lệnh kiểm tra

- `node tests/expression.test.mjs`: nhập biểu thức, hằng số, đảo, ngoặc và dữ liệu sai.
- `node tests/algebraic.test.mjs`: 288 phép chuyển SOP/POS → NAND/NOR; mọi bước đúng trên 16 tổ hợp; loại cổng và số đầu vào đúng.
- `node tests/circuit.test.mjs`: 3.990 mạch, tính từ các đầu vào cổng trên đủ tổ hợp cho 2–4 biến; cổng không chồng và dây không xuyên thân cổng; mạch nhiều đầu ra và hằng POS/SOP.
- `node tests/sequential.test.mjs`: sáu đề Câu 1 đều 4,4,2 theo dạng đề; 480 cấu hình đếm; đối chiếu phủ tối ưu độc lập; bảng/FF xuất HTML.
- `node tests/course.test.mjs`: bảng mã, glyph LED/cực tính, chu kỳ đề, ghế và chia hết.

Không cam kết “khớp 100%” giữa những trang nguồn tự mâu thuẫn. Kết quả web được xác nhận bằng bảng chân lý và điều kiện bài nhập; hình thức biến đổi theo phương pháp trong bản chữa.

## Kiểm tra bổ sung trước triển khai

- `npm run test:exhaustive`: toàn bộ 65.536 hàm Boolean bốn biến, cả SOP/POS. So sánh giá trị hàm và số nhóm/literal với quy hoạch động trên hợp các cube độc lập, có cho phép chồng nhóm.
- Các bộ kiểm tra chạy được trên Node 22 (cùng dòng với Docker) và Node 24.
- Bài mẫu: 17 bộ dữ liệu Câu 1 và 14 bộ dữ liệu Câu 3, gồm cả hai bảng Z1/Z2 của Ôn tập 3_3–3_4.
- Kiểm tra nhập số âm, chỉ số vượt số biến, biểu thức sai/không đầy đủ, ký tự LED không hỗ trợ; giữ kết quả hợp lệ khi nhập sai.
- Bìa xem kết quả không báo có thể sửa ô. Bìa nhập và bảng đầu ra hỗ trợ Enter/Space; hộp hướng dẫn dùng dialog có quản lý focus và Escape của trình duyệt.
- Docker kiểm thử trước build; npm lockfile dùng thống nhất; kiểm tra sức khỏe và cache tài nguyên tĩnh được định nghĩa trong Dockerfile.

- Bản chữa trang 9 có dãy riêng `1,3,4,7,9,12,13`; đã thêm mẫu độc lập, không ghép với đề 15 trang 1 có dãy khác.
