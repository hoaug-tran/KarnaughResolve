import React, { useState } from 'react'
import type { CombinationalRow, CombinationalSubtype, LedPolarity, SingleRuleIgnoreMode } from '../types'
import {
  COMMON_7SEG_PRESETS,
  DIGIT_CHARS,
  LETTER_CHARS,
  type SegmentName,
  type SevenSegPreset,
  SYMBOL_CHARS
} from '../utils/sevenSegment'

interface CombinationalInputPanelProps {
  subtype: CombinationalSubtype
  onSubtypeChange: (type: CombinationalSubtype) => void
  outputPrefix: 'F' | 'G' | 'Y'
  onOutputPrefixChange: (p: 'F' | 'G' | 'Y') => void
  singleRuleRows?: CombinationalRow[]
  onSingleRuleRowsChange: (newRows: CombinationalRow[]) => void
  converterRows?: CombinationalRow[]
  onConverterRowsChange: (newRows: CombinationalRow[]) => void
  polarity: LedPolarity
  onPolarityChange: (p: LedPolarity) => void
  sevenSegChars: string
  onSevenSegCharsChange: (chars: string) => void
  selectedOutputs: string[]
  onSelectedOutputsChange: (outs: string[]) => void
}

export const CombinationalInputPanel: React.FC<CombinationalInputPanelProps> = ({
  subtype,
  onSubtypeChange,
  outputPrefix,
  onOutputPrefixChange,
  onSingleRuleRowsChange,
  onConverterRowsChange,
  polarity,
  onPolarityChange,
  sevenSegChars,
  onSevenSegCharsChange,
  selectedOutputs,
  onSelectedOutputsChange
}) => {
  const [converterSubTab, setConverterSubTab] = useState<'presets' | 'custom'>('presets')
  const [numSystemMode, setNumSystemMode] = useState<'decimal' | 'binary'>('decimal')
  const [logicLevelMode, setLogicLevelMode] = useState<'sop_high' | 'pos_low'>('sop_high')
  const [ignoreMode, setIgnoreMode] = useState<SingleRuleIgnoreMode>('none')
  const [decimalText, setDecimalText] = useState<string>('0, 2, 4, 5, 6, 8, 10, 12, 14, 15')
  const [binaryText, setBinaryText] = useState<string>('0000, 0010, 0100, 0101, 0110, 1000, 1010, 1100, 1110, 1111')
  const [customIgnoreDecimalText, setCustomIgnoreDecimalText] = useState<string>('10, 11, 12, 13, 14, 15')
  const [customIgnoreBinaryText, setCustomIgnoreBinaryText] = useState<string>('1010, 1011, 1100, 1101, 1110, 1111')
  const [customCodesText, setCustomCodesText] = useState<string>('0000, 0001, 0100, 0101, 0111, 1000, 1001, 1100, 1101, 1111')
  const [customStartDec, setCustomStartDec] = useState<number>(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null)
  const [activePaletteTab, setActivePaletteTab] = useState<'digits' | 'letters' | 'symbols'>('digits')

  const decToBin4 = (n: number): string => {
    return n.toString(2).padStart(4, '0')
  }

  const validateAndParseDecimal = (text: string): { valid: boolean; values: number[]; error?: string } => {
    const rawTokens = text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) {
      return { valid: true, values: [] }
    }

    const parsed: number[] = []
    for (const token of rawTokens) {
      if (!/^\d+$/.test(token)) {
        return {
          valid: false,
          values: [],
          error: `Ký tự "${token}" không phải là số nguyên hợp lệ.`
        }
      }
      const val = parseInt(token, 10)
      if (val < 0 || val > 15) {
        return {
          valid: false,
          values: [],
          error: `Số ${val} nằm ngoài phạm vi 4 biến (chỉ chấp nhận từ 0 đến 15).`
        }
      }
      parsed.push(val)
    }

    const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a - b)
    return { valid: true, values: uniqueSorted }
  }

  const validateAndParseBinary = (text: string): { valid: boolean; values: number[]; error?: string } => {
    const rawTokens = text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) {
      return { valid: true, values: [] }
    }

    const parsed: number[] = []
    for (const token of rawTokens) {
      const cleanToken = token.replace(/[^01]/g, '')
      if (cleanToken.length !== 4) {
        return {
          valid: false,
          values: [],
          error: `Tổ hợp "${token}" không đúng 4-bit nhị phân (phải gồm đúng 4 ký tự 0 hoặc 1, ví dụ: 0010).`
        }
      }
      parsed.push(parseInt(cleanToken, 2))
    }

    const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a - b)
    return { valid: true, values: uniqueSorted }
  }

  const applySingleRuleNumbers = (
    targetNumbers: number[],
    activeHigh: boolean,
    mode: SingleRuleIgnoreMode = ignoreMode,
    customIgnoreNums?: number[]
  ) => {
    const targetSet = new Set(targetNumbers)
    let ignoreSet = new Set<number>()

    if (mode === 'remaining_are_unused') {
      for (let i = 0; i < 16; i++) {
        if (!targetSet.has(i)) {
          ignoreSet.add(i)
        }
      }
    } else if (mode === 'bcd_10_15') {
      for (let i = 10; i <= 15; i++) {
        ignoreSet.add(i)
      }
    } else if (mode === 'custom') {
      const igList =
        customIgnoreNums ??
        (numSystemMode === 'decimal'
          ? validateAndParseDecimal(customIgnoreDecimalText).values
          : validateAndParseBinary(customIgnoreBinaryText).values)
      ignoreSet = new Set(igList)
    }

    const validRows: CombinationalRow[] = []
    const unusedRows: CombinationalRow[] = []

    for (let i = 0; i < 16; i++) {
      if (ignoreSet.has(i)) {
        unusedRows.push({
          id: `rule-unused-${i}`,
          decimal: i,
          inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
          outputBits: ['X'],
          isUnused: true
        })
      } else {
        const isMatch = targetSet.has(i)
        const bitVal = activeHigh ? (isMatch ? 1 : 0) : (isMatch ? 0 : 1)
        validRows.push({
          id: `rule-${i}`,
          decimal: i,
          inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
          outputBits: [bitVal],
          isUnused: false
        })
      }
    }

    onSingleRuleRowsChange([...validRows, ...unusedRows])
  }

  const handleSubmitSingleRule = (
    overrideLevel?: 'sop_high' | 'pos_low',
    overrideMode?: SingleRuleIgnoreMode
  ) => {
    const activeLevel = overrideLevel || logicLevelMode
    const isHigh = activeLevel === 'sop_high'
    const activeMode = overrideMode || ignoreMode

    let parsedTargets: number[] = []
    if (numSystemMode === 'decimal') {
      const result = validateAndParseDecimal(decimalText)
      if (!result.valid) {
        setValidationError(result.error || 'Dữ liệu không hợp lệ')
        setValidationSuccess(null)
        return
      }
      parsedTargets = result.values
      setBinaryText(parsedTargets.map(decToBin4).join(', '))
    } else {
      const result = validateAndParseBinary(binaryText)
      if (!result.valid) {
        setValidationError(result.error || 'Dữ liệu không hợp lệ')
        setValidationSuccess(null)
        return
      }
      parsedTargets = result.values
      setDecimalText(parsedTargets.join(', '))
    }

    let parsedCustomIgnores: number[] = []
    if (activeMode === 'custom') {
      if (numSystemMode === 'decimal') {
        const igRes = validateAndParseDecimal(customIgnoreDecimalText)
        if (!igRes.valid) {
          setValidationError(`Trạng thái cấm: ${igRes.error}`)
          setValidationSuccess(null)
          return
        }
        parsedCustomIgnores = igRes.values
        setCustomIgnoreBinaryText(parsedCustomIgnores.map(decToBin4).join(', '))
      } else {
        const igRes = validateAndParseBinary(customIgnoreBinaryText)
        if (!igRes.valid) {
          setValidationError(`Trạng thái cấm: ${igRes.error}`)
          setValidationSuccess(null)
          return
        }
        parsedCustomIgnores = igRes.values
        setCustomIgnoreDecimalText(parsedCustomIgnores.join(', '))
      }

      const overlap = parsedTargets.filter((x) => parsedCustomIgnores.includes(x))
      if (overlap.length > 0) {
        setValidationError(
          `Tổ hợp {${overlap.join(', ')}} không thể vừa có ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${isHigh ? '1' : '0'} vừa là trạng thái cấm.`
        )
        setValidationSuccess(null)
        return
      }
    }

    setValidationError(null)
    applySingleRuleNumbers(parsedTargets, isHigh, activeMode, parsedCustomIgnores)

    if (activeMode === 'remaining_are_unused') {
      const unusedCount = 16 - parsedTargets.length
      setValidationSuccess(
        `Đã cập nhật: ${parsedTargets.length} tổ hợp có ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${isHigh ? '1' : '0'}. ${unusedCount} tổ hợp còn lại là Trạng thái cấm (X trên bảng, d trên bìa Karnaugh).`
      )
    } else if (activeMode === 'bcd_10_15') {
      setValidationSuccess(
        `Đã cập nhật: Mã BCD (0–9 hợp lệ, 10–15 là trạng thái cấm X). ${parsedTargets.length} tổ hợp có ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${isHigh ? '1' : '0'}.`
      )
    } else if (activeMode === 'custom') {
      setValidationSuccess(
        `Đã cập nhật: ${parsedTargets.length} tổ hợp có ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${isHigh ? '1' : '0'}, ${parsedCustomIgnores.length} tổ hợp là trạng thái cấm X: {${parsedCustomIgnores.join(', ')}}`
      )
    } else {
      setValidationSuccess(
        `Đã cập nhật: Đầy đủ 16 tổ hợp (không có cấm), ${parsedTargets.length}/16 tổ hợp có ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${isHigh ? '1' : '0'}.`
      )
    }
  }

  const handleIgnoreModeChange = (newMode: SingleRuleIgnoreMode) => {
    setIgnoreMode(newMode)
    handleSubmitSingleRule(undefined, newMode)
  }

  const handlePresetSingleRule = (
    nums: number[],
    label: string,
    presetIgnoreMode: SingleRuleIgnoreMode = 'none',
    customIgnores?: number[]
  ) => {
    setDecimalText(nums.join(', '))
    setBinaryText(nums.map(decToBin4).join(', '))
    setIgnoreMode(presetIgnoreMode)
    if (customIgnores && customIgnores.length > 0) {
      setCustomIgnoreDecimalText(customIgnores.join(', '))
      setCustomIgnoreBinaryText(customIgnores.map(decToBin4).join(', '))
    }
    setValidationError(null)
    const isHigh = logicLevelMode === 'sop_high'
    applySingleRuleNumbers(nums, isHigh, presetIgnoreMode, customIgnores)
    setValidationSuccess(`Đã áp dụng bài toán "${label}": {${nums.join(', ')}}`)
  }

  const handleRuleBinaryTo5211 = () => {
    onOutputPrefixChange('F')
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
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `r-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: mapping[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Nhị phân 0–9 sang mã 5211 (10 tổ hợp hợp lệ 0–9, 10–15 là trạng thái cấm X).')
  }

  const handleRuleExcess3To5211 = () => {
    onOutputPrefixChange('F')
    const mapping: Record<number, number[]> = {
      3: [0, 0, 0, 0],
      4: [0, 0, 0, 1],
      5: [0, 1, 0, 0],
      6: [0, 1, 0, 1],
      7: [0, 1, 1, 1],
      8: [1, 0, 0, 0],
      9: [1, 0, 0, 1],
      10: [1, 1, 0, 0],
      11: [1, 1, 0, 1],
      12: [1, 1, 1, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 3; dec <= 12; dec++) {
      newRows.push({
        id: `r-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: mapping[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã Dư 3 sang mã 5211 (10 tổ hợp hợp lệ 3–12, 0–2 và 13–15 là trạng thái cấm X).')
  }

  const handleRuleBcdToGray = () => {
    onOutputPrefixChange('G')
    const grayMap10: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 0, 1, 1],
      3: [0, 0, 1, 0],
      4: [0, 1, 1, 0],
      5: [0, 1, 1, 1],
      6: [0, 1, 0, 1],
      7: [0, 1, 0, 0],
      8: [1, 1, 0, 0],
      9: [1, 1, 0, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `bcd-gray-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: grayMap10[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã BCD 0–9 sang mã Gray 4-bit với 4 hàm đầu ra G₃, G₂, G₁, G₀ (10–15 là ignore X).')
  }

  const handleRuleBinaryToExcess3Ring = () => {
    onOutputPrefixChange('F')
    const ringMap10: Record<number, number[]> = {
      0: [0, 0, 1, 0],
      1: [0, 1, 1, 0],
      2: [0, 1, 1, 1],
      3: [0, 1, 0, 1],
      4: [0, 1, 0, 0],
      5: [1, 1, 0, 0],
      6: [1, 1, 0, 1],
      7: [1, 1, 1, 1],
      8: [1, 1, 1, 0],
      9: [1, 0, 1, 0]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `ring-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: ringMap10[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Nhị phân 0–9 sang Mã vòng dư 3 (Bài tập C5) với 4 hàm đầu ra F₁...F₄ (10–15 là ignore X).')
  }

  const handleRuleBinaryToGray = () => {
    onOutputPrefixChange('G')
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec < 16; dec++) {
      const b3 = (dec >> 3) & 1
      const b2 = (dec >> 2) & 1
      const b1 = (dec >> 1) & 1
      const b0 = dec & 1
      const g3 = b3
      const g2 = b3 ^ b2
      const g1 = b2 ^ b1
      const g0 = b1 ^ b0
      newRows.push({
        id: `gray-${dec}`,
        decimal: dec,
        inputBits: [b3, b2, b1, b0],
        outputBits: [g3, g2, g1, g0],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Đầy đủ 16 tổ hợp Nhị phân sang mã Gray với 4 hàm đầu ra G₃, G₂, G₁, G₀.')
  }

  const handleRuleBcdTo2421 = () => {
    onOutputPrefixChange('F')
    const aikenMap: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 0, 1, 0],
      3: [0, 0, 1, 1],
      4: [0, 1, 0, 0],
      5: [1, 0, 1, 1],
      6: [1, 1, 0, 0],
      7: [1, 1, 0, 1],
      8: [1, 1, 1, 0],
      9: [1, 1, 1, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `aiken-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: aikenMap[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã BCD 0–9 sang mã 2421 (Aiken tự bù) (10–15 là ignore X).')
  }

  const handleApplyCustomConverterTable = () => {
    const rawTokens = customCodesText.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) {
      setValidationError('Vui lòng nhập ít nhất một từ mã đầu ra.')
      setValidationSuccess(null)
      return
    }

    if (rawTokens.length > 16) {
      setValidationError('Tối đa chỉ chấp nhận 16 từ mã đầu ra cho hệ 4 biến.')
      setValidationSuccess(null)
      return
    }

    const parsedRows: CombinationalRow[] = []
    const start = customStartDec

    for (let idx = 0; idx < rawTokens.length; idx++) {
      const dec = start + idx
      if (dec > 15) {
        setValidationError(`Tổ hợp bắt đầu từ ${start} với ${rawTokens.length} phần tử sẽ vượt quá số thập phân 15.`)
        setValidationSuccess(null)
        return
      }

      const token = rawTokens[idx].replace(/[^01]/g, '')
      if (token.length !== 4) {
        setValidationError(`Từ mã "${rawTokens[idx]}" ở vị trí thứ ${idx + 1} không đúng 4 bit (ví dụ: 0101).`)
        setValidationSuccess(null)
        return
      }

      const bits = token.split('').map((b) => parseInt(b, 10))
      parsedRows.push({
        id: `custom-row-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: bits,
        isUnused: false
      })
    }

    setValidationError(null)
    onConverterRowsChange(parsedRows)
    setValidationSuccess(
      `Đã áp dụng bảng mã tùy biến: ${parsedRows.length} tổ hợp hợp lệ từ số ${start} đến ${start + parsedRows.length - 1}.`
    )
  }

  const handleApplyPreset7Seg = (preset: SevenSegPreset) => {
    onSevenSegCharsChange(preset.chars.join(''))
    if (preset.segments && preset.segments.length > 0) {
      onSelectedOutputsChange(preset.segments)
    }
    if (preset.polarity) {
      onPolarityChange(preset.polarity)
    }
    setValidationSuccess(`Đã áp dụng cấu hình LED 7 thanh: ${preset.label}`)
  }

  const handleAddChar = (ch: string) => {
    if (sevenSegChars.length >= 10) return
    onSevenSegCharsChange(sevenSegChars + ch)
  }

  const handleRemoveLastChar = () => {
    if (sevenSegChars.length > 0) {
      onSevenSegCharsChange(sevenSegChars.slice(0, -1))
    }
  }

  const handleClearChars = () => {
    onSevenSegCharsChange('')
  }

  return (
    <div className="combinational-input-panel">
      <div className="combinational-config-grid">
        <div className="config-item">
          <label className="config-label">Dạng bài thi Câu 2:</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${subtype === 'single_rule' ? 'active' : ''}`}
              onClick={() => onSubtypeChange('single_rule')}
            >
              Mạch 1 đầu ra F theo điều kiện
            </button>
            <button
              type="button"
              className={`segmented-btn ${subtype === 'code_converter' ? 'active' : ''}`}
              onClick={() => onSubtypeChange('code_converter')}
            >
              Chuyển đổi mã 4-bit (5211, Gray, 2421)
            </button>
            <button
              type="button"
              className={`segmented-btn ${subtype === 'seven_segment' ? 'active' : ''}`}
              onClick={() => onSubtypeChange('seven_segment')}
            >
              Giải mã LED 7 thanh
            </button>
          </div>
        </div>

        {subtype === 'single_rule' && (
          <div className="config-item">
            <label className="config-label">Ký hiệu hàm đầu ra:</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${outputPrefix !== 'Y' ? 'active' : ''}`}
                onClick={() => onOutputPrefixChange('F')}
              >
                Hàm F
              </button>
              <button
                type="button"
                className={`segmented-btn ${outputPrefix === 'Y' ? 'active' : ''}`}
                onClick={() => onOutputPrefixChange('Y')}
              >
                Hàm Y
              </button>
            </div>
          </div>
        )}

        {subtype === 'code_converter' && (
          <div className="config-item">
            <label className="config-label">Ký hiệu 4 hàm đầu ra:</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${outputPrefix === 'F' ? 'active' : ''}`}
                onClick={() => onOutputPrefixChange('F')}
              >
                F₁...F₄
              </button>
              <button
                type="button"
                className={`segmented-btn ${outputPrefix === 'G' ? 'active' : ''}`}
                onClick={() => onOutputPrefixChange('G')}
              >
                G₃...G₀ (Mã Gray)
              </button>
              <button
                type="button"
                className={`segmented-btn ${outputPrefix === 'Y' ? 'active' : ''}`}
                onClick={() => onOutputPrefixChange('Y')}
              >
                Y₁...Y₄
              </button>
            </div>
          </div>
        )}

        {subtype === 'seven_segment' && (
          <div className="config-item">
            <label className="config-label">Cực tính LED 7 thanh:</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${polarity === 'cathode_common' ? 'active' : ''}`}
                onClick={() => onPolarityChange('cathode_common')}
              >
                Cathode chung (1=Sáng, 0=Tắt)
              </button>
              <button
                type="button"
                className={`segmented-btn ${polarity === 'anode_common' ? 'active' : ''}`}
                onClick={() => onPolarityChange('anode_common')}
              >
                Anot chung (0=Sáng, 1=Tắt)
              </button>
            </div>
          </div>
        )}
      </div>

      {subtype === 'single_rule' && (
        <div className="rule-based-input-box">
          <div className="rule-mode-toggles-row">
            <div className="config-sub-item">
              <span className="sub-label">Định dạng nhập liệu:</span>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${numSystemMode === 'decimal' ? 'active' : ''}`}
                  onClick={() => setNumSystemMode('decimal')}
                >
                  Số thập phân (Hệ 10)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${numSystemMode === 'binary' ? 'active' : ''}`}
                  onClick={() => setNumSystemMode('binary')}
                >
                  Mã nhị phân 4-bit (Hệ 2)
                </button>
              </div>
            </div>

            <div className="config-sub-item">
              <span className="sub-label">Quy ước mức logic cho {outputPrefix === 'Y' ? 'Y' : 'F'}:</span>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${logicLevelMode === 'sop_high' ? 'active' : ''}`}
                  onClick={() => {
                    setLogicLevelMode('sop_high')
                    handleSubmitSingleRule('sop_high')
                  }}
                >
                  {outputPrefix === 'Y' ? 'Y' : 'F'} = 1 khi thỏa mãn (SOP)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${logicLevelMode === 'pos_low' ? 'active' : ''}`}
                  onClick={() => {
                    setLogicLevelMode('pos_low')
                    handleSubmitSingleRule('pos_low')
                  }}
                >
                  {outputPrefix === 'Y' ? 'Y' : 'F'} = 0 khi thỏa mãn (POS)
                </button>
              </div>
            </div>
          </div>

          <div className="config-sub-item mt-3">
            <span className="sub-label">Quy định trạng thái cấm (Ignore / Don't Care X):</span>
            <div className="segmented-control mini flex-wrap">
              <button
                type="button"
                className={`segmented-btn ${ignoreMode === 'remaining_are_unused' ? 'active' : ''}`}
                onClick={() => handleIgnoreModeChange('remaining_are_unused')}
                title="Chỉ các số vừa nhập là hợp lệ, tất cả các số còn lại trong 0..15 tự động là trạng thái cấm (X trên bảng, d trên bìa)"
              >
                Chỉ các số vừa nhập (còn lại là cấm X)
              </button>
              <button
                type="button"
                className={`segmented-btn ${ignoreMode === 'none' ? 'active' : ''}`}
                onClick={() => handleIgnoreModeChange('none')}
                title="Xét đầy đủ 16 tổ hợp 0..15, các số còn lại có F = 0"
              >
                Đầy đủ 16 tổ hợp (còn lại F = 0)
              </button>
              <button
                type="button"
                className={`segmented-btn ${ignoreMode === 'bcd_10_15' ? 'active' : ''}`}
                onClick={() => handleIgnoreModeChange('bcd_10_15')}
                title="Mã BCD: Chỉ xét 0..9 hợp lệ, 10..15 là trạng thái cấm X (Đề cương C5, BT C7)"
              >
                Mã BCD (0–9, cấm 10–15)
              </button>
              <button
                type="button"
                className={`segmented-btn ${ignoreMode === 'custom' ? 'active' : ''}`}
                onClick={() => handleIgnoreModeChange('custom')}
                title="Tự nhập danh sách các số trạng thái cấm d/X bất kỳ"
              >
                Tùy chỉnh danh sách cấm
              </button>
            </div>
          </div>

          <div className="input-group-field mt-3">
            <label className="config-label">
              {numSystemMode === 'decimal'
                ? `Nhập các số thập phân mà ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${logicLevelMode === 'sop_high' ? '1' : '0'}:`
                : `Nhập các từ mã nhị phân 4-bit mà ${outputPrefix === 'Y' ? 'Y' : 'F'} = ${logicLevelMode === 'sop_high' ? '1' : '0'}:`}
            </label>
            <div className="input-with-button-row">
              {numSystemMode === 'decimal' ? (
                <input
                  type="text"
                  className="styled-text-input mono font-bold"
                  value={decimalText}
                  onChange={(e) => setDecimalText(e.target.value)}
                  placeholder="Ví dụ: 1, 3, 5, 7, 9, 11, 13, 15"
                />
              ) : (
                <input
                  type="text"
                  className="styled-text-input mono font-bold"
                  value={binaryText}
                  onChange={(e) => setBinaryText(e.target.value)}
                  placeholder="Ví dụ: 0001, 0011, 0101, 0111, 1001, 1011, 1101, 1111"
                />
              )}
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => handleSubmitSingleRule()}
              >
                Áp dụng & Giải bài toán
              </button>
            </div>
          </div>

          {ignoreMode === 'custom' && (
            <div className="input-group-field mt-2">
              <label className="config-label">
                {numSystemMode === 'decimal'
                  ? 'Nhập các số thập phân trạng thái cấm (d / X):'
                  : 'Nhập các từ mã nhị phân trạng thái cấm (d / X):'}
              </label>
              <input
                type="text"
                className="styled-text-input mono font-bold"
                value={numSystemMode === 'decimal' ? customIgnoreDecimalText : customIgnoreBinaryText}
                onChange={(e) => {
                  if (numSystemMode === 'decimal') {
                    setCustomIgnoreDecimalText(e.target.value)
                  } else {
                    setCustomIgnoreBinaryText(e.target.value)
                  }
                }}
                placeholder={
                  numSystemMode === 'decimal'
                    ? 'Ví dụ: 10, 11, 12, 13, 14, 15'
                    : 'Ví dụ: 1010, 1011, 1100, 1101, 1110, 1111'
                }
              />
            </div>
          )}

          <div className="presets-banner-row">
            <span className="helper-label">Chọn nhanh bài toán trong giáo trình & đề thi UNETI:</span>
            <div className="palette-buttons-row">
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([0, 2, 4, 5, 6, 8], 'Chia hết cho 2 hoặc 5 (ĐC C5, BT C7 - BCD)', 'bcd_10_15')}
              >
                Chia hết cho 2 hoặc 5 (ĐC C5, BT C7 - BCD)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15], 'Số bit 1 ≥ Số bit 0 (BT C6)', 'none')}
              >
                Số bit 1 ≥ Số bit 0 (BT C6)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([1, 2, 4, 7, 8, 11, 13, 14], 'Số lượng bit 1 là số lẻ (Slide 4 - Parity)', 'none')}
              >
                Số lượng bit 1 là số lẻ (Slide 4)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([1, 3, 5, 7, 9, 11, 13, 15], 'Số lẻ (Cấm các số chẵn X)', 'remaining_are_unused')}
              >
                Số lẻ (Cấm các số chẵn X)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([1, 3, 5, 7, 9, 11, 13, 15], 'Số lẻ (Đầy đủ 16 tổ hợp, chẵn = 0)', 'none')}
              >
                Số lẻ (Đầy đủ 16 tổ hợp, chẵn = 0)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([0, 2, 4, 6, 8, 10, 12, 14], 'Số chẵn (0, 2, 4, 6...)', 'none')}
              >
                Số chẵn (0, 2, 4, 6...)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([2, 3, 5, 7], 'Số nguyên tố BCD (2, 3, 5, 7 - Cấm 10..15)', 'bcd_10_15')}
              >
                Số nguyên tố BCD (2, 3, 5, 7)
              </button>
            </div>
          </div>
        </div>
      )}

      {subtype === 'code_converter' && (
        <div className="converter-tabs-wrapper">
          <div className="converter-subtabs-row">
            <div className="segmented-control mini">
              <button
                type="button"
                className={`segmented-btn ${converterSubTab === 'presets' ? 'active' : ''}`}
                onClick={() => setConverterSubTab('presets')}
              >
                Chuyển đổi mã chuẩn (5211, Gray, Dư 3, 2421)
              </button>
              <button
                type="button"
                className={`segmented-btn ${converterSubTab === 'custom' ? 'active' : ''}`}
                onClick={() => setConverterSubTab('custom')}
              >
                Tự nhập bảng từ mã bất kỳ
              </button>
            </div>
          </div>

          {converterSubTab === 'presets' && (
            <div className="standard-presets-grid">
              <div className="helper-label mb-2">Các bài toán chuyển đổi mã trong giáo trình & đề thi UNETI:</div>
              <div className="preset-cards-list">
                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleBinaryTo5211}
                >
                  <span className="preset-card-title">Nhị phân 0–9 sang mã 5211 (Bài tập C4)</span>
                  <span className="preset-card-desc">
                    10 tổ hợp nhị phân 0..9 sang 4 bit mã 5211 (F₁...F₄). Các tổ hợp 10..15 là trạng thái cấm (điền X vào bìa Karnaugh).
                  </span>
                </button>

                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleExcess3To5211}
                >
                  <span className="preset-card-title">Mã Dư 3 sang mã 5211 (Đề cương C4)</span>
                  <span className="preset-card-desc">
                    10 tổ hợp hợp lệ từ 3 đến 12 (0011 đến 1100). 0..2 và 13..15 là trạng thái cấm (điền X vào bìa Karnaugh).
                  </span>
                </button>

                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleBcdToGray}
                >
                  <span className="preset-card-title">Mã BCD 0–9 sang Gray 4-bit (Bài tập C9)</span>
                  <span className="preset-card-desc">
                    Chuyển đổi 10 tổ hợp BCD sang 4 bit mã Gray G₃, G₂, G₁, G₀. Các tổ hợp 10..15 là trạng thái cấm (điền X).
                  </span>
                </button>

                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleBinaryToExcess3Ring}
                >
                  <span className="preset-card-title">Nhị phân 0–9 sang Mã vòng dư 3 (Bài tập C5)</span>
                  <span className="preset-card-desc">
                    Chuyển đổi 10 tổ hợp nhị phân sang mã vòng dư 3 (F₁...F₄). Các tổ hợp 10..15 là trạng thái cấm (điền X).
                  </span>
                </button>

                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleBinaryToGray}
                >
                  <span className="preset-card-title">Nhị phân 16 tổ hợp sang Gray (Slide 4, 5)</span>
                  <span className="preset-card-desc">
                    Chuyển đổi đầy đủ 16 tổ hợp nhị phân 4-bit sang mã Gray phản xạ (G₃, G₂, G₁, G₀).
                  </span>
                </button>

                <button
                  type="button"
                  className="preset-card-item"
                  onClick={handleRuleBcdTo2421}
                >
                  <span className="preset-card-title">Mã BCD 0–9 sang mã 2421 (Aiken)</span>
                  <span className="preset-card-desc">
                    Chuyển đổi 10 tổ hợp BCD sang mã tự bù 2421. Các tổ hợp 10..15 là trạng thái cấm (điền X).
                  </span>
                </button>
              </div>
            </div>
          )}

          {converterSubTab === 'custom' && (
            <div className="custom-table-input-box">
              <label className="config-label">
                Nhập danh sách các từ mã đầu ra (4 bit mỗi từ mã, cách nhau bằng dấu phẩy, khoảng trắng hoặc xuống dòng):
              </label>
              <div className="custom-config-row">
                <span className="sub-label">Số thập phân bắt đầu:</span>
                <div className="segmented-control mini">
                  <button
                    type="button"
                    className={`segmented-btn ${customStartDec === 0 ? 'active' : ''}`}
                    onClick={() => setCustomStartDec(0)}
                  >
                    Bắt đầu từ 0 (BCD, Nhị phân 0–9)
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${customStartDec === 3 ? 'active' : ''}`}
                    onClick={() => setCustomStartDec(3)}
                  >
                    Bắt đầu từ 3 (Mã Dư 3: 3–12)
                  </button>
                </div>
              </div>

              <textarea
                className="styled-textarea mono font-bold"
                rows={3}
                value={customCodesText}
                onChange={(e) => setCustomCodesText(e.target.value)}
                placeholder="Ví dụ: 0000, 0001, 0100, 0101, 0111, 1000, 1001, 1100, 1101, 1111"
              />

              <div className="custom-actions-row">
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={handleApplyCustomConverterTable}
                >
                  Áp dụng bảng mã vào hệ thống
                </button>
                <span className="helper-note">
                  Mẹo: Sau khi áp dụng, bạn cũng có thể click trực tiếp vào từng ô bit 0/1 trên Bảng trạng thái (Bước 2) để chỉnh sửa!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {subtype === 'seven_segment' && (
        <div className="seven-seg-controls-box">
          <div className="presets-banner-row">
            <span className="helper-label">Đề thi thường gặp:</span>
            <div className="palette-buttons-row">
              {COMMON_7SEG_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="helper-pill-btn"
                  onClick={() => handleApplyPreset7Seg(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group-field">
            <div className="input-field-header">
              <label className="config-label">
                Chuỗi ký tự đề bài yêu cầu hiển thị:
              </label>
              <div className="input-actions-tiny">
                <button
                  type="button"
                  className="tiny-action-btn"
                  onClick={handleRemoveLastChar}
                >
                  Xóa lùi
                </button>
                <button
                  type="button"
                  className="tiny-action-btn danger"
                  onClick={handleClearChars}
                >
                  Xóa hết
                </button>
              </div>
            </div>
            <input
              type="text"
              className="styled-text-input mono text-lg font-bold"
              value={sevenSegChars}
              onChange={(e) => onSevenSegCharsChange(e.target.value.replace(/\s+/g, ''))}
              placeholder="Ví dụ: 56789AEdPH hoặc 456789AbC hoặc 123456789A"
            />
          </div>

          <div className="palette-tabs-container">
            <div className="palette-nav-header">
              <span className="palette-label">Chọn nhanh ký tự đưa vào thanh ghi:</span>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${activePaletteTab === 'digits' ? 'active' : ''}`}
                  onClick={() => setActivePaletteTab('digits')}
                >
                  Chữ số (0–9)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${activePaletteTab === 'letters' ? 'active' : ''}`}
                  onClick={() => setActivePaletteTab('letters')}
                >
                  Chữ cái (A–Z)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${activePaletteTab === 'symbols' ? 'active' : ''}`}
                  onClick={() => setActivePaletteTab('symbols')}
                >
                  Ký hiệu (° Độ, -, =, _)
                </button>
              </div>
            </div>

            <div className="palette-buttons-row">
              {activePaletteTab === 'digits' &&
                DIGIT_CHARS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="char-chip-btn"
                    onClick={() => handleAddChar(ch)}
                  >
                    {ch}
                  </button>
                ))}

              {activePaletteTab === 'letters' &&
                LETTER_CHARS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="char-chip-btn"
                    onClick={() => handleAddChar(ch)}
                  >
                    {ch}
                  </button>
                ))}

              {activePaletteTab === 'symbols' &&
                SYMBOL_CHARS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="char-chip-btn"
                    onClick={() => handleAddChar(ch)}
                  >
                    {ch}
                  </button>
                ))}
            </div>
          </div>

          <div className="segments-selector-row">
            <span className="config-label">Các thanh giải mã đầu ra:</span>
            <div className="segments-checkbox-group">
              {(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as SegmentName[]).map((seg) => {
                const isSelected = selectedOutputs.includes(seg)
                return (
                  <button
                    key={seg}
                    type="button"
                    className={`segment-toggle-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedOutputs.length > 1) {
                          onSelectedOutputsChange(selectedOutputs.filter((s) => s !== seg))
                        }
                      } else {
                        const allOrder: SegmentName[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
                        const next = [...selectedOutputs, seg].sort(
                          (a, b) => allOrder.indexOf(a as SegmentName) - allOrder.indexOf(b as SegmentName)
                        )
                        onSelectedOutputsChange(next)
                      }
                    }}
                  >
                    Thanh {seg}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {validationError && (
        <div className="validation-alert error">
          <span>{validationError}</span>
        </div>
      )}

      {validationSuccess && (
        <div className="validation-alert success">
          <span>{validationSuccess}</span>
        </div>
      )}
    </div>
  )
}
