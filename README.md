# KarnaughResolve

Ứng dụng trực tuyến chuyên sâu hỗ trợ giải bảng Karnaugh (K-Map), tối thiểu hóa hàm đại số Boole, tự động biến đổi đại số logic và mô phỏng sơ đồ mạch số chuẩn xác.

Trải nghiệm trực tiếp tại: [https://karnaugh.libsys.me](https://karnaugh.libsys.me)

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Các chế độ hiển thị](#các-chế-độ-hiển-thị)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt và phát triển](#hướng-dẫn-cài-đặt-và-phát-triển)
- [Thuật toán và xử lý logic](#thuật-toán-và-xử-lý-logic)
- [Đóng góp](#đóng-góp)
- [Bản quyền](#bản-quyền)

---

## Giới thiệu

**KarnaughResolve** được thiết kế nhằm phục vụ nhu cầu học tập, nghiên cứu và giảng dạy các môn học như Kỹ thuật số, Thiết kế hệ thống số, Cấu trúc máy tính và Đại số Boole trong các trường đại học chuyên ngành Kỹ thuật Điện - Điện tử, Công nghệ Thông tin và Kỹ thuật Máy tính.

Khác với các công cụ đơn giản chỉ đưa ra kết quả cuối cùng, KarnaughResolve tập trung vào việc mô phỏng đầy đủ quy trình giải một bài tập thiết kế mạch logic theo chuẩn đề thi đại học: từ khâu lập bảng chân trị, vẽ bìa Karnaugh, xác định các nhóm khoanh tối ưu, giải thích các biến được giữ lại hay triệt tiêu, cho đến các bước biến đổi đại số sử dụng định luật De Morgan và tự động vẽ sơ đồ mạch logic hoàn chỉnh.

---

## Tính năng chính

### 1. Đa dạng số lượng biến và dạng chuẩn
- Hỗ trợ bìa Karnaugh 2 biến ($A, B$), 3 biến ($A, B, C$) và 4 biến ($A, B, C, D$).
- Hỗ trợ 2 dạng tối thiểu hóa chuẩn:
  - **SOP (Sum of Products)**: Rút gọn các nhóm chứa ô có giá trị `1` (kết hợp các ô tùy định).
  - **POS (Product of Sums)**: Rút gọn các nhóm chứa ô có giá trị `0` (kết hợp các ô tùy định).
- Hỗ trợ đầy đủ điều kiện tùy định (**Don't-Care terms** ký hiệu là `d` hoặc `X`), giúp mở rộng nhóm khoanh nhằm đạt kích thước tối đa $2^k$.

### 2. Phương thức nhập liệu linh hoạt
- **Theo chỉ số Minterms / Maxterms**: Nhập danh sách chỉ số thập phân cách nhau bởi dấu phẩy hoặc khoảng trắng (ví dụ: `1, 3, 5, 7, 9`).
- **Theo biểu thức Boolean (Expression)**: Hỗ trợ cú pháp biểu thức quen thuộc như `A'B + BC'D`, `!(A & B) + C`, dấu nháy đơn `'`, dấu chấm `*` hoặc viết liền nhau.
- **Tương tác trực quan trên bảng Karnaugh**: Người dùng có thể click chuột trực tiếp vào từng ô trên bìa để chuyển đổi tuần hoàn trạng thái `0` $\rightarrow$ `1` $\rightarrow$ `d`.
- **Thao tác nhanh**: Hỗ trợ nút xóa toàn bộ về `0` hoặc thiết lập toàn bộ thành `1` chỉ với một thao tác.

### 3. Thuật toán khoanh nhóm tối ưu
- Sắp xếp thứ tự các hàng và cột theo chuẩn mã Gray ($00, 01, 11, 10$) đảm bảo hai ô kề nhau chỉ khác nhau đúng 1 bit.
- Xử lý hoàn chỉnh tính chất cuộn biên (hình xuyến - torus): các ô ở mép trên liên kết với mép dưới, mép trái liên kết với mép phải, và 4 góc của bảng 4 biến liên kết tạo thành nhóm 4 ô.
- Thuật toán tự động tìm kiếm các nhóm phủ nguyên tố cốt yếu (Essential Prime Implicants) để đưa ra hàm tối thiểu có ít tích nhất và ít biến nhất.

### 4. Biến đổi đại số Boole từng bước
- Tự động diễn giải quá trình chuyển đổi biểu thức tối thiểu sang các họ cổng chuyên dụng:
  - Cổng logic cơ bản (**AND, OR, NOT**)
  - Cổng **NAND 2 đầu vào**
  - Cổng **NAND N đầu vào**
  - Cổng **NOR 2 đầu vào**
  - Cổng **NOR N đầu vào**
- Áp dụng chuẩn xác các tiên đề và định luật Boole: định luật bù kép (hoàn nguyên $A = \overline{\overline{A}}$), định luật De Morgan ($\overline{A \cdot B} = \overline{A} + \overline{B}$ và $\overline{A + B} = \overline{A} \cdot \overline{B}$).

### 5. Dựng sơ đồ mạch số tự động (SVG Circuit Diagram)
- Bộ sinh sơ đồ vector SVG tương tác trực tiếp với độ nét cao.
- Hiển thị hệ thống thanh dẫn (bus rails) tín hiệu đầu vào $A, B, C, D$ cùng các tín hiệu bù $\overline{A}, \overline{B}, \overline{C}, \overline{D}$.
- Vẽ chuẩn các ký hiệu cổng logic theo tiêu chuẩn quốc tế: AND, OR, NOT, NAND, NOR.
- Tự động căn chỉnh khoảng cách, điểm nối tín hiệu (junction tap) và các điểm uốn dây dẫn.
- Đối với mạch NAND/NOR, cổng NOT được chuyển đổi chính xác bằng cách chập 2 đầu vào của cổng NAND/NOR lại với nhau.

---

## Các chế độ hiển thị

Ứng dụng chia không gian làm việc thành 5 tab chuyên biệt:

1. **Báo cáo bài thi (Exam Report View)**:
   - Trình bày toàn bộ bài giải theo đúng format đề thi học phần Kỹ thuật số:
     - **Câu a**: Lập bảng Karnaugh, vẽ các vòng khoanh màu sắc nổi bật, phân tích chi tiết từng nhóm (biến giữ lại, biến triệt tiêu) và viết hàm tối thiểu.
     - **Câu b**: Vẽ sơ đồ mạch logic sử dụng các cổng cơ bản AND, OR, NOT.
     - **Câu c**: Trình bày từng bước biến đổi đại số Boole và vẽ sơ đồ mạch chỉ dùng cổng NAND hoặc NOR theo yêu cầu.
2. **Bìa Karnaugh (K-Map Grid)**:
   - Tập trung vào tương tác trực tiếp với ma trận ô, xem nhãn mã Gray, xem các nhóm khoanh và rê chuột để làm nổi bật nhóm tương ứng.
3. **Mạch cổng cơ bản (Basic Circuit)**:
   - Xem chi tiết sơ đồ mạch logic chuẩn hóa của hàm rút gọn.
4. **Mạch cổng mục tiêu (Target Gate Circuit)**:
   - Xem sơ đồ mạch đã chuyển đổi hoàn toàn sang cổng NAND hoặc NOR.
5. **Bảng chân trị (Truth Table)**:
   - Hiển thị toàn bộ $2^n$ tổ hợp ngõ vào cùng ngõ ra tương ứng $Y$, hỗ trợ đối chiếu và kiểm tra tính đúng đắn.

---

## Công nghệ sử dụng

- **Giao diện & Thành phần**: React 19, TypeScript
- **Công cụ đóng gói**: Vite 8
- **Biểu diễn công thức toán học**: KaTeX
- **Biểu tượng giao diện**: Lucide React
- **Kiểm tra mã nguồn**: Oxlint
- **Triển khai máy chủ**: Nginx (Alpine), Docker, Cloudflare Zero Trust Tunnel

---

## Cấu trúc thư mục

```text
KarnaughResolve/
├── public/                     # Tệp tĩnh và favicon
├── src/
│   ├── assets/                 # Hình ảnh và biểu tượng vector
│   ├── components/             # Các thành phần giao diện React
│   │   ├── CircuitViewer.tsx   # Bộ hiển thị sơ đồ mạch logic SVG
│   │   ├── ExamReportView.tsx  # Chế độ xem báo cáo chuẩn bài thi (Câu a, b, c)
│   │   ├── FormattedMathText.tsx # Hiển thị văn bản công thức toán học
│   │   ├── HelpModal.tsx       # Cửa sổ hướng dẫn lý thuyết và cách dùng
│   │   ├── InputPanel.tsx      # Bảng điều khiển nhập minterm/maxterm/biểu thức
│   │   ├── KMapGrid.tsx        # Ma trận bìa Karnaugh trực quan
│   │   ├── KaTeXView.tsx       # Thành phần render công thức KaTeX
│   │   ├── Navbar.tsx          # Thanh điều hướng và nút chức năng
│   │   ├── ProofViewer.tsx     # Bảng hiển thị các bước biến đổi đại số
│   │   └── TruthTableView.tsx  # Bảng chân trị 2^n trạng thái
│   ├── types/                  # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/                  # Thư viện thuật toán cốt lõi
│   │   ├── algebraicTransformer.ts # Biến đổi đại số De Morgan và cổng logic
│   │   ├── circuitGenerator.ts     # Tính toán tọa độ và vẽ mạch logic
│   │   └── kmapSolver.ts           # Thuật toán giải và tối thiểu hóa K-Map
│   ├── App.css                 # Phong cách giao diện ứng dụng
│   ├── App.tsx                 # Thành phần chính tích hợp luồng trạng thái
│   ├── index.css               # Phong cách nền tảng toàn cục
│   └── main.tsx                # Điểm khởi động ứng dụng
├── .gitignore                  # Cấu hình loại trừ Git
├── .oxlintrc.json              # Cấu hình bộ linter Oxlint
├── index.html                  # Khung HTML gốc
├── LICENSE                     # Bản quyền phần mềm MIT
├── package.json                # Danh sách thư viện phụ thuộc và script
├── tsconfig.json               # Cấu hình trình biên dịch TypeScript
└── vite.config.ts              # Cấu hình Vite bundler
```

---

## Hướng dẫn cài đặt và phát triển

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.0.0 trở lên (khuyến nghị phiên bản LTS).
- **Trình quản lý gói**: `npm` hoặc `pnpm` / `yarn`.

### Các bước cài đặt

1. Sao chép kho mã nguồn về máy:
   ```bash
   git clone https://github.com/hoaug-tran/KarnaughResolve.git
   cd KarnaughResolve
   ```

2. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```

3. Khởi chạy máy chủ phát triển cục bộ:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ `http://localhost:5173` để bắt đầu trải nghiệm.

4. Kiểm tra mã nguồn với linter:
   ```bash
   npm run lint
   ```

5. Đóng gói sản phẩm cho môi trường production:
   ```bash
   npm run build
   ```
   Toàn bộ bản build tĩnh tối ưu sẽ được tạo trong thư mục `dist/`.

---

## Thuật toán và xử lý logic

1. **Sinh ma trận bìa Karnaugh**:
   Chuyển đổi chỉ số hàng và cột từ mã Gray thành nhị phân để truy vấn chính xác ô dữ liệu, hỗ trợ hiển thị 2 biến ($2 \times 2$), 3 biến ($2 \times 4$) và 4 biến ($4 \times 4$).

2. **Tìm kiếm nhóm khoanh**:
   Duyệt qua tất cả các khối hình chữ nhật có kích thước $2^a \times 2^b$ (1, 2, 4, 8, 16 ô), tính đến tính chất cuộn vòng ở các cạnh biên và góc.

3. **Lọc nhóm phủ tối thiểu**:
   Phân loại nhóm nguyên tố cốt yếu chứa ít nhất một ô trạng thái mà không nhóm nào khác bao phủ, kết hợp giải thuật bao phủ để loại bỏ các nhóm dư thừa.

4. **Biến đổi cổng tương đương**:
   Từ dạng SOP/POS tối thiểu, giải thuật tự động phủ 2 lần gạch ngang (định luật bù kép), sau đó áp dụng De Morgan để chuyển đổi các phép AND/OR thành toàn bộ cổng NAND hoặc NOR, đồng thời chia nhỏ các cổng có số lượng đầu vào vượt quá ngưỡng cho phép (đối với chế độ 2 đầu vào).

---

## Đóng góp

Mọi ý kiến đóng góp, báo cáo lỗi hoặc đề xuất tính năng mới đều được hoan nghênh:
1. Fork kho mã nguồn này.
2. Tạo nhánh tính năng mới (`git checkout -b feature/tinh-nang-moi`).
3. Commit các thay đổi (`git commit -m "feat: mo ta tinh nang"`).
4. Đẩy lên nhánh của bạn (`git push origin feature/tinh-nang-moi`).
5. Tạo một Pull Request trên GitHub để thảo luận.

---

## Bản quyền

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).

Bản quyền (c) 2026 **Trần Kính Hoàng**. Toàn quyền sử dụng, sửa đổi và phân phối theo các điều khoản của giấy phép MIT.
