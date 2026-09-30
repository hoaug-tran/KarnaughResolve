import React from 'react'
import { BookOpen, Check, X } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="modal-title">Tài Liệu Hướng Dẫn & Quy Chuẩn Khoa Học</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h4 className="section-title">1. Quy ước biểu diễn chuẩn</h4>
            <ul className="modal-list">
              <li>
                <strong>Dạng Chuẩn tắc Tuyển (SOP):</strong> Viết dưới dạng tổng của các tích (∑). Trên bìa Karnaugh, điền số <strong>1</strong> vào các ô minterm và <strong>X</strong> vào các ô tùy định (d). Biến bằng 1 viết nguyên biến, biến bằng 0 viết gạch ngang trên đầu.
              </li>
              <li>
                <strong>Dạng Chuẩn tắc Hội (POS):</strong> Viết dưới dạng tích của các tổng (∏). Trên bìa Karnaugh, điền số <strong>0</strong> vào các ô maxterm và <strong>X</strong> vào các ô tùy định (D/N). Biến bằng 0 viết nguyên biến, biến bằng 1 viết gạch ngang trên đầu.
              </li>
              <li>
                <strong>Thứ tự mã Gray:</strong> Cột và hàng được sắp xếp theo chuỗi 00, 01, 11, 10 đảm bảo hai ô kề nhau hoặc đối xứng biên chỉ khác nhau đúng 1 biến số.
              </li>
            </ul>
          </section>

          <section className="modal-section">
            <h4 className="section-title">2. Phương pháp biến đổi gạch ngang đại số Boole (Câu c)</h4>
            <p className="modal-text">
              Hệ thống áp dụng định luật hoàn nguyên (phủ định kép toàn phần) và định luật De Morgan, biểu diễn từng tầng gạch ngang trên đầu không dùng phương pháp thế:
            </p>
            <ul className="modal-list">
              <li>
                <strong>Chuyển sang NAND:</strong> Lấy phủ định 2 lần toàn bộ biểu thức tuyển, sau đó áp dụng De Morgan cho dấu gạch phía dưới để chuyển các phép cộng thành tích các thừa số NAND. Với cổng NAND 2 đầu vào, các tích 3 hoặc 4 biến được phân rã thành cặp 2 đầu vào nối tiếp với cổng NAND đảo (chập 2 chân vào).
              </li>
              <li>
                <strong>Chuyển sang NOR:</strong> Lấy phủ định 2 lần toàn phần, áp dụng De Morgan cho từng số hạng tích để chuyển thành dạng đảo tổng (NOR). Các tầng gom OR được chuyển thành cây NOR 2 đầu vào.
              </li>
            </ul>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <Check className="w-4 h-4" />
            <span>Đã hiểu</span>
          </button>
        </div>
      </div>
    </div>
  )
}
