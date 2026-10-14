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

function pruneRedundant(groups: RectGroup[], targetCells: number[]): RectGroup[] {
  const result = [...groups]
  result.sort((a, b) => a.cells.length - b.cells.length)

  for (let i = result.length - 1; i >= 0; i--) {
    const otherCells = new Set<number>()
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue
      for (const c of result[j].cells) {
        otherCells.add(c)
      }
    }
    const allCovered = targetCells.every((c) => otherCells.has(c))
    if (allCovered) {
      result.splice(i, 1)
    }
  }
  return result
}

function selectCover(
  targetCells: number[],
  primeImplicants: RectGroup[]
): RectGroup[] {
  if (targetCells.length === 0) return []
  const targetSet = new Set(targetCells)
  const validPrimes = primeImplicants.filter((p) => p.cells.some((c) => targetSet.has(c)))

  const essential: RectGroup[] = []
  const remainingTargets = new Set(targetCells)

  let changed = true
  while (changed) {
    changed = false
    for (const cell of Array.from(remainingTargets)) {
      const covering = validPrimes.filter((p) => p.cells.includes(cell))
      if (covering.length === 1) {
        const prime = covering[0]
        if (!essential.includes(prime)) {
          essential.push(prime)
          for (const c of prime.cells) {
            remainingTargets.delete(c)
          }
          changed = true
          break
        }
      }
    }
  }

  if (remainingTargets.size === 0) {
    return pruneRedundant(essential, targetCells)
  }

  const remainingPrimes = validPrimes.filter(
    (p) => !essential.includes(p) && p.cells.some((c) => remainingTargets.has(c))
  )
  remainingPrimes.sort((a, b) => b.cells.length - a.cells.length)

  let bestCover: RectGroup[] | null = null

  function search(currentCover: RectGroup[], uncovered: Set<number>) {
    if (uncovered.size === 0) {
      if (!bestCover || currentCover.length < bestCover.length) {
        bestCover = [...currentCover]
      } else if (currentCover.length === bestCover.length) {
        const curSize = currentCover.reduce((sum, g) => sum + g.cells.length, 0)
        const bestSize = bestCover.reduce((sum, g) => sum + g.cells.length, 0)
        if (curSize > bestSize) {
          bestCover = [...currentCover]
        }
      }
      return
    }

    if (bestCover && currentCover.length >= bestCover.length) return

    let minCandidates: RectGroup[] | null = null

    for (const cell of uncovered) {
      const candidates = remainingPrimes.filter(
        (p) => p.cells.includes(cell) && !currentCover.includes(p)
      )
      if (!minCandidates || candidates.length < minCandidates.length) {
        minCandidates = candidates
      }
    }

    if (!minCandidates || minCandidates.length === 0) return

    for (const cand of minCandidates) {
      const nextUncovered = new Set(uncovered)
      for (const c of cand.cells) {
        nextUncovered.delete(c)
      }
      search([...currentCover, cand], nextUncovered)
    }
  }

  search(essential, remainingTargets)
  return pruneRedundant(bestCover || essential, targetCells)
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

  const derivedPrimes = chosenRects.map((rect) => {
    const derived = deriveTerm(count, rect.cells, form)
    return { rect, derived }
  })

  derivedPrimes.sort((a, b) => {
    const litsA = a.derived.literals
    const litsB = b.derived.literals

    for (let i = 0; i < Math.min(litsA.length, litsB.length); i++) {
      const cmp = litsA[i].variable.localeCompare(litsB[i].variable)
      if (cmp !== 0) return cmp
      if (litsA[i].inverted !== litsB[i].inverted) {
        return litsA[i].inverted ? 1 : -1
      }
    }
    if (litsA.length !== litsB.length) {
      return litsA.length - litsB.length
    }
    return b.rect.cells.length - a.rect.cells.length || a.rect.cells[0] - b.rect.cells[0]
  })

  const groups: KMapGroup[] = derivedPrimes.map((item, idx) => {
    const { rect, derived } = item
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
