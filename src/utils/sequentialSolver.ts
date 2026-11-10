import type { CellValue, KMapGroup, OptimizationForm, VariableCount } from '../types'
import { solveKMap } from './kmapSolver'

export type FlipFlopType = 'JK' | 'RS' | 'D' | 'T'
export type CountDirection = 'up' | 'down'
export type UnusedPolicy = 'dontcare' | 'recover'
export const FF_INPUTS: Record<FlipFlopType, string[]> = { JK: ['J', 'K'], RS: ['R', 'S'], D: ['D'], T: ['T'] }
export interface SequentialOutput {
  name: string
  gridValues: Record<number, CellValue>
  groups: KMapGroup[]
  simplifiedLatex: string
  simplifiedPlain: string
  form: OptimizationForm
}
export interface CounterResult {
  count: VariableCount | 1
  variables: string[]
  sequence: number[]
  flipFlop: FlipFlopType
  direction: CountDirection
  asynchronous: boolean
  unusedPolicy: UnusedPolicy
  rows: { current: number; next: number | null; excitation: CellValue[] }[]
  outputs: SequentialOutput[]
  resetState: number
  resetOutput?: SequentialOutput
}

export function excitation(type: FlipFlopType, current: number, next: number): CellValue[] {
  if (![0, 1].includes(current) || ![0, 1].includes(next) || !FF_INPUTS[type]) throw new Error('Trạng thái FF phải bằng 0 hoặc 1.')
  if (type === 'D') return [next as CellValue]
  if (type === 'T') return [(current ^ next) as CellValue]
  if (type === 'JK') return current ? ['d', (1 - next) as CellValue] : [next as CellValue, 'd']
  return current ? [(1 - next) as CellValue, next ? 'd' : 0] : [next ? 0 : 'd', next as CellValue]
}

export function nextFlipFlop(type: FlipFlopType, current: number, inputs: number[]): number {
  if (!FF_INPUTS[type] || inputs.length !== FF_INPUTS[type].length || [current, ...inputs].some((b) => b !== 0 && b !== 1)) throw new Error('Đầu vào FF không hợp lệ.')
  if (type === 'D') return inputs[0]
  if (type === 'T') return current ^ inputs[0]
  if (type === 'JK') return (inputs[0] & (1 - current)) | ((1 - inputs[1]) & current)
  if (inputs[0] && inputs[1]) throw new Error('RS-FF: R = S = 1 là trạng thái cấm.')
  return inputs[1] | ((1 - inputs[0]) & current)
}

export function moduloSequence(modulus: number, direction: CountDirection): number[] {
  if (!Number.isInteger(modulus) || modulus < 2 || modulus > 16) throw new Error('Modul phải là số nguyên từ 2 đến 16.')
  return Array.from({ length: modulus }, (_, i) => direction === 'up' ? i : modulus - 1 - i)
}

export function parseStateSequence(text: string): number[] {
  const tokens = text.trim().split(/[\s,;]+/).filter(Boolean)
  if (tokens.length < 2 || tokens.length > 16 || tokens.some((t) => !/^\d+$/.test(t))) throw new Error('Nhập 2–16 trạng thái thập phân, cách nhau bằng dấu phẩy; không lặp trạng thái cuối về đầu.')
  const values = tokens.map(Number)
  if (values.some((n) => n < 0 || n > 15) || new Set(values).size !== values.length) throw new Error('Trạng thái phải từ 0 đến 15 và không trùng nhau.')
  return values
}

export function waveformSequence(first: string, second: string): { sequence: number[]; count: VariableCount | 1; extraBits: number } {
  const clean = (s: string) => s.replace(/[\s,;]+/g, '')
  const z1 = clean(first), z2 = clean(second)
  if (!/^[01]{2,16}$/.test(z1) || !/^[01]{2,16}$/.test(z2) || z1.length !== z2.length) throw new Error('Z1 và Z2 phải cùng độ dài 2–16 bit, không nhập thêm mẫu lặp cuối chu kỳ.')
  const pairs = Array.from(z1, (b, i) => Number(b) * 2 + Number(z2[i]))
  const repetitions = [0, 1, 2, 3].map((p) => pairs.filter((v) => v === p).length)
  const extraBits = Math.ceil(Math.log2(Math.max(...repetitions)))
  const count = 2 + extraBits
  if (count > 4) throw new Error('Một cặp Z1Z2 lặp hơn 4 lần; cách gán trực tiếp của bài giảng cần hơn 4 FF, vượt bìa Karnaugh 4 biến.')
  const occurrences = [0, 0, 0, 0]
  return { sequence: pairs.map((pair) => (pair << extraBits) | occurrences[pair]++), count: count as VariableCount | 1, extraBits }
}

