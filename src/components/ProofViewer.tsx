import React, { useState } from 'react'
import type { TransformationStep } from '../types'
import { KaTeXView } from './KaTeXView'
import { FormattedMathText } from './FormattedMathText'
import { Check, ChevronDown, ChevronUp, Copy, HelpCircle } from 'lucide-react'

interface ProofViewerProps {
  steps: TransformationStep[]
  funcName?: string
}

export const ProofViewer: React.FC<ProofViewerProps> = ({ steps, funcName = 'Y' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copyStepLatex = (latex: string, idx: number) => {
    navigator.clipboard.writeText(latex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const finalStep = steps[steps.length - 1]
  const cascadeStep = steps.find(
    (s) => (s.latex.includes('S_{12}') || s.latex.includes('P_{12}')) && s !== finalStep
  )

  return (
    <div className="proof-viewer-card">
      <div className="proof-summary-box">
        <div className="proof-summary-left">
          <span className="summary-tag">Kết quả biểu thức đã biến đổi (chuẩn cổng logic)</span>
          <div className="summary-math">
            <KaTeXView math={finalStep ? finalStep.latex : `${funcName} = 0`} />
          </div>
          {cascadeStep && (
            <div className="summary-cascade-sub">
              <span className="summary-cascade-label">Hệ tín hiệu phân tầng:</span>
              <KaTeXView math={cascadeStep.latex} />
            </div>
          )}
        </div>

        <button
          type="button"
          className="steps-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{isOpen ? 'Thu gọn các bước biến đổi' : 'Xem chi tiết từng bước biến đổi đại số'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="steps-detail-container">
          <div className="steps-laws-card">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Các định luật và công thức Boolean áp dụng trong bài
              </span>
            </div>
            <div className="laws-grid">
              <div className="law-item">
                <span className="law-name">1. Định luật hoàn nguyên:</span>
                <KaTeXView math="\overline{\overline{A}} = A" />
                <span className="law-desc">Phủ định 2 lần biểu thức mà không làm đổi giá trị.</span>
              </div>
              <div className="law-item">
                <span className="law-name">2. Định luật De Morgan:</span>
                <KaTeXView math="\overline{A + B} = \overline{A} \cdot \overline{B} \quad , \quad \overline{A \cdot B} = \overline{A} + \overline{B}" />
                <span className="law-desc">Chuyển đổi giữa phép cộng và phép nhân logic.</span>
              </div>
              <div className="law-item">
                <span className="law-name">3. Quy tắc ghép cổng 2 đầu vào:</span>
                <KaTeXView math="\overline{A \cdot B \cdot C} = \overline{ \overline{\overline{A \cdot B}} \cdot C }" />
                <span className="law-desc">Dùng cổng đảo nối tiếp để phân tầng 2 ngõ vào.</span>
              </div>
            </div>
          </div>

          <div className="proof-steps-container">
            {steps.map((step, idx) => {
              const isCopied = copiedIdx === idx
              const cleanTitle = step.title.replace(/^Bước\s+\d+[:.]?\s*/i, '')

              return (
                <div key={idx} className="step-card">
                  <div className="step-card-header">
                    <div className="step-card-header-left">
                      <div className="step-badge">Bước {idx + 1}</div>
                      <h4 className="step-title">{cleanTitle}</h4>
                    </div>
                    <button
                      type="button"
                      className="step-copy-btn"
                      onClick={() => copyStepLatex(step.latex, idx)}
                      title="Sao chép mã LaTeX"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{isCopied ? 'Đã sao chép' : 'Copy LaTeX'}</span>
                    </button>
                  </div>

                  {step.ruleName && (
                    <div className="step-rule-badge">
                      <span className="step-rule-name">Quy tắc / Định luật: {step.ruleName}</span>
                      {step.ruleFormula && (
                        <div className="step-rule-formula">
                          <KaTeXView math={step.ruleFormula} />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="step-description">
                    <FormattedMathText text={step.description} />
                  </p>

                  <div className="step-math-box">
                    <KaTeXView math={step.latex} block={true} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
