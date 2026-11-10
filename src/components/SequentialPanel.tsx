import React, { useState } from 'react'
import type { VariableCount } from '../types'
import { KMapGrid } from './KMapGrid'
import { KaTeXView } from './KaTeXView'
import { SequentialCircuit } from './SequentialCircuit'
import {COUNTER_EXAMPLES} from '../utils/coursePresets'
import { formatSubscript } from '../utils/circuitGenerator'
import { FF_INPUTS, moduloSequence, parseStateSequence, solveCounter, waveformSequence, type FlipFlopType, type SequentialOutput } from '../utils/sequentialSolver'

const bitString = (state: number, count: number) => state.toString(2).padStart(count, '0')

function FunctionMaps({ outputs, count, variables }: { outputs: SequentialOutput[]; count: VariableCount | 1; variables: string[] }) {
  const [active, setActive] = useState<string | null>(null)
  return <div className="multi-kmap-grid-container sequential-maps">{outputs.map((output) => <section key={output.name} className="single-output-kmap-card sequential-function">
    <div className="output-kmap-header"><div className="output-kmap-header-left"><span className="output-badge"><KaTeXView math={output.name}/></span><h4>Bìa Karnaugh</h4></div></div>
    {count === 1 ? <table className="combinational-table"><tbody>{[0,1].map((m)=><tr key={m}><th>{variables[0]} = {m}</th><td>{output.gridValues[m]==='d'?'X':output.gridValues[m]}</td></tr>)}</tbody></table> : <KMapGrid variableCount={count} gridValues={output.gridValues} groups={output.groups} form={output.form} hoveredGroup={active} onGroupHover={setActive} variableNames={variables} />}
    <p className="sequential-map-result"><KaTeXView math={`${output.name} = ${output.simplifiedLatex}`} /></p>
  </section>)}</div>
}

