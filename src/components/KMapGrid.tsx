import React from 'react'
import type { CellValue, KMapGroup, OptimizationForm, VariableCount } from '../types'
import { cellToMinterm, formatGray, getColGrayCodes, getGridDimensions, getRowGrayCodes } from '../utils/kmapSolver'

interface KMapGridProps {
  variableCount: VariableCount
  gridValues: Record<number, CellValue>
  groups: KMapGroup[]
  form: OptimizationForm
  hoveredGroup: string | null
  onCellToggle?: (minterm: number) => void
  variableNames?: string[]
  onGroupHover: (groupId: string | null) => void
  onGroupClick?: (groupId: string) => void
}

export const KMapGrid: React.FC<KMapGridProps> = ({
  variableCount,
  gridValues,
  groups,
  form,
  hoveredGroup,
  onCellToggle,
  onGroupHover,
  onGroupClick, variableNames
}) => {
  const { rowVars, colVars } = getGridDimensions(variableCount)
  const rowGrays = getRowGrayCodes(variableCount)
  const colGrays = getColGrayCodes(variableCount)
  const rowBits = variableCount === 4 ? 2 : 1
  const colBits = variableCount === 2 ? 1 : 2

  const cellGroupMap: Record<number, KMapGroup[]> = {}
  groups.forEach((g) => {
    g.cells.forEach((c) => {
      if (!cellGroupMap[c]) cellGroupMap[c] = []
      cellGroupMap[c].push(g)
    })
  })

  const renderSubscriptLabel = (label: string) => {
    const parts = label.split('_')
    if (parts.length === 2) {
      return (
        <span>
          {parts[0]}
          <sub>{parts[1]}</sub>
        </span>
      )
    }
    return label
  }

  return (
    <div className="kmap-container">
      <div className="kmap-table-wrapper">
        <table className="kmap-table">
          <thead>
            <tr>
              <th className="kmap-corner-header">
                <div className="kmap-diagonal-header">
                  <span className="col-var-label">{variableNames ? variableNames.slice(rowVars.length).map((variable)=><React.Fragment key={variable}>{renderSubscriptLabel(variable)}</React.Fragment>) : colVars.join('')}</span>
                  <span className="diagonal-slash">/</span>
                  <span className="row-var-label">{variableNames ? variableNames.slice(0,rowVars.length).map((variable)=><React.Fragment key={variable}>{renderSubscriptLabel(variable)}</React.Fragment>) : rowVars.join('')}</span>
                </div>
              </th>
              {colGrays.map((val, colIdx) => (
                <th key={colIdx} className="kmap-header-cell">
                  {formatGray(val, colBits)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowGrays.map((rVal, rowIdx) => (
              <tr key={rowIdx}>
                <th className="kmap-header-cell kmap-row-header">
                  {formatGray(rVal, rowBits)}
                </th>
                {colGrays.map((_, colIdx) => {
                  const m = cellToMinterm(variableCount, rowIdx, colIdx)
                  const cellVal = gridValues[m] ?? 0
                  const coveringGroups = cellGroupMap[m] || []
                  const activeGroup = hoveredGroup ? groups.find((g) => g.id === hoveredGroup) : null
                  const isCellInActive = activeGroup ? activeGroup.cells.includes(m) : false
                  const hasActiveGroup = !!activeGroup
                  const primaryGroup = coveringGroups[0]

                  let cellClass = 'kmap-cell'
                  if (cellVal === 1) cellClass += ' cell-one'
                  else if (cellVal === 'd') cellClass += ' cell-dc'
                  else cellClass += ' cell-zero'

                  const inlineStyle: React.CSSProperties = {}
                  if (hasActiveGroup) {
                    if (isCellInActive) {
                      cellClass += ' cell-active-group'
                      inlineStyle.borderColor = activeGroup.color
                      inlineStyle.backgroundColor = `${activeGroup.color}25`
                      inlineStyle.boxShadow = `0 0 0 3px ${activeGroup.color}, 0 4px 14px ${activeGroup.color}50`
                    } else {
                      cellClass += ' cell-dimmed'
                    }
                  } else if (coveringGroups.length > 0) {
                    inlineStyle.borderColor = primaryGroup.color
                    inlineStyle.backgroundColor = `${primaryGroup.color}10`
                  }

                  return (
                    <td
                      key={colIdx}
                      className={cellClass}
                      style={inlineStyle}
                      role={onCellToggle ? 'button' : undefined}
                      tabIndex={onCellToggle ? 0 : undefined}
                      onKeyDown={onCellToggle ? (event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onCellToggle(m)}} : undefined}
                      onClick={onCellToggle ? () => onCellToggle(m) : undefined}
                      aria-label={`Ô ${m}, giá trị ${cellVal === 'd' ? 'X' : cellVal}`}
                      title={`Minterm ${m} (${formatGray(m, variableCount)})${onCellToggle ? ': Đổi 0 ➔ 1 ➔ X' : ''}`}
                    >
                      <span className="cell-index">{m}</span>
                      <span className="cell-value">
                        {cellVal === 'd' ? 'X' : cellVal}
                      </span>
                      {coveringGroups.length > 0 && (
                        <div className="cell-group-tags">
                          {coveringGroups.map((g) => {
                            const isTagActive = hoveredGroup === g.id
                            return (
                              <span
                                key={g.id}
                                className={`cell-tag ${isTagActive ? 'active-tag' : ''}`}
                                style={{
                                  backgroundColor: g.color,
                                  boxShadow: isTagActive ? `0 0 0 2px #ffffff, 0 0 0 3.5px ${g.color}` : undefined,
                                  transform: isTagActive ? 'scale(1.18)' : undefined,
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onGroupClick) {
                                    onGroupClick(g.id)
                                  } else {
                                    onGroupHover(isTagActive ? null : g.id)
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  e.stopPropagation()
                                  onGroupHover(g.id)
                                }}
                                onMouseLeave={() => onGroupHover(null)}
                                title={`Nhóm ${g.label}: Bấm để ghim / bỏ ghim`}
                              >
                                {renderSubscriptLabel(g.label)}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="kmap-legend">
        <span className="legend-hint">
          {form === 'SOP' ? 'Đang tối ưu chuẩn tắc Tuyển (gom các ô 1 và X)' : 'Đang tối ưu chuẩn tắc Hội (gom các ô 0 và X)'}
        </span>
      </div>
    </div>
  )
}
