export type VariableCount = 2 | 3 | 4

export type CellValue = 0 | 1 | 'd'

export type InputMode = 'minterms' | 'maxterms' | 'expression' | 'manual'

export type OptimizationForm = 'SOP' | 'POS'

export type TargetGateType = 'basic' | 'nand_2' | 'nand_n' | 'nor_2' | 'nor_n'

export interface Literal {
  variable: string
  inverted: boolean
}

export interface KMapGroup {
  id: string
  label: string
  cells: number[]
  rowIndices: number[]
  colIndices: number[]
  literals: Literal[]
  eliminatedVariables: string[]
  keptVariables: string[]
  termLatex: string
  rawTerm: string
  color: string
}

export interface TransformationStep {
  title: string
  description: string
  ruleName?: string
  ruleFormula?: string
  latex: string
}

export interface CircuitNode {
  id: string
  type: 'input' | 'not' | 'and' | 'or' | 'nand' | 'nor' | 'output'
  label?: string
  x: number
  y: number
  inputs: string[]
  invertedInputs?: boolean[]
  tiedInput?: boolean
}

export interface WireConnection {
  fromNodeId: string
  toNodeId: string
  fromPin?: number
  toPin?: number
  busLine?: string
  isDirectBusTap?: boolean
  points: { x: number; y: number }[]
  color?: string
}

export interface CircuitDiagram {
  width: number
  height: number
  railXMap: Record<string, number>
  nodes: CircuitNode[]
  wires: WireConnection[]
  taps: { x: number; y: number }[]
}

export interface SolverResult {
  variableCount: VariableCount
  variables: string[]
  form: OptimizationForm
  minterms: number[]
  maxterms: number[]
  dontCares: number[]
  gridValues: Record<number, CellValue>
  groups: KMapGroup[]
  simplifiedLatex: string
  simplifiedPlain: string
  transformationSteps: TransformationStep[]
  circuitBasic: CircuitDiagram
  circuitTarget: CircuitDiagram
  targetGateType: TargetGateType
}

export type ExamProblemType = 'cau_1' | 'cau_2'

export type CombinationalSubtype = 'single_rule' | 'code_converter' | 'seven_segment'

export type SingleRuleIgnoreMode = 'remaining_are_unused' | 'none' | 'bcd_10_15' | 'custom'

export type LedPolarity = 'cathode_common' | 'anode_common'

export interface CombinationalRow {
  id: string
  decimal: number
  inputBits: number[]
  outputBits: (number | 'X')[]
  displayChar?: string
  isUnused?: boolean
}

export interface CombinationalOutputResult {
  name: string
  groups: KMapGroup[]
  simplifiedLatex: string
  simplifiedPlain: string
  gridValues: Record<number, CellValue>
}
