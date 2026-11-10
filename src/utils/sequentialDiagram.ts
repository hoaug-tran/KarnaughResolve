import type { Literal } from '../types'
import type { FlipFlopType, SequentialOutput } from './sequentialSolver'
import { FF_INPUTS } from './sequentialSolver'

export function layoutSequentialDiagram(variables: string[], outputs: SequentialOutput[], flipFlop: FlipFlopType, unindexed = false, resetOutput?: SequentialOutput, extraSignals: string[] = []) {
  const rails = [...variables,...extraSignals].flatMap((variable, bit) => [false, true].map((inverted, polarity) => ({ variable, inverted, y: 44 + (bit * 2 + polarity) * 25 })))
  const termY = 44 + rails.length * 25 + 90
  let left = 180
  const blocks = variables.map((variable, index) => {
    const pins = FF_INPUTS[flipFlop].map((pin) => {
      const name = unindexed ? pin : `${pin}_${index + 1}`
      const output = outputs.find((out) => out.name === name)
      if (!output) throw new Error(`Thiếu hàm kích ${name}`)
      return { name, output, width: Math.max(80, output.groups.length * 70), x: 0 }
    })
    const width = Math.max(240, pins.reduce((sum, pin) => sum + pin.width, 0) + 50)
    let pinLeft = left + 25
    for (const pin of pins) { pin.x = pinLeft + pin.width / 2; pinLeft += pin.width }
    const center = left + width / 2
    const block = { variable, center, left, width, pins }
    left += width + 50
    return block
  })
  const maxGroups = Math.max(1, ...outputs.map((out) => out.groups.length), resetOutput?.groups.length ?? 0)
  const collectorY = termY + 90 + maxGroups * 12
  const ffY = collectorY + 105
  const width = Math.max(620, left + (resetOutput ? Math.max(180,resetOutput.groups.length * 70 + 60) : 30))
  const height = ffY + 250
  const railFor = (literal: Literal) => {
    const rail = rails.find((r) => r.variable === literal.variable && r.inverted === literal.inverted)
    if (!rail) throw new Error(`Không có thanh tín hiệu ${literal.variable}`)
    return rail
  }
  for (const output of [...outputs,...(resetOutput ? [resetOutput] : [])]) for (const group of output.groups) group.literals.forEach(railFor)
  return { rails, blocks, termY, collectorY, ffY, width, height, railFor, resetX: left + (width-left)/2 }
}

export function registerOutputs(width:number,direction:'left'|'right',feedback:'serial'|'ring'|'johnson',type:FlipFlopType):SequentialOutput[] {
  const lit=(variable:string,inverted=false):Literal=>({variable,inverted})
  const not=(value:Literal):Literal=>({...value,inverted:!value.inverted})
  return Array.from({length:width},(_,i)=>{
    const bit=i+1,own=lit(`Q_${bit}`)
    const entry=direction==='left'?bit===width:bit===1
    const data=entry?feedback==='serial'?lit('SI'):lit(direction==='left'?'Q_1':`Q_${width}`,feedback==='johnson'):lit(`Q_${direction==='left'?bit+1:bit-1}`)
    const values:Literal[][][]=type==='D'?[[[data]]]:type==='JK'?[[[data]],[[not(data)]]]:type==='RS'?[[[own,not(data)]],[[not(own),data]]]:[[[own,not(data)],[not(own),data]]]
    return FF_INPUTS[type].map((pin,pinIndex)=>{
      const terms=values[pinIndex].filter((term)=>!term.some((a)=>term.some((b)=>a.variable===b.variable&&a.inverted!==b.inverted))).map((term)=>term.filter((a,j)=>term.findIndex((b)=>a.variable===b.variable&&a.inverted===b.inverted)===j))
      const latex=(term:Literal[])=>term.map((l)=>l.inverted?`\\overline{${l.variable}}`:l.variable).join('.')
      return {name:`${pin}_${bit}`,gridValues:{},form:'SOP' as const,simplifiedLatex:terms.length?terms.map(latex).join('+'):'0',simplifiedPlain:'',groups:terms.map((term,j)=>({id:`${pin}-${bit}-${j}`,label:`N_${j+1}`,cells:[],rowIndices:[],colIndices:[],literals:term,eliminatedVariables:[],keptVariables:term.map((l)=>l.variable),termLatex:latex(term),rawTerm:'',color:'#2563eb'}))}
    })
  }).flat()
}