function solveOutput(name: string, count: VariableCount | 1, gridValues: Record<number, CellValue>, variables: string[]): SequentialOutput {
  const padded = count === 1 ? Object.fromEntries([0,1,2,3].map((m) => [m,gridValues[m >> 1]])) : gridValues
  const result = solveKMap(count === 1 ? 2 : count, padded, 'SOP')
  const rename = (text: string) => text.replace(/[ABCD]/g, (letter) => variables[letter.charCodeAt(0)-65] ?? letter)
  const groups = result.groups.map((group) => ({
    ...group, id: `${name}-${group.id}`,
    cells: count === 1 ? [...new Set(group.cells.map((m) => m >> 1))] : group.cells,
    literals: group.literals.map((l) => ({ ...l, variable: rename(l.variable) })),
    termLatex: rename(group.termLatex), rawTerm: rename(group.rawTerm)
  }))
  return { name, gridValues, groups, simplifiedLatex: rename(result.simplifiedLatex), simplifiedPlain: rename(result.simplifiedPlain), form: 'SOP' }

}

export function solveCounter(sequence: number[], flipFlop: FlipFlopType, unusedPolicy: UnusedPolicy = 'dontcare', asynchronous = false, direction: CountDirection = 'up', requestedCount?: VariableCount | 1): CounterResult {
  if (!FF_INPUTS[flipFlop] || !['dontcare', 'recover'].includes(unusedPolicy)) throw new Error('Loại FF hoặc cách xử lý trạng thái thừa không hợp lệ.')
  if (sequence.length < 2 || sequence.length > 16 || sequence.some((n) => !Number.isInteger(n) || n < 0 || n > 15) || new Set(sequence).size !== sequence.length) throw new Error('Chu trình phải có 2–16 trạng thái khác nhau trong khoảng 0–15.')
  const count = requestedCount ?? Math.max(1, Math.ceil(Math.log2(Math.max(...sequence) + 1))) as VariableCount | 1
  if (![1, 2, 3, 4].includes(count) || sequence.some((n) => n >= 1 << count)) throw new Error('Số FF không đủ biểu diễn trạng thái.')
  if (asynchronous && sequence.join(',') !== moduloSequence(sequence.length, direction).join(',')) throw new Error('Bộ đếm không đồng bộ dùng chu trình nhị phân tiến/lùi; chu trình tùy ý dùng thiết kế đồng bộ.')
  const variables = Array.from({ length: count }, (_, i) => i).map((_, i) => `Q_${i + 1}`)
  const pins = FF_INPUTS[flipFlop]
  const rows = Array.from({ length: 1 << count }, (_, current) => {
    const index = sequence.indexOf(current)
    const next = index >= 0 ? sequence[(index + 1) % sequence.length] : unusedPolicy === 'recover' && !asynchronous ? sequence[0] : null
    const values = Array.from({ length: count }, (_, i) => {
      const bit = (current >> (count - 1 - i)) & 1
      if (asynchronous) return flipFlop === 'RS' ? [bit as CellValue, (1 - bit) as CellValue] : flipFlop === 'D' ? [(1 - bit) as CellValue] : pins.map((): CellValue => 1)
      return next === null ? pins.map((): CellValue => 'd') : excitation(flipFlop, bit, (next >> (count - 1 - i)) & 1)
    }).flat()
    return { current, next, excitation: values }
  })
  const outputs = variables.flatMap((_, index) => pins.map((pin, pinIndex) => {
    const gridValues: Record<number, CellValue> = {}
    for (const row of rows) {
      const bit = (row.current >> (count - 1 - index)) & 1
      gridValues[row.current] = asynchronous ? flipFlop === 'RS' ? pin === 'R' ? bit as CellValue : (1 - bit) as CellValue : flipFlop === 'D' ? (1 - bit) as CellValue : 1 : row.excitation[index * pins.length + pinIndex]
    }
    return solveOutput(`${pin}_${index + 1}`, count, gridValues, variables)
  }))
  const terminal = direction === 'up' ? sequence.length : (1 << count) - 1
  const resetOutput = asynchronous && sequence.length < 1 << count
    ? solveOutput('LOAD', count, Object.fromEntries(rows.map((r) => [r.current, r.current === terminal ? 1 : 0])), variables)
    : undefined
  const orderedRows = [...sequence.map((state) => rows[state]), ...rows.filter((row) => !sequence.includes(row.current))]
  return { count, variables, sequence: [...sequence], flipFlop, direction, asynchronous, unusedPolicy, rows: orderedRows, outputs, resetState: sequence[0], resetOutput }
}

