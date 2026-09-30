import type { CellValue, KMapGroup, Literal, OptimizationForm, VariableCount } from '../types'

const GRAY_1 = [0, 1]
const GRAY_2 = [0, 1, 3, 2]

export const GROUP_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#ea580c',
  '#4f46e5'
]

export function getVariableNames(count: VariableCount): string[] {
  if (count === 2) return ['A', 'B']
  if (count === 3) return ['A', 'B', 'C']
  return ['A', 'B', 'C', 'D']
}

export function getGridDimensions(count: VariableCount): { rowCount: number; colCount: number; rowVars: string[]; colVars: string[] } {
  if (count === 2) {
    return { rowCount: 2, colCount: 2, rowVars: ['A'], colVars: ['B'] }
  }
  if (count === 3) {
    return { rowCount: 2, colCount: 4, rowVars: ['A'], colVars: ['B', 'C'] }
  }
  return { rowCount: 4, colCount: 4, rowVars: ['A', 'B'], colVars: ['C', 'D'] }
}

export function getRowGrayCodes(count: VariableCount): number[] {
  return count === 4 ? GRAY_2 : GRAY_1
}

export function getColGrayCodes(count: VariableCount): number[] {
  return count === 2 ? GRAY_1 : GRAY_2
}

export function formatGray(val: number, bits: number): string {
  return val.toString(2).padStart(bits, '0')
}

export function cellToMinterm(count: VariableCount, rowIdx: number, colIdx: number): number {
  const rowGrays = getRowGrayCodes(count)
  const colGrays = getColGrayCodes(count)
  const rowVal = rowGrays[rowIdx]
  const colVal = colGrays[colIdx]

  if (count === 2) {
    return (rowVal << 1) | colVal
  }
  if (count === 3) {
    return (rowVal << 2) | colVal
  }
  return (rowVal << 2) | colVal
}

export function mintermToCell(count: VariableCount, minterm: number): { rowIdx: number; colIdx: number } {
  const rowGrays = getRowGrayCodes(count)
  const colGrays = getColGrayCodes(count)

  let rowVal = 0
  let colVal = 0

  if (count === 2) {
    rowVal = (minterm >> 1) & 1
    colVal = minterm & 1
  } else if (count === 3) {
    rowVal = (minterm >> 2) & 1
    colVal = minterm & 3
  } else {
    rowVal = (minterm >> 2) & 3
    colVal = minterm & 3
  }

  const rowIdx = rowGrays.indexOf(rowVal)
  const colIdx = colGrays.indexOf(colVal)
  return { rowIdx, colIdx }
}

export function parseNumberList(input: string): number[] {
  if (!input || !input.trim()) return []
  const matches = input.match(/\d+/g)
  if (!matches) return []
  return Array.from(new Set(matches.map(Number))).sort((a, b) => a - b)
}

export function parseExpression(expr: string, count: VariableCount): { minterms: number[]; dontCares: number[] } {
  const clean = expr.replace(/\s+/g, '').toUpperCase()
  if (!clean) return { minterms: [], dontCares: [] }

  const variables = getVariableNames(count)
  const totalCells = 1 << count
  const minterms: number[] = []

  const terms = clean.split('+').filter(Boolean)

  for (let m = 0; m < totalCells; m++) {
    const bitMap: Record<string, number> = {}
    for (let i = 0; i < count; i++) {
      const bit = (m >> (count - 1 - i)) & 1
      bitMap[variables[i]] = bit
    }

    let cellMatches = false
    for (const term of terms) {
      let termSatisfied = true
      let i = 0
      while (i < term.length) {
        let isNeg = false
        if (term[i] === '!' || term[i] === '~') {
          isNeg = true
          i++
        }
        const ch = term[i]
        i++
        if (i < term.length && (term[i] === "'" || term[i] === '’')) {
          isNeg = !isNeg
          i++
        }

        if (variables.includes(ch)) {
          const expectedVal = isNeg ? 0 : 1
          if (bitMap[ch] !== expectedVal) {
            termSatisfied = false
            break
          }
        }
      }

      if (termSatisfied) {
        cellMatches = true
        break
      }
    }

    if (cellMatches) {
      minterms.push(m)
    }
  }

  return { minterms, dontCares: [] }
}

interface RectGroup {
  rowIndices: number[]
  colIndices: number[]
  cells: number[]
}

