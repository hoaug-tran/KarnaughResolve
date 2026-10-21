import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import type {
  CellValue,
  CombinationalOptStrategy,
  CombinationalRow,
  CombinationalSubtype,
  ExamProblemType,
  LedPolarity,
  OptimizationForm,
  TargetGateType,
  VariableCount
} from './types'
import { getVariableNames, parseExpression, solveKMap } from './utils/kmapSolver'
import { generateTransformations } from './utils/algebraicTransformer'
import {
  formatSubscript,
  generateBasicCircuit,
  generateMultiOutputBasicCircuit,
  generateTargetGateCircuit
} from './utils/circuitGenerator'
import { parseSevenSegmentBits, type SegmentName } from './utils/sevenSegment'
import { Navbar } from './components/Navbar'
import { InputPanel } from './components/InputPanel'
import { KMapGrid } from './components/KMapGrid'
import { CircuitViewer } from './components/CircuitViewer'
import { ProofViewer } from './components/ProofViewer'
import { ExamReportView } from './components/ExamReportView'
import { TruthTableView } from './components/TruthTableView'
import { CombinationalInputPanel } from './components/CombinationalInputPanel'
import { CombinationalReportView } from './components/CombinationalReportView'
import { CombinationalTruthTable } from './components/CombinationalTruthTable'
import { HelpModal } from './components/HelpModal'
import { KaTeXView } from './components/KaTeXView'
import { ArrowUpDown, CheckCircle2, Sparkles } from 'lucide-react'

