import React from 'react'
import type { CombinationalRow, LedPolarity } from '../types'
import { SEGMENT_MAP, type SegmentName } from '../utils/sevenSegment'
import { KaTeXView } from './KaTeXView'

interface CombinationalTruthTableProps {
  inputVars: string[]
  outputVars: string[]
  rows: CombinationalRow[]
  isSevenSegment?: boolean
  polarity?: LedPolarity
  onToggleOutputBit?: (rowId: string, outIdx: number) => void
}

export const CombinationalTruthTable: React.FC<CombinationalTruthTableProps> = ({
  inputVars,
  outputVars,
  rows,
  isSevenSegment = false,
  polarity = 'cathode_common',
  onToggleOutputBit
}) => {
  const validRows = rows.filter((r) => !r.isUnused)
  const unusedRows = rows.filter((r) => r.isUnused)

  const renderSevenSegmentPreview = (char?: string) => {
    if (!char) return null
    const activeSegs = SEGMENT_MAP[char] ?? SEGMENT_MAP[char.toUpperCase()] ?? []

    const segCoords: Record<SegmentName, string> = {
      a: 'M 7 4 L 21 4 L 18 7 L 10 7 Z',
      b: 'M 22 5 L 22 17 L 19 15 L 19 8 Z',
      c: 'M 22 19 L 22 31 L 19 28 L 19 21 Z',
      d: 'M 7 32 L 21 32 L 18 29 L 10 29 Z',
      e: 'M 6 19 L 6 31 L 9 28 L 9 21 Z',
      f: 'M 6 5 L 6 17 L 9 15 L 9 8 Z',
      g: 'M 7 18 L 21 18 L 19 16 L 9 16 Z'
    }

    return (
      <svg width="28" height="36" viewBox="0 0 28 36" className="seven-seg-mini-svg">
        <rect width="28" height="36" rx="4" fill="var(--bg-card)" />
        {(Object.keys(segCoords) as SegmentName[]).map((seg) => {
          const isActive = activeSegs.includes(seg)
          return (
            <path
              key={seg}
              d={segCoords[seg]}
              fill={isActive ? '#ef4444' : 'var(--border-strong)'}
              opacity={isActive ? 1 : 0.25}
            />
          )
        })}
      </svg>
    )
  }

  return (
    <div className="combinational-table-wrapper">
      <div className="table-responsive-scroll">
        <table className="combinational-table">
          <thead>
            {isSevenSegment ? (
              <>
                <tr>
                  <th rowSpan={2} className="col-stt">Số (10)</th>
                  <th colSpan={inputVars.length} className="col-group-header">Đầu vào</th>
                  <th colSpan={outputVars.length} className="col-group-header">Đầu ra</th>
                  <th className="col-ht-top">HT</th>
                </tr>
                <tr>
                  {inputVars.map((v) => (
                    <th key={v} className="col-var">{v}</th>
                  ))}
                  {outputVars.map((v) => (
                    <th key={v} className="col-var">{v}</th>
                  ))}
                  <th className="col-ht-sub">{outputVars.join(', ')}</th>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <th rowSpan={2} className="col-stt">Số (10)</th>
                  <th colSpan={inputVars.length} className="col-group-header">Đầu vào</th>
                  <th colSpan={outputVars.length} className="col-group-header">Đầu ra</th>
                </tr>
                <tr>
                  {inputVars.map((v) => (
                    <th key={v} className="col-var">{v}</th>
                  ))}
                  {outputVars.map((v) => (
                    <th key={v} className="col-var">
                      <KaTeXView math={v} />
                    </th>
                  ))}
                </tr>
              </>
            )}
          </thead>
          <tbody>
            {validRows.map((row) => (
              <tr key={row.id} className="row-valid">
                <td className="cell-stt font-mono">{row.decimal}</td>
                {row.inputBits.map((b, bIdx) => (
                  <td key={bIdx} className="cell-bit font-mono">
                    <span className={b === 1 ? 'bit-one' : 'bit-zero'}>
                      {b}
                    </span>
                  </td>
                ))}
                {row.outputBits.map((b, bIdx) => (
                  <td
                    key={bIdx}
                    className={`cell-bit font-mono ${onToggleOutputBit ? 'clickable' : ''}`}
                    onClick={() => onToggleOutputBit?.(row.id, bIdx)}
                    title={onToggleOutputBit ? 'Click để đổi giá trị 0/1' : undefined}
                  >
                    <span className={b === 1 ? 'bit-one' : 'bit-zero'}>
                      {b}
                    </span>
                  </td>
                ))}
                {isSevenSegment && (
                  <td className="cell-ht">
                    <div className="ht-container">
                      <span className="ht-char">{row.displayChar}</span>
                      {renderSevenSegmentPreview(row.displayChar)}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {unusedRows.length > 0 && (
              unusedRows.map((row, rIdx) => (
                <tr
                  key={row.id}
                  className={`row-unused ${rIdx === 0 ? 'first-unused-row' : ''}`}
                >
                  <td className="cell-stt font-mono text-muted">{row.decimal}</td>
                  {row.inputBits.map((b, bIdx) => (
                    <td key={bIdx} className="cell-bit font-mono text-muted">
                      <span className={b === 1 ? 'bit-one-muted' : 'bit-zero-muted'}>
                        {b}
                      </span>
                    </td>
                  ))}
                  {rIdx === 0 ? (
                    <td
                      rowSpan={unusedRows.length}
                      colSpan={outputVars.length}
                      className="cell-dont-care-merged"
                    >
                      <div className="dont-care-cross-container">
                        <svg className="cross-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="0" y1="0" x2="100" y2="100" className="cross-line" />
                          <line x1="100" y1="0" x2="0" y2="100" className="cross-line" />
                        </svg>
                      </div>
                    </td>
                  ) : null}
                  {isSevenSegment && (
                    <td className="cell-ht text-muted">-</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isSevenSegment && (
        <div className="seven-seg-diagram-card">
          <div className="diagram-header">
            <h4>Sơ đồ cấu tạo LED 7 thanh</h4>
            <span className="diagram-polarity-tag">
              {polarity === 'cathode_common' ? 'Cathode chung (1=Sáng, 0=Tắt)' : 'Anot chung (0=Sáng, 1=Tắt)'}
            </span>
          </div>
          <div className="seven-seg-svg-large-box">
            <svg width="180" height="230" viewBox="0 0 180 230" className="seven-seg-large-svg">
              <rect x="15" y="15" width="150" height="200" rx="12" className="seven-seg-box-bg" />

              <g id="seg-a">
                <polygon points="40,25 120,25 106,39 54,39" className="seg-poly-idle" />
                <text x="80" y="34" className="seg-label-text">a</text>
              </g>

              <g id="seg-b">
                <polygon points="122,27 122,107 108,93 108,41" className="seg-poly-idle" />
                <text x="115" y="68" className="seg-label-text">b</text>
              </g>

              <g id="seg-c">
                <polygon points="122,113 122,193 108,179 108,127" className="seg-poly-idle" />
                <text x="115" y="154" className="seg-label-text">c</text>
              </g>

              <g id="seg-d">
                <polygon points="40,195 120,195 106,181 54,181" className="seg-poly-idle" />
                <text x="80" y="190" className="seg-label-text">d</text>
              </g>

              <g id="seg-e">
                <polygon points="38,113 38,193 52,179 52,127" className="seg-poly-idle" />
                <text x="45" y="154" className="seg-label-text">e</text>
              </g>

              <g id="seg-f">
                <polygon points="38,27 38,107 52,93 52,41" className="seg-poly-idle" />
                <text x="45" y="68" className="seg-label-text">f</text>
              </g>

              <g id="seg-g">
                <polygon points="42,110 118,110 106,118 54,118 42,110" className="seg-poly-idle" />
                <text x="80" y="116" className="seg-label-text">g</text>
              </g>
            </svg>
            <div className="seven-seg-labels-desc">
              <span className="desc-note">7 thanh LED tiêu chuẩn: a, b, c, d, e, f, g.</span>
              <span className="desc-highlight">
                Giải mã các đầu ra: {outputVars.map((v) => `thanh ${v}`).join(', ')}.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
