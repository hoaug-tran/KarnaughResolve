import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { CellValue, OptimizationForm, TargetGateType, VariableCount } from './types'
import { getVariableNames, parseExpression, solveKMap } from './utils/kmapSolver'
import { generateTransformations } from './utils/algebraicTransformer'
import { generateBasicCircuit, generateTargetGateCircuit } from './utils/circuitGenerator'
import { Navbar } from './components/Navbar'
import { InputPanel } from './components/InputPanel'
import { KMapGrid } from './components/KMapGrid'
import { CircuitViewer } from './components/CircuitViewer'
import { ProofViewer } from './components/ProofViewer'
import { ExamReportView } from './components/ExamReportView'
import { TruthTableView } from './components/TruthTableView'
import { HelpModal } from './components/HelpModal'
import { KaTeXView } from './components/KaTeXView'
import { CheckCircle2 } from 'lucide-react'

export const App: React.FC = () => {
  const [variableCount, setVariableCount] = useState<VariableCount>(4)
  const [form, setForm] = useState<OptimizationForm>('SOP')
  const [targetGateType, setTargetGateType] = useState<TargetGateType>('nand_2')
  const [activeTab, setActiveTab] = useState<'report' | 'kmap' | 'circuit_basic' | 'circuit_target' | 'truthtable'>('report')
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  const [gridValues, setGridValues] = useState<Record<number, CellValue>>(() => {
    const initial: Record<number, CellValue> = {}
    for (let i = 0; i < 16; i++) initial[i] = 0
    const sampleMinterms = [1, 2, 4, 5, 9, 10, 12]
    const sampleDc = [0, 13, 14]
    sampleMinterms.forEach((m) => { initial[m] = 1 })
    sampleDc.forEach((d) => { initial[d] = 'd' })
    return initial
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const variables = useMemo(() => getVariableNames(variableCount), [variableCount])

  const { groups, simplifiedLatex, simplifiedPlain } = useMemo(() => {
    return solveKMap(variableCount, gridValues, form)
  }, [variableCount, gridValues, form])

  const transformationSteps = useMemo(() => {
    return generateTransformations(groups, form, targetGateType, 'Y')
  }, [groups, form, targetGateType])

  const circuitBasic = useMemo(() => {
    return generateBasicCircuit(groups, variableCount, form, 'Y')
  }, [groups, variableCount, form])

  const circuitTarget = useMemo(() => {
    return generateTargetGateCircuit(groups, variableCount, form, targetGateType, 'Y')
  }, [groups, variableCount, form, targetGateType])

  const handleVariableCountChange = (newCount: VariableCount) => {
    setVariableCount(newCount)
    const total = 1 << newCount
    setGridValues((prev) => {
      const next: Record<number, CellValue> = {}
      for (let i = 0; i < total; i++) {
        next[i] = prev[i] ?? 0
      }
      return next
    })
  }

  const handleCellToggle = (minterm: number) => {
    setGridValues((prev) => {
      const current = prev[minterm] ?? 0
      let next: CellValue = 0
      if (current === 0) next = 1
      else if (current === 1) next = 'd'
      else next = 0
      return { ...prev, [minterm]: next }
    })
  }

  const handleApplyMinterms = (terms: number[], dontCares: number[]) => {
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    const defaultVal: CellValue = form === 'SOP' ? 0 : 1
    const targetVal: CellValue = form === 'SOP' ? 1 : 0

    for (let i = 0; i < total; i++) {
      next[i] = defaultVal
    }
    for (const t of terms) {
      if (t < total) next[t] = targetVal
    }
    for (const d of dontCares) {
      if (d < total) next[d] = 'd'
    }

    let hasChange = false
    for (let i = 0; i < total; i++) {
      if (gridValues[i] !== next[i]) {
        hasChange = true
        break
      }
    }
    if (hasChange) {
      setGridValues(next)
    }
  }

  const handleApplyExpression = (expr: string) => {
    const { minterms, dontCares } = parseExpression(expr, variableCount)
    handleApplyMinterms(minterms, dontCares)
  }

  const handleClear = () => {
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    const defaultVal: CellValue = form === 'SOP' ? 0 : 1
    for (let i = 0; i < total; i++) {
      next[i] = defaultVal
    }
    setGridValues(next)
  }

  const handleSetAll = (val: CellValue) => {
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    for (let i = 0; i < total; i++) {
      next[i] = val
    }
    setGridValues(next)
  }

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-content">
        <div className="no-print">
          <InputPanel
            variableCount={variableCount}
            form={form}
            targetGateType={targetGateType}
            gridValues={gridValues}
            onVariableCountChange={handleVariableCountChange}
            onFormChange={setForm}
            onTargetGateChange={setTargetGateType}
            onApplyMinterms={handleApplyMinterms}
            onApplyExpression={handleApplyExpression}
            onClear={handleClear}
            onSetAll={handleSetAll}
          />
        </div>

        {activeTab === 'report' && (
          <ExamReportView
            variableCount={variableCount}
            variables={variables}
            form={form}
            targetGateType={targetGateType}
            gridValues={gridValues}
            groups={groups}
            simplifiedLatex={simplifiedLatex}
            transformationSteps={transformationSteps}
            circuitBasic={circuitBasic}
            circuitTarget={circuitTarget}
            hoveredGroup={hoveredGroup}
            onGroupHover={setHoveredGroup}
            onCellToggle={handleCellToggle}
          />
        )}

        {activeTab === 'kmap' && (
          <div className="exam-section-card">
            <div className="exam-section-title">
              <span className="exam-part-label">Câu a</span>
              <h3>Bìa Karnaugh & Các Vòng Khoanh Tối Ưu Y({variables.join(', ')})</h3>
            </div>
            <div className="exam-kmap-layout">
              <div className="exam-kmap-pane">
                <KMapGrid
                  variableCount={variableCount}
                  gridValues={gridValues}
                  groups={groups}
                  form={form}
                  hoveredGroup={hoveredGroup}
                  onCellToggle={handleCellToggle}
                  onGroupHover={setHoveredGroup}
                />
              </div>
              <div className="exam-groups-pane">
                <h4 className="exam-subtitle">Chi tiết các nhóm khoanh:</h4>
                <div className="exam-groups-list">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className={`exam-group-row ${hoveredGroup === g.id ? 'active-hover' : ''}`}
                      onMouseEnter={() => setHoveredGroup(g.id)}
                      onMouseLeave={() => setHoveredGroup(null)}
                    >
                      <div className="exam-group-pill" style={{ backgroundColor: g.color }}>
                        <KaTeXView math={g.label} />
                      </div>
                      <div className="exam-group-content">
                        <div className="exam-group-formula">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            <KaTeXView math={g.label} /> = Nhóm các ô ({g.cells.join(', ')}) ={' '}
                          </span>
                          <KaTeXView math={g.termLatex} />
                        </div>
                        {g.eliminatedVariables.length > 0 && (
                          <div className="exam-group-note">
                            Loại bỏ được biến: {g.eliminatedVariables.join(', ')} | Giữ lại biến: {g.keptVariables.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="exam-final-result-box">
                  <div className="result-label">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Hàm tối thiểu:</span>
                  </div>
                  <div className="result-formula">
                    <KaTeXView math={`Y_{(${variables.join(', ')})} = ${simplifiedLatex}`} block={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'circuit_basic' && (
          <div className="exam-section-card">
            <div className="exam-section-title">
              <span className="exam-part-label">Câu b</span>
              <h3>Sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)</h3>
            </div>
            <CircuitViewer
              diagram={circuitBasic}
              title="Mạch Logic cơ bản"
              subtitle={`Biểu thức thực hiện: Y = ${simplifiedPlain}`}
            />
          </div>
        )}

        {activeTab === 'circuit_target' && (
          <div className="exam-section-card">
            <div className="exam-section-title">
              <span className="exam-part-label">Câu c</span>
              <h3>Biến Đổi Đại Số Boole & Sơ Đồ Mạch Chuyên Dụng</h3>
            </div>
            <ProofViewer steps={transformationSteps} funcName="Y" />
            <div style={{ marginTop: '20px' }}>
              <CircuitViewer
                diagram={circuitTarget}
                title={`Sơ đồ mạch chỉ sử dụng ${targetGateType.toUpperCase().replace('_', ' ')}`}
                subtitle="Được xây dựng chính xác theo từng bước phân tầng gạch ngang trên đầu"
              />
            </div>
          </div>
        )}

        {activeTab === 'truthtable' && (
          <TruthTableView
            variableCount={variableCount}
            gridValues={gridValues}
            form={form}
            onCellToggle={handleCellToggle}
          />
        )}
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

export default App
