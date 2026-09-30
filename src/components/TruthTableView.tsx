import React from 'react'
import type { CellValue, OptimizationForm, VariableCount } from '../types'
import { getVariableNames } from '../utils/kmapSolver'
import { Table } from 'lucide-react'
import { KaTeXView } from './KaTeXView'

interface TruthTableViewProps {
  variableCount: VariableCount
  gridValues: Record<number, CellValue>
  form: OptimizationForm
  onCellToggle: (minterm: number) => void
}

export const TruthTableView: React.FC<TruthTableViewProps> = ({
  variableCount,
  gridValues,
  form,
  onCellToggle
}) => {
  const variables = getVariableNames(variableCount)
  const totalRows = 1 << variableCount

  const getAlgebraicTerm = (m: number) => {
    if (form === 'SOP') {
      const lits = variables.map((v, bitIdx) => {
        const bit = (m >> (variableCount - 1 - bitIdx)) & 1
        return bit === 1 ? v : `\\overline{${v}}`
      })
      return `m_{${m}} = ${lits.join('\\cdot ')}`
    } else {
      const lits = variables.map((v, bitIdx) => {
        const bit = (m >> (variableCount - 1 - bitIdx)) & 1
        return bit === 0 ? v : `\\overline{${v}}`
      })
      return `M_{${m}} = (${lits.join(' + ')})`
    }
  }

  return (
    <div className="truth-table-card">
      <div className="truth-table-header">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Bảng Chân Lý Hoàn Chỉnh (Truth Table)</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Nhấp vào ô kết quả Y để chỉnh sửa trực tiếp giá trị
        </span>
      </div>

      <div className="truth-table-scroll">
        <table className="truth-table">
          <thead>
            <tr>
              <th>TT</th>
              {variables.map((v) => (
                <th key={v}>{v}</th>
              ))}
              <th>{form === 'SOP' ? 'Minterm Đại Số' : 'Maxterm Đại Số'}</th>
              <th className="output-header">Đầu ra Y</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRows }, (_, m) => {
              const val = gridValues[m] ?? 0

              let valBadgeClass = 'tt-val-badge'
              if (val === 1) valBadgeClass += ' tt-one'
              else if (val === 'd') valBadgeClass += ' tt-dc'
              else valBadgeClass += ' tt-zero'

              return (
                <tr key={m}>
                  <td className="tt-idx">{m + 1}</td>
                  {Array.from({ length: variableCount }, (_, bitIdx) => {
                    const bit = (m >> (variableCount - 1 - bitIdx)) & 1
                    return <td key={bitIdx} className="tt-bit">{bit}</td>
                  })}
                  <td className="tt-term">
                    <KaTeXView math={getAlgebraicTerm(m)} />
                  </td>
                  <td className="tt-output-cell" onClick={() => onCellToggle(m)}>
                    <span className={valBadgeClass}>
                      {val === 'd' ? 'X' : val}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