export const SequentialPanel: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const [mode, setMode] = useState<'up' | 'down' | 'sequence' | 'waveform'>('up')
  const [ff, setFf] = useState<FlipFlopType>('JK')
  const [modulus, setModulus] = useState('11')
  const [sequenceText, setSequenceText] = useState('2,4,6,8,10,12,14,15')
  const [z1, setZ1] = useState('0111110000')
  const [z2, setZ2] = useState('0101011101')
  const [result, setResult] = useState(() => solveCounter(moduloSequence(11, 'up'), 'JK'))
  const [isWaveform, setIsWaveform] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apply = () => {
    try {
      const wave = mode === 'waveform' ? waveformSequence(z1, z2) : null
      setResult(solveCounter(wave?.sequence ?? (mode === 'sequence' ? parseStateSequence(sequenceText) : moduloSequence(Number(modulus), mode === 'down' ? 'down' : 'up')), ff, 'dontcare', false, mode === 'down' ? 'down' : 'up', wave?.count))
      setIsWaveform(Boolean(wave))
      setError(null)
    } catch (e) { setError((e as Error).message) }
  }
  const show = (tab: string) => activeTab === 'report' || activeTab === tab
  const firstUnused = result.rows.find((row) => row.next === null)
  const displayedRows = [...result.rows.filter((row) => row.next !== null), ...(firstUnused ? [firstUnused] : [])]
  return <div className="sequential-panel">
    <section className="input-panel-card no-print">
      <h2>Câu 3 · Mạch dãy và bộ đếm</h2>
      <label className="config-item"><span className="config-label">Bài mẫu từ đề thi và ôn tập</span><select className="config-select" aria-label="Bài mẫu Câu 3" defaultValue="" onChange={(event)=>{
        const preset=COUNTER_EXAMPLES[Number(event.target.value)]
        if(!preset)return
        const wave=preset.mode==='waveform'?waveformSequence(preset.z1,preset.z2):null
        const sequence=preset.mode==='sequence'?parseStateSequence(preset.sequence):preset.mode==='waveform'?wave!.sequence:moduloSequence(preset.modulus,preset.mode)
        setMode(preset.mode);setFf(preset.ff)
        if(preset.mode==='sequence')setSequenceText(preset.sequence)
        else if(preset.mode==='waveform'){setZ1(preset.z1);setZ2(preset.z2)}
        else setModulus(String(preset.modulus))
        setResult(solveCounter(sequence,preset.ff,'dontcare',false,preset.mode==='down'?'down':'up',wave?.count));setIsWaveform(Boolean(wave));setError(null)
      }}><option value="" disabled>Chọn bài mẫu</option>{COUNTER_EXAMPLES.map((preset,index)=><option key={preset.label} value={index}>{preset.label}</option>)}</select></label>
      <div className="segmented-control" aria-label="Dạng bài Câu 3">
        {([['up', 'Đếm tiến'], ['down', 'Đếm lùi'], ['sequence', 'Dãy trạng thái'], ['waveform', 'Giản đồ Z1, Z2']] as const).map(([value, label]) => <button type="button" aria-pressed={mode === value} className={`segmented-btn ${mode === value ? 'active' : ''}`} key={value} onClick={() => setMode(value)}>{label}</button>)}
      </div>
      <div className="panel-config-row">
        <label className="config-item"><span className="config-label">FF sử dụng</span><select className="config-select" value={ff} onChange={(e) => setFf(e.target.value as FlipFlopType)}>{Object.keys(FF_INPUTS).map((type) => <option key={type}>{type}</option>)}</select></label>
        {mode === 'sequence' ? <label className="config-item"><span className="config-label">Dãy trạng thái thập phân</span><input className="styled-text-input" value={sequenceText} maxLength={128} onChange={(e)=>setSequenceText(e.target.value)}/></label> : mode !== 'waveform' ? <label className="config-item"><span className="config-label">Modul (2–16)</span><input className="styled-text-input" type="number" min="2" max="16" required value={modulus} onChange={(e) => setModulus(e.target.value)} /></label> : <>
          <label className="config-item"><span className="config-label">Z1 theo từng xung</span><input className="styled-text-input" maxLength={64} value={z1} onChange={(e) => setZ1(e.target.value)} /></label>
          <label className="config-item"><span className="config-label">Z2 theo từng xung</span><input className="styled-text-input" maxLength={64} value={z2} onChange={(e) => setZ2(e.target.value)} /></label>
        </>}
      </div>
      <div className="circuit-actions"><button type="button" className="toolbar-btn primary-action" onClick={apply}>Lập bảng và giải Câu 3</button></div>
      {error && <p role="alert" className="sequential-error">{error} Kết quả hợp lệ gần nhất được giữ lại.</p>}
    </section>
    <section className="exam-section-card">
      <h3>Phân tích và chọn số flip-flop</h3>
      <p>Dùng <strong>{result.count} {result.flipFlop}-FF</strong>, trạng thái {result.variables.map(formatSubscript).join(', ')}. Chu trình có {result.sequence.length} trạng thái.</p>
      <p className="sequential-sequence">{[...result.sequence, result.sequence[0]].join(' → ')}</p>
      {isWaveform && <p>Z1 ≡ {formatSubscript(result.variables[0])}, Z2 ≡ {formatSubscript(result.variables[1])}.</p>}
    </section>
    {show('truthtable') && <section className="exam-section-card"><h3>a. Bảng trạng thái và đầu vào kích {result.flipFlop}-FF</h3>
      <div className="table-responsive-scroll"><table className="combinational-table sequential-state-table"><thead>
        <tr><th rowSpan={2}>STT</th><th colSpan={result.count}>T</th><th colSpan={result.count}>T+1</th><th colSpan={result.outputs.length}>Đầu ra</th></tr>
        <tr>{[0,1].flatMap((section) => result.variables.map((variable) => <th key={`${section}-${variable}`}>{formatSubscript(variable)}</th>))}{result.outputs.map((out) => <th key={out.name}>{formatSubscript(out.name)}</th>)}</tr>
      </thead><tbody>{displayedRows.map((row) => {
        const unused = row.next === null
        return <tr key={row.current} className={unused ? 'row-unused first-unused-row' : ''}>
          <td>{row.current}</td>{Array.from(bitString(row.current,result.count),(bit,i) => <td key={`t-${i}`}>{bit}</td>)}
          {Array.from({length:result.count},(_,i) => <td key={`next-${i}`}>{row.next === null ? '' : bitString(row.next,result.count)[i]}</td>)}
          {unused ? <td colSpan={result.outputs.length} className="cell-dont-care-merged"><div className="dont-care-cross-container" style={{minHeight:40}}><svg className="cross-svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Đầu ra tùy định"><line x1="0" y1="0" x2="100" y2="100" className="cross-line"/><line x1="100" y1="0" x2="0" y2="100" className="cross-line"/></svg></div></td> : row.excitation.map((value,i) => <td key={i}>{value === 'd' ? 'X' : value}</td>)}
        </tr>
      })}</tbody></table></div>
    </section>}
    {show('kmap') && <section className="exam-section-card"><h3>b. Bìa Karnaugh và hàm kích tối thiểu</h3><FunctionMaps outputs={result.outputs} count={result.count} variables={result.variables}/></section>}
    {show('circuit_basic') && <section className="exam-section-card"><h3>c. Sơ đồ logic và nối các flip-flop</h3><SequentialCircuit result={result}/></section>}
  </div>
}
