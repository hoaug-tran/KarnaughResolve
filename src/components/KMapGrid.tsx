import React from 'react'
import type { CellValue, KMapGroup, OptimizationForm, VariableCount } from '../types'
import { cellToMinterm, formatGray, getColGrayCodes, getGridDimensions, getRowGrayCodes } from '../utils/kmapSolver'

interface KMapGridProps {
  variableCount: VariableCount
  gridValues: Record<number, CellValue>
  groups: KMapGroup[]
  form: OptimizationForm
  hoveredGroup: string | null
  onCellToggle: (minterm: number) => void
  onGroupHover: (groupId: string | null) => void
}

export const KMapGrid: React.FC<KMapGridProps> = ({
  variableCount,
  gridValues,
  groups,
  form,
  hoveredGroup,
  onCellToggle,
  onGroupHover
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
                  <span className="col-var-label">{colVars.join('')}</span>
                  <span className="diagonal-slash">/</span>
                  <span className="row-var-label">{rowVars.join('')}</span>
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
                  const isHovered = hoveredGroup && coveringGroups.some((g) => g.id === hoveredGroup)
                  const primaryGroup = coveringGroups[0]

                  let cellClass = 'kmap-cell'
                  if (cellVal === 1) cellClass += ' cell-one'
                  else if (cellVal === 'd') cellClass += ' cell-dc'
                  else cellClass += ' cell-zero'

                  if (isHovered) cellClass += ' cell-hovered-group'

                  const inlineStyle: React.CSSProperties = {}
                  if (coveringGroups.length > 0) {
                    inlineStyle.borderColor = isHovered ? '#d97706' : primaryGroup.color
                    inlineStyle.backgroundColor = isHovered
                      ? 'rgba(217, 119, 6, 0.08)'
                      : `${primaryGroup.color}10`
                  }

                  return (
                    <td
                      key={colIdx}
                      className={cellClass}
                      style={inlineStyle}
                      onClick={() => onCellToggle(m)}
                      title={`Minterm ${m} (${formatGray(m, variableCount)}): Đổi 0 ➔ 1 ➔ X`}
                    >
                      <span className="cell-index">{m}</span>
                      <span className="cell-value">
                        {cellVal === 'd' ? 'X' : cellVal}
                      </span>
                      {coveringGroups.length > 0 && (
                        <div className="cell-group-tags">
                          {coveringGroups.map((g) => (
                            <span
                              key={g.id}
                              className="cell-tag"
                              style={{ backgroundColor: g.color }}
                              onMouseEnter={(e) => {
                                e.stopPropagation()
                                onGroupHover(g.id)
                              }}
                              onMouseLeave={() => onGroupHover(null)}
                            >
                              {renderSubscriptLabel(g.label)}
                            </span>
                          ))}
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
