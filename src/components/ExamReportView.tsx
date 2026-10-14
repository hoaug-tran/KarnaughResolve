import React from 'react'
import type { CircuitDiagram, KMapGroup, OptimizationForm, TargetGateType, TransformationStep, VariableCount } from '../types'
import { KMapGrid } from './KMapGrid'
import { CircuitViewer } from './CircuitViewer'
import { ProofViewer } from './ProofViewer'
import { KaTeXView } from './KaTeXView'
import { CheckCircle2, Info } from 'lucide-react'

interface ExamReportViewProps {
  variableCount: VariableCount
  variables: string[]
  form: OptimizationForm
  targetGateType: TargetGateType
  gridValues: Record<number, any>
  groups: KMapGroup[]
  simplifiedLatex: string
  transformationSteps: TransformationStep[]
  circuitBasic: CircuitDiagram
  circuitTarget: CircuitDiagram
  hoveredGroup: string | null
  onGroupHover: (id: string | null) => void
  onCellToggle: (minterm: number) => void
}

export const ExamReportView: React.FC<ExamReportViewProps> = ({
  variableCount,
  variables,
  form,
  targetGateType,
  gridValues,
  groups,
  simplifiedLatex,
  transformationSteps,
  circuitBasic,
  circuitTarget,
  hoveredGroup,
  onGroupHover,
  onCellToggle
}) => {
  const gateLabelMap: Record<TargetGateType, string> = {
    basic: 'cổng LOGIC cơ bản (AND, OR, NOT)',
    nand_2: 'cổng NAND 2 đầu vào',
    nand_n: 'cổng NAND N đầu vào',
    nor_2: 'cổng NOR 2 đầu vào',
    nor_n: 'cổng NOR N đầu vào'
  }

  const targetGateText = gateLabelMap[targetGateType]


  return (
    <div className="exam-report-container">
      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu a</span>
          <h3>Rút gọn hàm Boolean Y({variables.join(', ')}) bằng bìa Karnaugh</h3>
        </div>

        <div className="exam-kmap-layout">
          <div className="exam-kmap-pane">
            <h4 className="exam-subtitle">1. Bảng Karnaugh và các vòng khoanh:</h4>
            <KMapGrid
              variableCount={variableCount}
              gridValues={gridValues}
              groups={groups}
              form={form}
              hoveredGroup={hoveredGroup}
              onCellToggle={onCellToggle}
              onGroupHover={onGroupHover}
            />
          </div>

          <div className="exam-groups-pane">
            <h4 className="exam-subtitle">2. Phân tích các nhóm khoanh tối ưu:</h4>
            <div className="exam-summary-badge">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Khoanh tối ưu: <strong>{groups.length} vòng</strong> (
                {[
                  groups.filter((g) => g.cells.length === 8).length > 0 && `${groups.filter((g) => g.cells.length === 8).length} vòng 8 ô`,
                  groups.filter((g) => g.cells.length === 4).length > 0 && `${groups.filter((g) => g.cells.length === 4).length} vòng 4 ô`,
                  groups.filter((g) => g.cells.length === 2).length > 0 && `${groups.filter((g) => g.cells.length === 2).length} vòng 2 ô`,
                  groups.filter((g) => g.cells.length === 1).length > 0 && `${groups.filter((g) => g.cells.length === 1).length} vòng 1 ô`
                ].filter(Boolean).join(', ')}
                ) — Không có vòng thừa
              </span>
            </div>
            <div className="exam-groups-list">
              {groups.map((g, idx) => (
                <div
                  key={g.id}
                  className={`exam-group-row ${hoveredGroup === g.id ? 'active-hover' : ''}`}
                  onMouseEnter={() => onGroupHover(g.id)}
                  onMouseLeave={() => onGroupHover(null)}
                >
                  <div className="exam-group-pill" style={{ backgroundColor: g.color }}>
                    <KaTeXView math={g.label} />
                  </div>
                  <div className="exam-group-content">
                    <div className="exam-group-formula">
                      <KaTeXView math={`Y_{${idx + 1}} = ${g.label}(${g.cells.join(', ')}) = ${g.termLatex}`} />
                      <span className="exam-group-size-tag">Vòng {g.cells.length} ô</span>
                    </div>
                    {g.eliminatedVariables.length > 0 && (
                      <div className="exam-group-note">
                        Loại bỏ biến: {g.eliminatedVariables.join(', ')} | Giữ lại biến: {g.keptVariables.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="exam-final-result-box">
              <div className="result-label">
                <span>Kết quả hàm tối thiểu:</span>
              </div>
              <div className="result-formula">
                <KaTeXView math={`Y_{(${variables.join(', ')})} = ${simplifiedLatex}`} block={true} />
              </div>
            </div>

            <div className="exam-rule-hint-box">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <div className="exam-rule-hint-text">
                <strong>Quy tắc khoanh tối giản UNETI:</strong> Mỗi vòng khoanh phải phủ nhiều ô nhất có thể (kích thước luỹ thừa 2: 8, 4, 2, 1) và mọi ô mục tiêu phải được phủ bằng số vòng ít nhất. Tuyệt đối không khoanh các vòng phụ mà tất cả các ô trong đó đã được các vòng khác phủ trọn (vòng thừa).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu b</span>
          <h3>Vẽ sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)</h3>
        </div>
        <CircuitViewer
          diagram={circuitBasic}
          title="Sơ đồ mạch sử dụng cổng LOGIC cơ bản"
        />
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu c</span>
          <h3>Xây dựng mạch chỉ sử dụng {targetGateText}</h3>
        </div>

        <div className="exam-algebraic-box">
          <h4 className="exam-subtitle">1. Biến đổi đại số Boole (Định luật hoàn nguyên & De Morgan):</h4>
          <ProofViewer steps={transformationSteps} funcName="Y" />
        </div>

        <div className="exam-circuit-target-box">
          <h4 className="exam-subtitle">2. Sơ đồ mạch tương ứng sau biến đổi:</h4>
          <CircuitViewer
            diagram={circuitTarget}
            title={`Sơ đồ mạch chỉ sử dụng ${targetGateText}`}
          />
        </div>
      </div>
    </div>
  )
}
