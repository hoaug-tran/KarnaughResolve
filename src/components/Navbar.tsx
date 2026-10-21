import React from 'react'
import { HelpCircle, Moon, Printer, Sun } from 'lucide-react'

interface NavbarProps {
  currentProblem: 'cau_1' | 'cau_2'
  onProblemChange: (problem: 'cau_1' | 'cau_2') => void
  activeTab: string
  onTabChange: (tab: any) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onOpenHelp: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProblem,
  onProblemChange,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenHelp
}) => {
  return (
    <header className="navbar-container no-print">
      <div className="navbar-content">
        <div className="navbar-brand-row">
          <div className="brand-group">
            <span className="brand-title">KarnaughResolve</span>
          </div>

          <div className="nav-right-actions mobile-only-actions">
            <button
              type="button"
              className="action-icon-btn"
              onClick={onOpenHelp}
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => window.print()}
              title="In / Lưu PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="problem-segmented-control">
          <button
            type="button"
            className={`problem-nav-btn ${currentProblem === 'cau_1' ? 'active' : ''}`}
            onClick={() => {
              onProblemChange('cau_1')
              onTabChange('report')
            }}
          >
            <span className="problem-btn-full">Câu 1: Rút gọn Boolean</span>
            <span className="problem-btn-short">Câu 1: Rút gọn</span>
          </button>
          <button
            type="button"
            className={`problem-nav-btn ${currentProblem === 'cau_2' ? 'active' : ''}`}
            onClick={() => {
              onProblemChange('cau_2')
              onTabChange('report')
            }}
          >
            <span className="problem-btn-full">Câu 2: Mạch tổ hợp</span>
            <span className="problem-btn-short">Câu 2: Mạch tổ hợp</span>
          </button>
        </div>

        <nav className="nav-tabs-wrapper">
          {currentProblem === 'cau_1' ? (
            <>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => onTabChange('report')}
              >
                Bài Thi (a, b, c)
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'kmap' ? 'active' : ''}`}
                onClick={() => onTabChange('kmap')}
              >
                Bìa K-Map
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'circuit_basic' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_basic')}
              >
                Cổng Cơ Bản
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'circuit_target' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_target')}
              >
                Cổng Biến Đổi
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'truthtable' ? 'active' : ''}`}
                onClick={() => onTabChange('truthtable')}
              >
                Bảng Chân Lý
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => onTabChange('report')}
              >
                Bài Thi Trọn Vẹn
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'truthtable' ? 'active' : ''}`}
                onClick={() => onTabChange('truthtable')}
              >
                Bảng Trạng Thái
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'kmap' ? 'active' : ''}`}
                onClick={() => onTabChange('kmap')}
              >
                Bìa Karnaugh
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === 'circuit_basic' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_basic')}
              >
                Sơ Đồ Mạch
              </button>
            </>
          )}
        </nav>

        <div className="nav-right-actions desktop-only-actions">
          <button
            type="button"
            className="action-icon-btn"
            onClick={onOpenHelp}
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => window.print()}
            title="In / Lưu PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="action-icon-btn"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  )
}