export function evaluateOutput(output: SequentialOutput, state: number, variables: string[]): number {
  const terms = output.groups.map((g) => {
    const bits = g.literals.map((l) => Boolean((state >> (variables.length - 1 - variables.indexOf(l.variable))) & 1) !== l.inverted)
    return output.form === 'SOP' ? bits.every(Boolean) : bits.some(Boolean)
  })
  return +(output.form === 'SOP' ? terms.some(Boolean) : terms.every(Boolean))
}

export function stepCounter(result: CounterResult, state: number): number {
  if (!Number.isInteger(state) || state < 0 || state >= 1 << result.count) throw new Error('Trạng thái nằm ngoài số FF.')
  if (result.asynchronous) {
    if (!result.sequence.includes(state)) throw new Error('Mô phỏng ripple bắt đầu ở trạng thái hợp lệ; dùng nạp ban đầu để khởi tạo.')
    let value = state
    const pinCount = FF_INPUTS[result.flipFlop].length
    for (let bit = 0; bit < result.count; bit++) {
      const oldBit = (value >> bit) & 1
      const offset = (result.count - 1 - bit) * pinCount
      const controls = result.outputs.slice(offset, offset + pinCount).map((out) => evaluateOutput(out, value, result.variables))
      const newBit = nextFlipFlop(result.flipFlop, oldBit, controls)
      value = (value & ~(1 << bit)) | (newBit << bit)
      // Falling Q clocks the next up-counter stage; falling /Q clocks a down-counter stage.
      if (result.direction === 'up' ? oldBit !== 1 || newBit !== 0 : oldBit !== 0 || newBit !== 1) break
    }
    if (result.direction === 'up' && value === result.sequence.length) return 0
    if (result.direction === 'down' && state === 0) return result.sequence.length - 1
    return value
  }
  if (!result.sequence.includes(state) && result.unusedPolicy === 'dontcare') throw new Error('Trạng thái tùy định: không bảo đảm chu trình; cần nạp trạng thái đầu.')
  const pinCount = FF_INPUTS[result.flipFlop].length
  let next = 0
  for (let bit = 0; bit < result.count; bit++) {
    const inputs = result.outputs.slice(bit * pinCount, (bit + 1) * pinCount).map((out) => evaluateOutput(out, state, result.variables))
    next = (next << 1) | nextFlipFlop(result.flipFlop, (state >> (result.count - 1 - bit)) & 1, inputs)
  }
  return next
}

export function convertFlipFlop(available: FlipFlopType, desired: FlipFlopType) {
  if (!FF_INPUTS[available] || !FF_INPUTS[desired]) throw new Error('Loại FF không hợp lệ.')
  const variables = [...FF_INPUTS[desired], 'Q']
  const count = variables.length as VariableCount | 1
  const rows = Array.from({ length: 1 << count }, (_, m) => {
    const bits = variables.map((_, i) => (m >> (count - 1 - i)) & 1)
    const current = bits.at(-1)!
    const invalid = desired === 'RS' && bits[0] === 1 && bits[1] === 1
    const next = invalid ? null : nextFlipFlop(desired, current, bits.slice(0, -1))
    return { decimal: m, bits, next, excitation: next === null ? FF_INPUTS[available].map((): CellValue => 'd') : excitation(available, current, next) }
  })
  const outputs = FF_INPUTS[available].map((pin, i) => solveOutput(pin, count, Object.fromEntries(rows.map((r) => [r.decimal, r.excitation[i]])), variables))
  return { variables, count, rows, outputs, available, desired }
}

export function shiftRegister(word: string, direction: 'left' | 'right', serial: string): { word: string; shiftedOut: string } {
  if (!/^[01]{1,8}$/.test(word) || !/^[01]$/.test(serial) || !['left', 'right'].includes(direction)) throw new Error('Thanh ghi gồm 1–8 bit, đầu vào nối tiếp bằng 0 hoặc 1.')
  return direction === 'left' ? { word: word.slice(1) + serial, shiftedOut: word[0] } : { word: serial + word.slice(0, -1), shiftedOut: word.at(-1)! }
}

export function registerCycle(count: number, johnson: boolean): number[] {
  if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error('Bộ đếm vòng/Johnson dùng 1–4 FF.')
  let word = johnson ? '0'.repeat(count) : '1' + '0'.repeat(count - 1)
  const initial = word
  const sequence: number[] = []
  do {
    sequence.push(parseInt(word, 2))
    const serial = johnson ? String(1 - Number(word[0])) : word[0]
    word = shiftRegister(word, 'left', serial).word
  } while (word !== initial && sequence.length <= 16)
  return sequence
}