function findPrimeImplicants(
  count: VariableCount,
  grid: Record<number, CellValue>,
  form: OptimizationForm
): RectGroup[] {
  const { rowCount, colCount } = getGridDimensions(count)
  const targetVal: CellValue = form === 'SOP' ? 1 : 0

  const validHeights = count === 4 ? [4, 2, 1] : [2, 1]
  const validWidths = count === 2 ? [2, 1] : [4, 2, 1]

  const candidateGroups: RectGroup[] = []

  for (const h of validHeights) {
    for (const w of validWidths) {
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          const rowIndices: number[] = []
          for (let dr = 0; dr < h; dr++) {
            rowIndices.push((r + dr) % rowCount)
          }

          const colIndices: number[] = []
          for (let dc = 0; dc < w; dc++) {
            colIndices.push((c + dc) % colCount)
          }

          let isValid = true
          let hasTarget = false
          const cells: number[] = []

          for (const row of rowIndices) {
            for (const col of colIndices) {
              const m = cellToMinterm(count, row, col)
              cells.push(m)
              const v = grid[m]
              if (v !== targetVal && v !== 'd') {
                isValid = false
                break
              }
              if (v === targetVal) {
                hasTarget = true
              }
            }
            if (!isValid) break
          }

          if (isValid && hasTarget) {
            const sortedCells = Array.from(new Set(cells)).sort((a, b) => a - b)
            candidateGroups.push({
              rowIndices: Array.from(new Set(rowIndices)).sort((a, b) => a - b),
              colIndices: Array.from(new Set(colIndices)).sort((a, b) => a - b),
              cells: sortedCells
            })
          }
        }
      }
    }
  }

  const uniqueCandidates: RectGroup[] = []
  const seenKey = new Set<string>()

  for (const group of candidateGroups) {
    const key = group.cells.join(',')
    if (!seenKey.has(key)) {
      seenKey.add(key)
      uniqueCandidates.push(group)
    }
  }

  const primeImplicants: RectGroup[] = []
  for (let i = 0; i < uniqueCandidates.length; i++) {
    const a = uniqueCandidates[i]
    let isSubset = false
    for (let j = 0; j < uniqueCandidates.length; j++) {
      if (i === j) continue
      const b = uniqueCandidates[j]
      if (b.cells.length > a.cells.length && a.cells.every((c) => b.cells.includes(c))) {
        isSubset = true
        break
      }
    }
    if (!isSubset) {
      primeImplicants.push(a)
    }
  }

  return primeImplicants
}

function selectCover(
  targetCells: number[],
  primeImplicants: RectGroup[]
): RectGroup[] {
  if (targetCells.length === 0) return []

  const uncovered = new Set(targetCells)
  const chosen: RectGroup[] = []

  let foundEssential = true
  while (foundEssential && uncovered.size > 0) {
    foundEssential = false
    for (const cell of Array.from(uncovered)) {
      const covering = primeImplicants.filter((p) => p.cells.includes(cell) && !chosen.includes(p))
      if (covering.length === 1) {
        const essential = covering[0]
        chosen.push(essential)
        for (const c of essential.cells) {
          uncovered.delete(c)
        }
        foundEssential = true
        break
      }
    }
  }

  while (uncovered.size > 0) {
    let bestGroup: RectGroup | null = null
    let maxCoverCount = -1

    for (const group of primeImplicants) {
      if (chosen.includes(group)) continue
      let count = 0
      for (const c of group.cells) {
        if (uncovered.has(c)) count++
      }
      if (count > maxCoverCount) {
        maxCoverCount = count
        bestGroup = group
      } else if (count === maxCoverCount && bestGroup && group.cells.length > bestGroup.cells.length) {
        bestGroup = group
      }
    }

    if (!bestGroup || maxCoverCount <= 0) break

    chosen.push(bestGroup)
    for (const c of bestGroup.cells) {
      uncovered.delete(c)
    }
  }

  return chosen
}