export const App: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<ExamProblemType>('cau_1')

  const [variableCount, setVariableCount] = useState<VariableCount>(4)
  const [form, setForm] = useState<OptimizationForm>('POS')
  const [targetGateType, setTargetGateType] = useState<TargetGateType>('nand_2')
  const [activeTab, setActiveTab] = useState<string>('report')
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  const handleGroupClick = (id: string) => {
    setSelectedGroup((prev) => (prev === id ? null : id))
  }

  const [gridValues, setGridValues] = useState<Record<number, CellValue>>(() => {
    const initial: Record<number, CellValue> = {}
    for (let i = 0; i < 16; i++) initial[i] = 1
    const c1Zeros = [0, 2, 3, 9, 11, 13, 15]
    const c1Dc = [4, 10, 14]
    c1Zeros.forEach((m) => { initial[m] = 0 })
    c1Dc.forEach((d) => { initial[d] = 'd' })
    return initial
  })

  const [combSubtype, setCombSubtype] = useState<CombinationalSubtype>('single_rule')
  const [combPolarity, setCombPolarity] = useState<LedPolarity>('cathode_common')
  const [combOutputPrefix, setCombOutputPrefix] = useState<'F' | 'G' | 'Y'>('F')
  const [sevenSegChars, setSevenSegChars] = useState<string>('56789AEdPH')
  const [selectedSegOutputs, setSelectedSegOutputs] = useState<string[]>(['a', 'd', 'g'])
  const [combOptStrategy, setCombOptStrategy] = useState<CombinationalOptStrategy>('auto')
  const [segmentFormOverrides, setSegmentFormOverrides] = useState<Record<string, OptimizationForm>>({})

  const handleToggleSegmentForm = (name: string) => {
    setSegmentFormOverrides((prev) => {
      const current = prev[name] ?? (combOutputsResults.find((r) => r.name === name)?.form ?? 'SOP')
      const nextForm: OptimizationForm = current === 'SOP' ? 'POS' : 'SOP'
      return { ...prev, [name]: nextForm }
    })
  }

  const [singleRuleRows, setSingleRuleRows] = useState<CombinationalRow[]>(() => {
    const mod2or5 = new Set([0, 2, 4, 5, 6, 8, 10, 12, 14, 15])
    return Array.from({ length: 16 }, (_, i) => ({
      id: `rule-${i}`,
      decimal: i,
      inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
      outputBits: [mod2or5.has(i) ? 1 : 0],
      isUnused: false
    }))
  })

  const [customConverterRows, setCustomConverterRows] = useState<CombinationalRow[]>(() => {
    const mapping: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 1, 0, 0],
      3: [0, 1, 0, 1],
      4: [0, 1, 1, 1],
      5: [1, 0, 0, 0],
      6: [1, 0, 0, 1],
      7: [1, 1, 0, 0],
      8: [1, 1, 0, 1],
      9: [1, 1, 1, 1]
    }
    return Array.from({ length: 10 }, (_, dec) => ({
      id: `r-${dec}`,
      decimal: dec,
      inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
      outputBits: mapping[dec],
      isUnused: false
    }))
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

  const combInputVars = useMemo(() => ['A', 'B', 'C', 'D'], [])

  const combOutputVars = useMemo(() => {
    if (combSubtype === 'seven_segment') {
      return selectedSegOutputs
    }
    if (combSubtype === 'single_rule') {
      return [combOutputPrefix === 'Y' ? 'Y' : 'F']
    }
    const outCount = customConverterRows[0]?.outputBits?.length || 4
    if (combOutputPrefix === 'G') {
      if (outCount === 4) return ['G_3', 'G_2', 'G_1', 'G_0']
      return Array.from({ length: outCount }, (_, i) => `G_${outCount - 1 - i}`)
    }
    if (combOutputPrefix === 'Y') {
      return Array.from({ length: outCount }, (_, i) => `Y_${i + 1}`)
    }
    return Array.from({ length: outCount }, (_, i) => `F_${i + 1}`)
  }, [combSubtype, selectedSegOutputs, customConverterRows, combOutputPrefix])

  const combAllRows = useMemo(() => {
    if (combSubtype === 'single_rule') {
      return singleRuleRows
    }
    if (combSubtype === 'seven_segment') {
      const validRows: CombinationalRow[] = []
      const charArr = Array.from(sevenSegChars)

      charArr.forEach((ch, idx) => {
        const dec = idx
        const bitsMap = parseSevenSegmentBits(ch, combPolarity)
        const rowOutputBits = selectedSegOutputs.map((s) => bitsMap[s as SegmentName] ?? 0)

        validRows.push({
          id: `seg-row-${idx}`,
          decimal: dec,
          inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
          outputBits: rowOutputBits,
          displayChar: ch,
          isUnused: false
        })
      })

      const unusedRows: CombinationalRow[] = []
      for (let m = charArr.length; m < 16; m++) {
        unusedRows.push({
          id: `seg-unused-${m}`,
          decimal: m,
          inputBits: [(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1],
          outputBits: selectedSegOutputs.map(() => 'X'),
          isUnused: true
        })
      }

      return [...validRows, ...unusedRows]
    }

    const validRows = customConverterRows.filter((r) => !r.isUnused)
    const presentDecimals = new Set(validRows.map((r) => r.decimal))
    const missingDecimals = Array.from({ length: 16 }, (_, i) => i)
      .filter((i) => !presentDecimals.has(i))
      .sort((a, b) => a - b)

    const unusedRows: CombinationalRow[] = missingDecimals.map((m) => ({
      id: `conv-unused-${m}`,
      decimal: m,
      inputBits: [(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1],
      outputBits: combOutputVars.map(() => 'X'),
      isUnused: true
    }))

    return [...validRows, ...unusedRows]
  }, [combSubtype, singleRuleRows, sevenSegChars, combPolarity, selectedSegOutputs, customConverterRows, combOutputVars])

  const combOutputsResults = useMemo(() => {
    return combOutputVars.map((outVarName, outIdx) => {
      const gValues: Record<number, CellValue> = {}
      let oneCount = 0
      let zeroCount = 0

      for (let m = 0; m < 16; m++) {
        const row = combAllRows.find((r) => r.decimal === m)
        if (row && !row.isUnused) {
          const bit = row.outputBits[outIdx]
          if (bit === 1) oneCount++
          else if (bit === 0) zeroCount++
          gValues[m] = bit === 1 ? 1 : 0
        } else {
          gValues[m] = 'd'
        }
      }

      let chosenForm: OptimizationForm = 'SOP'
      let reasonText = ''

      const override = segmentFormOverrides[outVarName]
      if (override) {
        chosenForm = override
        reasonText = `Thủ công: ${chosenForm === 'SOP' ? 'Khoanh theo ô 1 (SOP)' : 'Khoanh theo ô 0 (POS)'} (${oneCount} ô 1, ${zeroCount} ô 0)`
      } else if (combOptStrategy === 'sop') {
        chosenForm = 'SOP'
        reasonText = `Cố định theo ô 1 (SOP: ${oneCount} ô 1, ${zeroCount} ô 0)`
      } else if (combOptStrategy === 'pos') {
        chosenForm = 'POS'
        reasonText = `Cố định theo ô 0 (POS: ${zeroCount} ô 0, ${oneCount} ô 1)`
      } else {
        if (oneCount < zeroCount) {
          chosenForm = 'SOP'
          reasonText = `Ưu tiên ô 1 (${oneCount} ô 1 < ${zeroCount} ô 0) ➔ Rút gọn theo 1 (SOP) để mạch tối giản nhất`
        } else if (zeroCount < oneCount) {
          chosenForm = 'POS'
          reasonText = `Ưu tiên ô 0 (${zeroCount} ô 0 < ${oneCount} ô 1) ➔ Rút gọn theo 0 (POS) để mạch tối giản nhất`
        } else {
          chosenForm = 'SOP'
          reasonText = `Số ô bằng nhau (${oneCount} ô 1 = ${zeroCount} ô 0) ➔ Mặc định rút gọn theo 1 (SOP)`
        }
      }

      const { groups: gList, simplifiedLatex: sLatex, simplifiedPlain: sPlain } = solveKMap(4, gValues, chosenForm)

      const uniqueGroups = gList.map((g, gIdx) => ({
        ...g,
        id: `${outVarName}-grp-${gIdx}`
      }))

      return {
        name: outVarName,
        groups: uniqueGroups,
        simplifiedLatex: sLatex,
        simplifiedPlain: sPlain,
        gridValues: gValues,
        form: chosenForm,
        oneCount,
        zeroCount,
        reasonText
      }
    })
  }, [combOutputVars, combAllRows, combOptStrategy, segmentFormOverrides])

  const combCircuit = useMemo(() => {
    return generateMultiOutputBasicCircuit(combOutputsResults, 4, 'SOP')
  }, [combOutputsResults])

  const handleCombToggleOutputBit = (rowId: string, outIdx: number) => {
    if (combSubtype === 'single_rule') {
      setSingleRuleRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r
          const currentBit = r.outputBits[outIdx]
          const nextBit = currentBit === 1 ? 0 : 1
          const newBits = [...r.outputBits]
          newBits[outIdx] = nextBit
          return { ...r, outputBits: newBits }
        })
      )
      return
    }
    if (combSubtype === 'code_converter') {
      setCustomConverterRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r
          const currentBit = r.outputBits[outIdx]
          const nextBit = currentBit === 1 ? 0 : 1
          const newBits = [...r.outputBits]
          newBits[outIdx] = nextBit
          return { ...r, outputBits: newBits }
        })
      )
    }
  }

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

    setGridValues(next)
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
        currentProblem={currentProblem}
        onProblemChange={setCurrentProblem}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-content">
        <div style={{ display: currentProblem === 'cau_1' ? 'contents' : 'none' }}>
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
                hoveredGroup={hoveredGroup ?? selectedGroup}
                selectedGroup={selectedGroup}
                onGroupHover={setHoveredGroup}
                onGroupClick={handleGroupClick}
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
                      hoveredGroup={hoveredGroup ?? selectedGroup}
                      onCellToggle={handleCellToggle}
                      onGroupHover={setHoveredGroup}
                      onGroupClick={handleGroupClick}
                    />
                  </div>
                  <div className="exam-groups-pane">
                    <h4 className="exam-subtitle">Chi tiết các nhóm khoanh:</h4>
                    <div className="exam-groups-list">
                      {groups.map((g) => {
                        const isActive = (hoveredGroup ?? selectedGroup) === g.id
                        const isPinned = selectedGroup === g.id
                        return (
                          <div
                            key={g.id}
                            className={`exam-group-row ${isActive ? 'active-hover' : ''} ${isPinned ? 'pinned' : ''}`}
                            style={isActive ? {
                              borderColor: g.color,
                              backgroundColor: `${g.color}15`,
                              boxShadow: isPinned ? `0 0 0 2.5px ${g.color}, 0 4px 14px ${g.color}30` : `0 0 0 2px ${g.color}40`
                            } : undefined}
                            onClick={() => handleGroupClick(g.id)}
                            onMouseEnter={() => setHoveredGroup(g.id)}
                            onMouseLeave={() => setHoveredGroup(null)}
                            title={`Nhóm ${g.label}: Bấm để ghim / bỏ ghim tô sáng`}
                          >
                            <div
                              className="exam-group-pill"
                              style={{
                                backgroundColor: g.color,
                                boxShadow: isActive ? `0 0 0 2px #ffffff, 0 0 0 3.5px ${g.color}` : undefined
                              }}
                            >
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
                        )
                      })}
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
        </div>

        <div style={{ display: currentProblem === 'cau_2' ? 'contents' : 'none' }}>
          <div className="no-print">
              <CombinationalInputPanel
                subtype={combSubtype}
                onSubtypeChange={setCombSubtype}
                outputPrefix={combOutputPrefix}
                onOutputPrefixChange={setCombOutputPrefix}
                singleRuleRows={singleRuleRows}
                onSingleRuleRowsChange={setSingleRuleRows}
                converterRows={customConverterRows}
                onConverterRowsChange={setCustomConverterRows}
                polarity={combPolarity}
                onPolarityChange={setCombPolarity}
                sevenSegChars={sevenSegChars}
                onSevenSegCharsChange={setSevenSegChars}
                selectedOutputs={selectedSegOutputs}
                onSelectedOutputsChange={setSelectedSegOutputs}
                optStrategy={combOptStrategy}
                onOptStrategyChange={(s) => {
                  setCombOptStrategy(s)
                  setSegmentFormOverrides({})
                }}
              />
            </div>

            {activeTab === 'report' && (
              <CombinationalReportView
                subtype={combSubtype}
                polarity={combPolarity}
                inputVars={combInputVars}
                outputVars={combOutputVars}
                rows={combAllRows}
                outputsResults={combOutputsResults}
                combinedCircuit={combCircuit}
                onToggleOutputBit={handleCombToggleOutputBit}
                onToggleSegmentForm={handleToggleSegmentForm}
              />
            )}

            {activeTab === 'truthtable' && (
              <div className="exam-section-card">
                <div className="exam-section-title">
                  <span className="exam-part-label">Bước 2</span>
                  <h3>{combAllRows.some((r) => r.isUnused) ? 'Bảng Trạng Thái & Trạng Thái Cấm' : 'Bảng Trạng Thái (Bảng Chân Lý)'}</h3>
                </div>
                <CombinationalTruthTable
                  inputVars={combInputVars}
                  outputVars={combOutputVars}
                  rows={combAllRows}
                  isSevenSegment={combSubtype === 'seven_segment'}
                  polarity={combPolarity}
                  onToggleOutputBit={handleCombToggleOutputBit}
                />
              </div>
            )}

            {activeTab === 'kmap' && (
              <div className="exam-section-card">
                <div className="exam-section-title">
                  <span className="exam-part-label">Bước 3</span>
                  <h3>{combOutputVars.length === 1 ? 'Bìa Karnaugh Rút Gọn Cho Hàm Đầu Ra' : 'Bìa Karnaugh Rút Gọn Cho Từng Đầu Ra'}</h3>
                </div>
                <div className="multi-kmap-grid-container">
                  {combOutputsResults.map((res) => (
                    <div key={res.name} className="single-output-kmap-card">
                      <div className="output-kmap-header">
                        <div className="output-kmap-header-left">
                          <span className="output-badge">
                            <KaTeXView math={res.name} />
                          </span>
                          <h4>
                            Bìa Karnaugh cho hàm <KaTeXView math={`${res.name}(${combInputVars.join(', ')})`} />
                          </h4>
                        </div>
                        <div className="output-kmap-header-right">
                          <span className={`output-strategy-pill ${res.form === 'SOP' ? 'sop' : 'pos'}`}>
                            {res.form === 'SOP' ? 'Khoanh ô 1 (SOP)' : 'Khoanh ô 0 (POS)'}
                          </span>
                          <button
                            type="button"
                            className="segment-form-switch-btn"
                            onClick={() => handleToggleSegmentForm(res.name)}
                            title="Bấm để đổi nhanh giữa khoanh theo 1 (SOP) và khoanh theo 0 (POS)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Đổi dạng</span>
                          </button>
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
                            onGroupClick={handleGroupClick}
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
                                const isActive = (hoveredGroup ?? selectedGroup) === g.id
                                const isPinned = selectedGroup === g.id
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
                                    onClick={() => handleGroupClick(g.id)}
                                    onMouseEnter={() => setHoveredGroup(g.id)}
                                    onMouseLeave={() => setHoveredGroup(null)}
                                    title={`Nhóm ${g.label}: Bấm để ghim / bỏ ghim`}
                                  >
                                    <span className="group-color-dot" style={{ backgroundColor: g.color }} />
                                    <span className="group-label-bold">
                                      <KaTeXView math={g.label} /> = gộp ({g.cells.join(', ')}) ={' '}
                                    </span>
                                    <KaTeXView math={g.termLatex} />
                                  </div>
                                )
                              })
                            )}
                          </div>

                          <div className="output-final-result-card">
                            <div className="result-title-row">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
            )}

            {activeTab === 'circuit_basic' && (
              <div className="exam-section-card">
                <div className="exam-section-title">
                  <span className="exam-part-label">Bước 4</span>
                  <h3>Sơ Đồ Mạch Tổ Hợp Chuyển Mã</h3>
                </div>
                <CircuitViewer
                  diagram={combCircuit}
                  title={`Sơ đồ mạch tổ hợp cho các hàm ${combOutputVars.map(formatSubscript).join(', ')}`}
                  subtitle={`Thực hiện các phương trình tối ưu từ các đường bus ${combInputVars.join(', ')}`}
                />
              </div>
            )}
        </div>
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

export default App
