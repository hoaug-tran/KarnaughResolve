import React, { useState } from 'react'
import type { CircuitDiagram, CombinationalOutputResult, CombinationalRow, CombinationalSubtype, LedPolarity } from '../types'
import { CombinationalTruthTable } from './CombinationalTruthTable'
import { KMapGrid } from './KMapGrid'
import { CircuitViewer } from './CircuitViewer'
import { KaTeXView } from './KaTeXView'
import { formatSubscript } from '../utils/circuitGenerator'
import { ArrowUpDown, Sparkles } from 'lucide-react'

interface CombinationalReportViewProps {
  subtype: CombinationalSubtype
  polarity: LedPolarity
  inputVars: string[]
  outputVars: string[]
  rows: CombinationalRow[]
  outputsResults: CombinationalOutputResult[]
  combinedCircuit: CircuitDiagram
  onToggleOutputBit: (rowId: string, outIdx: number) => void
  onToggleSegmentForm?: (outputName: string) => void
}

export const CombinationalReportView: React.FC<CombinationalReportViewProps> = ({
  subtype,
  polarity,
  inputVars,
  outputVars,
  rows,
  outputsResults,
  combinedCircuit,
  onToggleOutputBit,
  onToggleSegmentForm
}) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const isSevenSeg = subtype === 'seven_segment'
  const inVarsJoined = inputVars.join(', ')
  const formattedOutTitle = outputVars.map(formatSubscript).join(', ')
  const unusedRows = rows.filter((r) => r.isUnused)

  return (
    <div className="exam-report-container">
      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Bước 1</span>
          <h3>Phân Tích & Xác Định Tín Hiệu Vào - Ra</h3>
        </div>
        <div className="call-declaration-box">
          <p className="call-line">
            - Gọi <strong>{inputVars.length} biến đầu vào</strong> là{' '}
            <span className="var-highlight">{inVarsJoined}</span>
          </p>
          <div className="call-line-row">
            {outputVars.length === 1 ? (
              <span>- Gọi <strong>1 hàm đầu ra</strong> là <span className="var-highlight"><KaTeXView math={outputVars[0]} /></span></span>
            ) : (
              <>
                <span>- Gọi <strong>{outputVars.length} hàm đầu ra</strong> là </span>
                <span className="var-highlight inline-katex-group">
                  {outputVars.map((v, idx) => (
                    <React.Fragment key={v}>
                      {idx > 0 && <span>, </span>}
                      <KaTeXView math={v} />
                    </React.Fragment>
                  ))}
                </span>
              </>
            )}
            {isSevenSeg && (
              <span className="polarity-note">
                {' '}
                (Tín hiệu điều khiển các thanh LED tương ứng theo sơ đồ{' '}
                {polarity === 'cathode_common' ? 'Cathode chung: 1 = Sáng, 0 = Tắt' : 'Anot chung: 0 = Sáng, 1 = Tắt'})
              </span>
            )}
          </div>
          {unusedRows.length > 0 ? (
            <p className="call-line mt-1">
              - <strong>Trạng thái cấm (tùy định)</strong>: Gồm {unusedRows.length} tổ hợp{' '}
              <span className="var-highlight mono font-bold">
                {`{${unusedRows.map((r) => r.decimal).join(', ')}}`}
              </span>
              , được gán giá trị <span className="var-highlight font-bold">X</span> trên bảng trạng thái và{' '}
              <span className="var-highlight font-bold">d</span> trên bìa Karnaugh để tối ưu hóa việc khoanh nhóm.
            </p>
          ) : (
            <p className="call-line mt-1">
              - <strong>Tập tổ hợp đầu vào</strong>: Xét đầy đủ 16 tổ hợp nhị phân 4-bit từ{' '}
              <span className="var-highlight mono">0000</span> (0) đến <span className="var-highlight mono">1111</span> (15) (không có trạng thái cấm).
            </p>
          )}
        </div>
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Bước 2</span>
          <h3>{unusedRows.length > 0 ? 'Lập Bảng Trạng Thái & Trạng Thái Cấm' : 'Lập Bảng Trạng Thái (Bảng Chân Lý)'}</h3>
        </div>
        <CombinationalTruthTable
          inputVars={inputVars}
          outputVars={outputVars}
          rows={rows}
          isSevenSegment={isSevenSeg}
          polarity={polarity}
          onToggleOutputBit={onToggleOutputBit}
        />
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Bước 3</span>
          <h3>{outputVars.length === 1 ? 'Rút Gọn Hàm Đầu Ra Bằng Bảng Karnaugh' : 'Rút Gọn Các Hàm Đầu Ra Bằng Bảng Karnaugh'}</h3>
        </div>

        <div className="multi-kmap-grid-container">
          {outputsResults.map((res) => (
            <div key={res.name} className="single-output-kmap-card">
              <div className="output-kmap-header">
                <div className="output-kmap-header-left">
                  <span className="output-badge">
                    <KaTeXView math={res.name} />
                  </span>
                  <h4>
                    Bìa Karnaugh cho hàm <KaTeXView math={`${res.name}(${inVarsJoined})`} />
                  </h4>
                </div>
                <div className="output-kmap-header-right">
                  <span className={`output-strategy-pill ${res.form === 'SOP' ? 'sop' : 'pos'}`}>
                    {res.form === 'SOP' ? 'Khoanh ô 1 (SOP)' : 'Khoanh ô 0 (POS)'}
                  </span>
                  {onToggleSegmentForm && (
                    <button
                      type="button"
                      className="segment-form-switch-btn"
                      onClick={() => onToggleSegmentForm(res.name)}
                      title="Bấm để đổi nhanh giữa khoanh theo 1 (SOP) và khoanh theo 0 (POS)"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Đổi dạng</span>
                    </button>
                  )}
                </div>
              </div>

              {res.reasonText && (
                <div className="output-reason-banner">
                  <Sparkles className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                  <span>{res.reasonText}</span>
                </div>
              )}

              <div className="kmap-with-groups-row">
                <div className="kmap-left-pane">
                  <KMapGrid
                    variableCount={4}
                    gridValues={res.gridValues}
                    groups={res.groups}
                    form={res.form}
                    hoveredGroup={hoveredGroup ?? selectedGroup}
                    onCellToggle={() => {}}
                    onGroupHover={setHoveredGroup}
                    onGroupClick={(id) => setSelectedGroup((prev) => (prev === id ? null : id))}
                  />
                </div>

                <div className="kmap-right-pane">
                  <span className="groups-title">Các nhóm khoanh tối ưu:</span>
                  <div className="groups-compact-list">
                    {res.groups.length === 0 ? (
                      <div className="empty-group-text">
                        {res.form === 'SOP' ? 'Hàm đồng nhất = 0' : 'Hàm đồng nhất = 1'}
                      </div>
                    ) : (
                      res.groups.map((g) => {
                        const isHovered = hoveredGroup === g.id
                        const isPinned = selectedGroup === g.id
                        const isActive = isHovered || isPinned
                        return (
                          <div
                            key={g.id}
                            className={`compact-group-item ${isActive ? 'active' : ''}`}
                            style={isActive ? {
                              borderColor: g.color,
                              backgroundColor: `${g.color}18`,
                              boxShadow: isPinned ? `0 0 0 2px ${g.color}` : `0 0 0 1.5px ${g.color}50`,
                              cursor: 'pointer'
                            } : { cursor: 'pointer' }}
                            onClick={() => setSelectedGroup((prev) => (prev === g.id ? null : g.id))}
                            onMouseEnter={() => setHoveredGroup(g.id)}
                            onMouseLeave={() => setHoveredGroup(null)}
                            title={`Nhóm ${g.label}: Bấm để ghim / bỏ ghim`}
                          >
                            <span className="group-color-dot" style={{ backgroundColor: g.color }} />
                            <span className="group-label-bold">
                              <KaTeXView math={g.label} /> = gộp ({g.cells.join(', ')}) ={' '}
                            </span>
                            <span className="group-term-math">
                              <KaTeXView math={g.termLatex} />
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="output-final-result-card">
                    <div className="result-title-row">
                      <span>Phương trình tối thiểu:</span>
                    </div>
                    <div className="result-math">
                      <KaTeXView math={`${res.name} = ${res.simplifiedLatex}`} block={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Bước 4</span>
          <h3>{outputVars.length === 1 ? `Vẽ Sơ Đồ Mạch Cho Hàm ${formatSubscript(outputVars[0])}` : 'Vẽ Sơ Đồ Mạch Tổ Hợp'}</h3>
        </div>
        <CircuitViewer
          diagram={combinedCircuit}
          title={outputVars.length === 1 ? `Sơ đồ mạch logic cho hàm ${formatSubscript(outputVars[0])}` : `Sơ đồ mạch tổ hợp cho các hàm ${formattedOutTitle}`}
          subtitle={`Thực hiện các phương trình tối ưu sử dụng hệ thống bus ${inVarsJoined}`}
        />
      </div>
    </div>
  )
}