function deriveTerm(
  count: VariableCount,
  cells: number[],
  form: OptimizationForm
): { literals: Literal[]; eliminated: string[]; kept: string[]; latex: string; raw: string } {
  const variables = getVariableNames(count)
  const total = cells.length

  const literals: Literal[] = []
  const eliminated: string[] = []
  const kept: string[] = []

  for (let bitIdx = 0; bitIdx < count; bitIdx++) {
    const shift = count - 1 - bitIdx
    const vName = variables[bitIdx]

    let countZero = 0
    let countOne = 0

    for (const m of cells) {
      const bit = (m >> shift) & 1
      if (bit === 1) countOne++
      else countZero++
    }

    if (countZero === total) {
      kept.push(vName)
      if (form === 'SOP') {
        literals.push({ variable: vName, inverted: true })
      } else {
        literals.push({ variable: vName, inverted: false })
      }
    } else if (countOne === total) {
      kept.push(vName)
      if (form === 'SOP') {
        literals.push({ variable: vName, inverted: false })
      } else {
        literals.push({ variable: vName, inverted: true })
      }
    } else {
      eliminated.push(vName)
    }
  }

  let latex = ''
  let raw = ''

  if (literals.length === 0) {
    latex = form === 'SOP' ? '1' : '0'
    raw = latex
  } else if (form === 'SOP') {
    latex = literals.map((l) => (l.inverted ? `\\overline{${l.variable}}` : l.variable)).join('.')
    raw = literals.map((l) => (l.inverted ? `~${l.variable}` : l.variable)).join('')
  } else {
    latex = `(${literals.map((l) => (l.inverted ? `\\overline{${l.variable}}` : l.variable)).join(' + ')})`
    raw = `(${literals.map((l) => (l.inverted ? `~${l.variable}` : l.variable)).join('+')})`
  }

  return { literals, eliminated, kept, latex, raw }
}

export function solveKMap(
  count: VariableCount,
  grid: Record<number, CellValue>,
  form: OptimizationForm
): { groups: KMapGroup[]; simplifiedLatex: string; simplifiedPlain: string } {
  const totalCells = 1 << count
  const targetVal: CellValue = form === 'SOP' ? 1 : 0

  const targetCells: number[] = []
  for (let i = 0; i < totalCells; i++) {
    if (grid[i] === targetVal) {
      targetCells.push(i)
    }
  }

  if (targetCells.length === 0) {
    const defaultVal = form === 'SOP' ? '0' : '1'
    return {
      groups: [],
      simplifiedLatex: defaultVal,
      simplifiedPlain: defaultVal
    }
  }

  const allAreTargetOrDC = Object.values(grid).every((v) => v === targetVal || v === 'd')
  if (allAreTargetOrDC && targetCells.length > 0) {
    const fullGroup: KMapGroup = {
      id: 'group-0',
      label: form === 'SOP' ? 'N_1' : 'V_1',
      cells: Array.from({ length: totalCells }, (_, i) => i),
      rowIndices: Array.from({ length: count === 4 ? 4 : 2 }, (_, i) => i),
      colIndices: Array.from({ length: count === 2 ? 2 : 4 }, (_, i) => i),
      literals: [],
      eliminatedVariables: getVariableNames(count),
      keptVariables: [],
      termLatex: form === 'SOP' ? '1' : '0',
      rawTerm: form === 'SOP' ? '1' : '0',
      color: GROUP_COLORS[0]
    }
    const val = form === 'SOP' ? '1' : '0'
    return {
      groups: [fullGroup],
      simplifiedLatex: val,
      simplifiedPlain: val
    }
  }

  const primes = findPrimeImplicants(count, grid, form)
  const chosenRects = selectCover(targetCells, primes)

  chosenRects.sort((a, b) => b.cells.length - a.cells.length || a.cells[0] - b.cells[0])

  const groups: KMapGroup[] = chosenRects.map((rect, idx) => {
    const derived = deriveTerm(count, rect.cells, form)
    const label = form === 'SOP' ? `N_${idx + 1}` : `V_${idx + 1}`
    return {
      id: `group-${idx}`,
      label,
      cells: rect.cells,
      rowIndices: rect.rowIndices,
      colIndices: rect.colIndices,
      literals: derived.literals,
      eliminatedVariables: derived.eliminated,
      keptVariables: derived.kept,
      termLatex: derived.latex,
      rawTerm: derived.raw,
      color: GROUP_COLORS[idx % GROUP_COLORS.length]
    }
  })

  let simplifiedLatex = ''
  let simplifiedPlain = ''

  if (groups.length === 0) {
    simplifiedLatex = form === 'SOP' ? '0' : '1'
    simplifiedPlain = simplifiedLatex
  } else if (form === 'SOP') {
    simplifiedLatex = groups.map((g) => g.termLatex).join(' + ')
    simplifiedPlain = groups.map((g) => g.rawTerm).join(' + ')
  } else {
    simplifiedLatex = groups.map((g) => g.termLatex).join('.')
    simplifiedPlain = groups.map((g) => g.rawTerm).join('.')
  }

  return { groups, simplifiedLatex, simplifiedPlain }
}
