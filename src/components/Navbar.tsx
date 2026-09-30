import React from 'react'
import { Moon, Printer, Sun } from 'lucide-react'

interface NavbarProps {
  activeTab: 'report' | 'kmap' | 'circuit_basic' | 'circuit_target' | 'truthtable'
  onTabChange: (tab: 'report' | 'kmap' | 'circuit_basic' | 'circuit_target' | 'truthtable') => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onOpenHelp: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="navbar-container no-print">
      <div className="navbar-content">
        <div className="brand-group">
          <span className="brand-title">KarnaughResolve</span>
        </div>

        <nav className="nav-tabs-wrapper">
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
        </nav>

        <div className="nav-right-actions">
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
