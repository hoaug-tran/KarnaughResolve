# KarnaughResolve

**KarnaughResolve** là ứng dụng web hỗ trợ giải bảng Karnaugh (K-Map), tối thiểu hóa hàm Boolean, biến đổi biểu thức logic và dựng sơ đồ mạch số tương ứng.

Trải nghiệm trực tiếp tại: [https://karnaugh.libsys.me](https://karnaugh.libsys.me)

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Các chế độ hiển thị](#các-chế-độ-hiển-thị)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt và phát triển](#cài-đặt-và-phát-triển)
- [Thuật toán và xử lý logic](#thuật-toán-và-xử-lý-logic)
- [Đóng góp](#đóng-góp)
- [Bản quyền](#bản-quyền)

---

## Giới thiệu

**KarnaughResolve** được xây dựng nhằm hỗ trợ việc học, giảng dạy và kiểm tra các nội dung liên quan đến Đại số Boole, Kỹ thuật số, Thiết kế hệ thống số và mạch logic.

Thay vì chỉ đưa ra biểu thức rút gọn cuối cùng, ứng dụng mô phỏng tương đối đầy đủ quá trình giải một bài toán Karnaugh:

- Lập bảng chân trị.
- Biểu diễn dữ liệu trên bìa Karnaugh.
- Xác định và trực quan hóa các nhóm khoanh.
- Phân tích biến được giữ lại hoặc triệt tiêu trong từng nhóm.
- Xây dựng biểu thức Boolean tối thiểu.
- Biến đổi biểu thức bằng các định luật đại số Boole và De Morgan.
- Chuyển đổi mạch sang NAND hoặc NOR.
- Dựng sơ đồ mạch logic tương ứng.

Ứng dụng hướng tới cách trình bày gần với dạng bài tập và bài thi Kỹ thuật số thường gặp trong chương trình đại học.

---

## Tính năng chính

### 1. Hỗ trợ nhiều số lượng biến và dạng chuẩn

- Hỗ trợ bìa Karnaugh:
  - 2 biến: $A, B$
  - 3 biến: $A, B, C$
  - 4 biến: $A, B, C, D$

- Hỗ trợ hai dạng tối thiểu hóa:
  - **SOP (Sum of Products)**: Nhóm các ô có giá trị `1` để tìm biểu thức tổng của các tích.
  - **POS (Product of Sums)**: Nhóm các ô có giá trị `0` để tìm biểu thức tích của các tổng.

- Hỗ trợ **Don't-Care terms** (`d` hoặc `X`), cho phép đưa các ô tùy định vào nhóm khi cần nhằm tạo nhóm có kích thước lớn hơn và tối ưu biểu thức.

---

### 2. Nhiều phương thức nhập dữ liệu

#### Theo Minterm / Maxterm

Nhập danh sách chỉ số thập phân, phân tách bằng dấu phẩy hoặc khoảng trắng.

Ví dụ:

```text
1, 3, 5, 7, 9
```

#### Theo biểu thức Boolean

Hỗ trợ nhiều cách viết biểu thức quen thuộc:

```text
A'B + BC'D
!(A & B) + C
A*B + C
AB + C
```

Ứng dụng hỗ trợ các ký hiệu như:

- Dấu nháy đơn `'` cho phép phủ định.
- `!` cho phép phủ định.
- `&` hoặc `*` cho phép AND.
- `+` cho phép OR.
- Các biến viết liền nhau để biểu diễn phép AND.

#### Nhập trực tiếp trên bìa Karnaugh

Có thể nhấp vào từng ô để chuyển tuần hoàn giữa:

```text
0 → 1 → d → 0
```

Ngoài ra còn có thao tác nhanh để:

- Đặt toàn bộ ô về `0`.
- Đặt toàn bộ ô thành `1`.

---

### 3. Tự động xác định nhóm Karnaugh

Các hàng và cột được sắp xếp theo mã Gray:

```text
00 → 01 → 11 → 10
```

nhằm đảm bảo hai ô liền kề chỉ khác nhau đúng một bit.

Thuật toán hỗ trợ đầy đủ tính chất liên kết biên của bìa Karnaugh:

- Mép trái liên kết với mép phải.
- Mép trên liên kết với mép dưới.
- Các ô ở bốn góc có thể thuộc cùng một nhóm.
- Các nhóm có kích thước $1, 2, 4, 8, 16$ ô.

Ứng dụng tự động tìm các **Prime Implicant** và **Essential Prime Implicant**, sau đó lựa chọn tập nhóm phù hợp để tạo biểu thức Boolean tối giản.

---

### 4. Biến đổi đại số Boole từng bước

Từ biểu thức tối thiểu, KarnaughResolve có thể chuyển đổi sang nhiều dạng mạch khác nhau:

- AND / OR / NOT.
- NAND 2 đầu vào.
- NAND nhiều đầu vào.
- NOR 2 đầu vào.
- NOR nhiều đầu vào.

Quá trình biến đổi sử dụng các định luật Boolean cơ bản, bao gồm:

#### Bù kép

$$
A = \overline{\overline{A}}
$$

#### Định luật De Morgan

$$
\overline{A \cdot B} = \overline{A} + \overline{B}
$$

$$
\overline{A + B} = \overline{A} \cdot \overline{B}
$$

Các bước biến đổi được hiển thị theo thứ tự để người dùng có thể theo dõi cách biểu thức ban đầu được chuyển thành mạch NAND hoặc NOR tương đương.

---

### 5. Tự động dựng sơ đồ mạch logic

Ứng dụng sử dụng SVG để dựng sơ đồ mạch trực tiếp trên trình duyệt.

Sơ đồ hỗ trợ:

- Các tín hiệu đầu vào $A, B, C, D$.
- Các tín hiệu đảo:
  - $\overline{A}$
  - $\overline{B}$
  - $\overline{C}$
  - $\overline{D}$

- Các loại cổng:
  - AND
  - OR
  - NOT
  - NAND
  - NOR

- Tự động bố trí:
  - Cổng logic.
  - Đường tín hiệu.
  - Điểm nối.
  - Các đoạn rẽ của dây dẫn.
  - Khoảng cách giữa các tầng logic.

Trong chế độ chỉ sử dụng NAND hoặc NOR, phép NOT được biểu diễn bằng cách nối chung hai đầu vào của một cổng NAND/NOR tương ứng.

---

## Các chế độ hiển thị

Không gian làm việc được chia thành 5 chế độ chính.

### 1. Báo cáo bài thi

Hiển thị toàn bộ quá trình giải theo dạng bài Kỹ thuật số.

#### Câu a

- Lập bìa Karnaugh.
- Hiển thị các nhóm khoanh.
- Phân tích từng nhóm.
- Xác định biến giữ lại và biến bị triệt tiêu.
- Viết biểu thức tối thiểu.

#### Câu b

Dựng sơ đồ mạch sử dụng các cổng cơ bản:

- AND
- OR
- NOT

#### Câu c

- Trình bày các bước biến đổi đại số.
- Áp dụng bù kép và De Morgan.
- Dựng mạch tương đương chỉ sử dụng NAND hoặc NOR.

---

### 2. Bìa Karnaugh

Chế độ tập trung vào việc quan sát và tương tác trực tiếp với K-Map.

Bao gồm:

- Ma trận Karnaugh.
- Nhãn mã Gray.
- Các nhóm khoanh.
- Trạng thái `0`, `1`, `d`.
- Hiệu ứng làm nổi bật nhóm khi di chuột.

---

### 3. Mạch cổng cơ bản

Hiển thị sơ đồ logic của biểu thức tối thiểu bằng các cổng:

```text
AND / OR / NOT
```

---

### 4. Mạch cổng mục tiêu

Hiển thị mạch sau khi được chuyển đổi hoàn toàn sang:

```text
NAND
```

hoặc:

```text
NOR
```

tùy theo chế độ người dùng lựa chọn.

---

### 5. Bảng chân trị

Hiển thị toàn bộ $2^n$ tổ hợp đầu vào cùng giá trị đầu ra $Y$ tương ứng.

Bảng chân trị có thể được sử dụng để đối chiếu giữa:

- Biểu thức Boolean.
- Bìa Karnaugh.
- Biểu thức rút gọn.
- Mạch logic sau khi chuyển đổi.

---

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 8
- **Hiển thị công thức toán học**: KaTeX
- **Icon**: Lucide React
- **Linting**: Oxlint
- **Web Server**: Nginx Alpine
- **Container**: Docker
- **Public Access**: Cloudflare Zero Trust Tunnel

---

## Cấu trúc thư mục

```text
KarnaughResolve/
├── public/                         # Tài nguyên tĩnh và favicon
├── src/
│   ├── assets/                     # Hình ảnh và tài nguyên vector
│   │
│   ├── components/                 # Các React component
│   │   ├── CircuitViewer.tsx       # Hiển thị sơ đồ mạch SVG
│   │   ├── ExamReportView.tsx      # Báo cáo bài giải dạng Câu a, b, c
│   │   ├── FormattedMathText.tsx   # Hiển thị văn bản có công thức toán
│   │   ├── HelpModal.tsx           # Hướng dẫn sử dụng và lý thuyết
│   │   ├── InputPanel.tsx          # Nhập minterm, maxterm và biểu thức
│   │   ├── KMapGrid.tsx            # Bìa Karnaugh tương tác
│   │   ├── KaTeXView.tsx           # Render công thức bằng KaTeX
│   │   ├── Navbar.tsx              # Thanh điều hướng
│   │   ├── ProofViewer.tsx         # Hiển thị các bước biến đổi đại số
│   │   └── TruthTableView.tsx      # Hiển thị bảng chân trị
│   │
│   ├── types/                      # TypeScript type definitions
│   │
│   ├── utils/                      # Các thuật toán và logic cốt lõi
│   │   ├── algebraicTransformer.ts # Biến đổi Boolean và De Morgan
│   │   ├── circuitGenerator.ts     # Sinh sơ đồ và tọa độ mạch
│   │   └── kmapSolver.ts           # Giải và tối thiểu hóa Karnaugh
│   │
│   ├── App.css                     # Style của ứng dụng
│   ├── App.tsx                     # Component chính
│   ├── index.css                   # Style toàn cục
│   └── main.tsx                    # Entry point
│
├── .gitignore
├── .oxlintrc.json                  # Cấu hình Oxlint
├── index.html
├── LICENSE
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Cài đặt và phát triển

### Yêu cầu

- **Node.js**: 18.0.0 trở lên, khuyến nghị phiên bản LTS.
- **Package Manager**: `npm`, `pnpm` hoặc `yarn`.

### 1. Clone repository

```bash
git clone https://github.com/hoaug-tran/KarnaughResolve.git
cd KarnaughResolve
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Chạy môi trường development

```bash
npm run dev
```

Sau đó truy cập:

```text
http://localhost:5173
```

### 4. Kiểm tra mã nguồn

```bash
npm run lint
```

### 5. Build production

```bash
npm run build
```

Sau khi build hoàn tất, các tệp tĩnh được tạo trong:

```text
dist/
```

---

## Thuật toán và xử lý logic

### 1. Sinh ma trận Karnaugh

Ứng dụng ánh xạ chỉ số hàng và cột theo mã Gray để xác định chính xác vị trí của từng minterm/maxterm trên bìa.

Các kích thước được hỗ trợ:

```text
2 biến → 2 × 2
3 biến → 2 × 4
4 biến → 4 × 4
```

---

### 2. Tìm các nhóm Karnaugh

Thuật toán duyệt các khối hình chữ nhật có kích thước là lũy thừa của 2:

```text
1, 2, 4, 8, 16
```

Các nhóm có thể kéo dài qua biên của bảng do K-Map có tính chất liên kết vòng.

Thuật toán xét cả:

- Nhóm thông thường.
- Nhóm qua biên ngang.
- Nhóm qua biên dọc.
- Nhóm tại bốn góc.

---

### 3. Chọn tập nhóm phủ tối thiểu

Sau khi xác định các Prime Implicant, thuật toán tìm những **Essential Prime Implicant** chứa ít nhất một minterm chưa được nhóm nào khác bao phủ.

Các nhóm dư thừa sau đó được loại bỏ để tạo tập nhóm phủ phù hợp cho biểu thức tối giản.

---

### 4. Chuyển đổi sang NAND/NOR

Từ biểu thức SOP hoặc POS đã tối thiểu hóa, ứng dụng thực hiện các bước biến đổi đại số để tạo mạch tương đương.

Quá trình này bao gồm:

1. Bổ sung phép phủ định kép khi cần:

$$
F = \overline{\overline{F}}
$$

2. Áp dụng định luật De Morgan.

3. Chuyển các phép AND/OR thành cấu trúc NAND hoặc NOR tương ứng.

4. Với chế độ cổng **2 đầu vào**, các phép toán có nhiều hơn hai toán hạng được phân rã thành nhiều tầng cổng.

Kết quả cuối cùng là biểu thức và sơ đồ mạch chỉ sử dụng loại cổng đã được lựa chọn.

---

## Đóng góp

Mọi báo cáo lỗi, góp ý hoặc đề xuất tính năng đều được hoan nghênh.

### Quy trình đóng góp

1. Fork repository.

2. Tạo branch mới:

```bash
git checkout -b feature/tinh-nang-moi
```

3. Commit thay đổi:

```bash
git commit -m "feat: mo ta tinh nang"
```

4. Push branch:

```bash
git push origin feature/tinh-nang-moi
```

5. Tạo Pull Request để review và thảo luận thay đổi.

---

## Bản quyền

Dự án được phát hành theo giấy phép [MIT License](LICENSE).

Copyright © 2026 **Trần Kính Hoàng**.
