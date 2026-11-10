import React, {useEffect,useRef} from 'react'
import { BookOpen, Check, X } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const dialogRef=useRef<HTMLDialogElement>(null)
  useEffect(()=>{if(isOpen&&!dialogRef.current?.open)dialogRef.current?.showModal()},[isOpen])
  if (!isOpen) return null

  return (
    <dialog ref={dialogRef} className="modal-backdrop" aria-labelledby="help-title" onCancel={onClose} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 id="help-title" className="modal-title">Tài Liệu Hướng Dẫn & Quy Chuẩn Khoa Học</h3>
          </div>
          <button type="button" className="modal-close-btn" aria-label="Đóng hướng dẫn" onClick={onClose}>
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
              Chọn vị trí phủ định kép theo dạng biểu thức và loại cổng, rồi áp dụng De Morgan:
            </p>
            <ul className="modal-list">
              <li>
                <strong>SOP → NAND, POS → NOR:</strong> Phủ định kép toàn biểu thức, rồi áp dụng De Morgan cho dấu phủ định bên trong.
              </li>
              <li>
                <strong>POS → NAND, SOP → NOR:</strong> Phủ định kép từng tổng/tích, biến đổi từng thành phần bằng De Morgan và giữ phép nối bên ngoài.
              </li>
              <li>
                <strong>Cổng 2 đầu vào:</strong> Gom từng cặp và thêm phủ định kép để giữ nguyên giá trị; không ghép NAND/NOR như phép toán có tính kết hợp. Cổng đảo thực hiện bằng NAND/NOR chập hai đầu vào.
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
    </dialog>
  )
}
