import React, { useEffect, useState } from 'react'
import type { CellValue, OptimizationForm, TargetGateType, VariableCount } from '../types'
import { parseNumberList } from '../utils/kmapSolver'
import { CheckCheck, RotateCcw } from 'lucide-react'

interface InputPanelProps {
  variableCount: VariableCount
  form: OptimizationForm
  targetGateType: TargetGateType
  gridValues: Record<number, CellValue>
  onVariableCountChange: (count: VariableCount) => void
  onFormChange: (form: OptimizationForm) => void
  onTargetGateChange: (gate: TargetGateType) => void
  onApplyMinterms: (terms: number[], dontCares: number[]) => void
  onApplyExpression: (expr: string) => void
  onClear: () => void
  onSetAll: (val: CellValue) => void
}

export const InputPanel: React.FC<InputPanelProps> = ({
  variableCount,
  form,
  targetGateType,
  gridValues,
  onVariableCountChange,
  onFormChange,
  onTargetGateChange,
  onApplyMinterms,
  onApplyExpression,
  onClear,
  onSetAll
}) => {
  const [activeTab, setActiveTab] = useState<'indices' | 'expression'>('indices')
  const [termsText, setTermsText] = useState<string>('')
  const [dcText, setDcText] = useState<string>('')
  const [expressionText, setExpressionText] = useState<string>("A'B + BC'D")

  const targetValue: CellValue = form === 'SOP' ? 1 : 0

  useEffect(() => {
    if (!gridValues) return
    const total = 1 << variableCount
    const activeTerms: number[] = []
    const activeDc: number[] = []

    for (let i = 0; i < total; i++) {
      const v = gridValues?.[i]
      if (v === targetValue) {
        activeTerms.push(i)
      } else if (v === 'd') {
        activeDc.push(i)
      }
    }

    const currentParsedTerms = parseNumberList(termsText)
    const isTermsIdentical =
      currentParsedTerms.length === activeTerms.length &&
      currentParsedTerms.every((val, idx) => val === activeTerms[idx])

    if (!isTermsIdentical) {
      setTermsText(activeTerms.join(', '))
    }

    const currentParsedDc = parseNumberList(dcText)
    const isDcIdentical =
      currentParsedDc.length === activeDc.length &&
      currentParsedDc.every((val, idx) => val === activeDc[idx])

    if (!isDcIdentical) {
      setDcText(activeDc.join(', '))
    }
  }, [gridValues, form, variableCount, targetValue])

  const handleTermsInput = (newTerms: string, newDc: string) => {
    setTermsText(newTerms)
    setDcText(newDc)
    const parsedTerms = parseNumberList(newTerms)
    const parsedDc = parseNumberList(newDc)
    onApplyMinterms(parsedTerms, parsedDc)
  }

  const handleTermsBlur = () => {
    const parsedTerms = parseNumberList(termsText)
    setTermsText(parsedTerms.join(', '))
  }

  const handleDcBlur = () => {
    const parsedDc = parseNumberList(dcText)
    setDcText(parsedDc.join(', '))
  }

  const handleExpressionInput = (expr: string) => {
    setExpressionText(expr)
    onApplyExpression(expr)
  }

  return (
    <div className="input-panel-card">
      <div className="panel-config-row">
        <div className="config-item">
          <label className="config-label">Số biến:</label>
          <div className="segmented-control">
            {([2, 3, 4] as VariableCount[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`segmented-btn ${variableCount === v ? 'active' : ''}`}
                onClick={() => onVariableCountChange(v)}
              >
                {v} biến ({v === 2 ? 'A, B' : v === 3 ? 'A, B, C' : 'A, B, C, D'})
              </button>
            ))}
          </div>
        </div>

        <div className="config-item">
          <label className="config-label">Dạng chuẩn tắc:</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${form === 'SOP' ? 'active' : ''}`}
              onClick={() => onFormChange('SOP')}
            >
              Chuẩn tắc Tuyển (∑ / SOP)
            </button>
            <button
              type="button"
              className={`segmented-btn ${form === 'POS' ? 'active' : ''}`}
              onClick={() => onFormChange('POS')}
            >
              Chuẩn tắc Hội (∏ / POS)
            </button>
          </div>
        </div>

        <div className="config-item">
          <label className="config-label">Cổng thực hiện (Câu c):</label>
          <select
            className="config-select"
            value={targetGateType}
            onChange={(e) => onTargetGateChange(e.target.value as TargetGateType)}
          >
            <option value="nand_2">Cổng NAND 2 đầu vào</option>
            <option value="nor_2">Cổng NOR 2 đầu vào</option>
            <option value="nand_n">Cổng NAND N đầu vào</option>
            <option value="nor_n">Cổng NOR N đầu vào</option>
            <option value="basic">Cổng LOGIC cơ bản (AND, OR, NOT)</option>
          </select>
        </div>
      </div>

      <div className="input-method-section">
        <div className="input-modes-tabs">
          <button
            type="button"
            className={`mode-tab ${activeTab === 'indices' ? 'active' : ''}`}
            onClick={() => setActiveTab('indices')}
          >
            {form === 'SOP' ? 'Nhập chỉ số Minterm (∑)' : 'Nhập chỉ số Maxterm (∏)'}
          </button>
          <button
            type="button"
            className={`mode-tab ${activeTab === 'expression' ? 'active' : ''}`}
            onClick={() => setActiveTab('expression')}
          >
            Nhập biểu thức Boolean
          </button>
        </div>

        {activeTab === 'indices' ? (
          <div className="input-fields-container">
            <div className="grid-two-cols">
              <div className="input-field-group">
                <label className="field-label">
                  {form === 'SOP' ? 'Chỉ số Minterm (ô nhận giá trị 1):' : 'Chỉ số Maxterm (ô nhận giá trị 0):'}
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Ví dụ: 1, 2, 4, 5, 9, 10, 12"
                  value={termsText}
                  onChange={(e) => handleTermsInput(e.target.value, dcText)}
                  onBlur={handleTermsBlur}
                />
              </div>

              <div className="input-field-group">
                <label className="field-label">Chỉ số tùy định d / D (ô nhận giá trị X):</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Ví dụ: 0, 13, 14"
                  value={dcText}
                  onChange={(e) => handleTermsInput(termsText, e.target.value)}
                  onBlur={handleDcBlur}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="input-fields-container">
            <div className="input-field-group">
              <label className="field-label">Biểu thức đại số Boolean:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="text-input flex-1"
                  placeholder="Ví dụ: A'B + BC'D hoặc !A*B + B*!C*D"
                  value={expressionText}
                  onChange={(e) => handleExpressionInput(e.target.value)}
                />
              </div>
              <span className="field-hint">Hỗ trợ dấu ' hoặc ! cho phép đảo; dấu + cho OR; ký tự liền kề hoặc * cho AND.</span>
            </div>
          </div>
        )}

        <div className="input-actions-bar">
          <div className="actions-left-group">
            <button
              type="button"
              className="action-pill-btn"
              onClick={onClear}
              title="Đặt toàn bộ ô bằng 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa sạch (đặt 0)</span>
            </button>
            <button
              type="button"
              className="action-pill-btn"
              onClick={() => onSetAll(1)}
              title="Đặt toàn bộ ô bằng 1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Gán tất cả bằng 1</span>
            </button>
          </div>

          <div className="actions-right-hint">
            <span>Có thể nhấp chuột trực tiếp vào từng ô trên bảng Karnaugh để đổi 0 ⇄ 1 ⇄ X</span>
          </div>
        </div>
      </div>
    </div>
  )
}
