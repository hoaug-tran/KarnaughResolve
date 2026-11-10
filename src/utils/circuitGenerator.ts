import type { CircuitDiagram, CircuitNode, KMapGroup, OptimizationForm, TargetGateType, VariableCount, WireConnection } from '../types'
import { getVariableNames } from './kmapSolver'

export function formatSubscript(str: string): string {
  return str
    .replace(/_0/g, '₀')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃')
    .replace(/_4/g, '₄')
    .replace(/_5/g, '₅')
    .replace(/_6/g, '₆')
    .replace(/_7/g, '₇')
    .replace(/_8/g, '₈')
    .replace(/_9/g, '₉')
}

function formatTermDisplay(group: KMapGroup, form: OptimizationForm): string {
  if (group.literals.length === 0) return form === 'SOP' ? '1' : '0'
  if (form === 'SOP') {
    return group.literals
      .map((l) => (l.inverted ? `${l.variable}̄` : l.variable))
      .join('.')
  }
  return `(${group.literals
    .map((l) => (l.inverted ? `${l.variable}̄` : l.variable))
    .join(' + ')})`
}

export function generateBasicCircuit(
  groups: KMapGroup[],
  count: VariableCount,
  form: OptimizationForm,
  funcName: string = 'Y'
): CircuitDiagram {
  const variables = getVariableNames(count)
  const railXMap: Record<string, number> = {}
  const nodes: CircuitNode[] = []
  const wires: WireConnection[] = []
  const taps: { x: number; y: number }[] = []

  let currentRailX = 70
  for (const v of variables) {
    railXMap[v] = currentRailX
    railXMap[`~${v}`] = currentRailX + 42
    currentRailX += 90
  }

  const stage1StartX = currentRailX + 90
  const gateSpacing = 84
  const topOffset = 180
  const totalHeight = Math.max(560, topOffset + groups.length * gateSpacing + 80)

  for (const v of variables) {
    const rx = railXMap[v]
    const notRx = railXMap[`~${v}`]

    nodes.push({
      id: `in-${v}`,
      type: 'input',
      label: v,
      x: rx,
      y: 28,
      inputs: []
    })

    nodes.push({
      id: `lbl-not-${v}`,
      type: 'input',
      label: `${v}̄`,
      x: notRx,
      y: 114,
      inputs: []
    })

    nodes.push({
      id: `not-${v}`,
      type: 'not',
      x: notRx,
      y: 78,
      inputs: [v]
    })

    taps.push({ x: rx, y: 56 })
    wires.push({
      fromNodeId: `in-${v}`,
      toNodeId: `not-${v}`,
      points: [
        { x: rx, y: 56 },
        { x: notRx, y: 56 },
        { x: notRx, y: 66 }
      ]
    })
    wires.push({
      fromNodeId: `not-${v}`,
      toNodeId: `lbl-not-${v}`,
      points: [
        { x: notRx, y: 92 },
        { x: notRx, y: 103 }
      ]
    })
  }

  const stage1GateIds: string[] = []
  const stage1Type = form === 'SOP' ? 'and' : 'or'

  if (groups.length === 0 || groups.some((group) => !group.literals.length)) {
    const constVal = (form === 'SOP') === (groups.length > 0) ? '1' : '0'
    nodes.push({
      id: 'out-gate',
      type: 'output',
      label: `${funcName} = ${constVal}`,
      x: stage1StartX,
      y: topOffset,
      inputs: []
    })
    return { width: Math.max(840, stage1StartX + 180), height: totalHeight, railXMap, nodes, wires, taps }
  }

  groups.forEach((g, idx) => {
    const gateId = `stage1-${idx}`
    if (g.literals.length === 1) {
      const literal = g.literals[0]
      stage1GateIds.push(`${literal.inverted ? '~' : ''}${literal.variable}`)
      return
    }
    stage1GateIds.push(gateId)
    const gateY = topOffset + idx * gateSpacing

    nodes.push({
      id: gateId,
      type: stage1Type,
      label: formatTermDisplay(g, form),
      x: stage1StartX,
      y: gateY,
      inputs: g.literals.map((l) => (l.inverted ? `~${l.variable}` : l.variable))
    })

    const inputCount = g.literals.length
    g.literals.forEach((lit, pinIdx) => {
      const lineKey = lit.inverted ? `~${lit.variable}` : lit.variable
      const railX = railXMap[lineKey]
      const pinY = inputCount === 1 ? gateY : gateY - 14 + pinIdx * (28 / Math.max(1, inputCount - 1))

      taps.push({ x: railX, y: pinY })
      wires.push({
        fromNodeId: `rail-${lineKey}`,
        toNodeId: gateId,
        busLine: lineKey,
        isDirectBusTap: true,
        points: [
          { x: railX, y: pinY },
          { x: stage1StartX - 24, y: pinY }
        ]
      })
    })
  })

  const stage2X = stage1StartX + 180
  const stage2Y = topOffset + ((groups.length - 1) * gateSpacing) / 2
  const stage2Type = form === 'SOP' ? 'or' : 'and'

  if (groups.length === 1) {
    nodes.push({
      id: 'out-gate',
      type: 'output',
      label: funcName,
      x: stage1StartX + 80,
      y: topOffset,
      inputs: [stage1GateIds[0]]
    })
    const sourceX = railXMap[stage1GateIds[0]] ?? stage1StartX + 24
    if (stage1GateIds[0] in railXMap) taps.push({x:sourceX,y:topOffset})
    wires.push({
      fromNodeId: stage1GateIds[0],
      toNodeId: 'out-gate',
      points: [
        { x: sourceX, y: topOffset },
        { x: stage1StartX + 70, y: topOffset }
      ]
    })
  } else if (groups.length > 1) {
    nodes.push({
      id: 'stage2-collector',
      type: stage2Type,
      label: funcName,
      x: stage2X,
      y: stage2Y,
      inputs: stage1GateIds
    })

    stage1GateIds.forEach((gId, idx) => {
      const gY = topOffset + idx * gateSpacing
      const sourceX = railXMap[gId] ?? stage1StartX + 24
      if (gId in railXMap) taps.push({x:sourceX,y:gY})
      const pinY = stage2Y - 16 + idx * (32 / (groups.length - 1))
      wires.push({
        fromNodeId: gId,
        toNodeId: 'stage2-collector',
        points: [
          { x: sourceX, y: gY },
          { x: stage1StartX + 70 + idx * 12, y: gY },
          { x: stage1StartX + 70 + idx * 12, y: pinY },
          { x: stage2X - 24, y: pinY }
        ]
      })
    })

    nodes.push({
      id: 'out-gate',
      type: 'output',
      label: funcName,
      x: stage2X + 80,
      y: stage2Y,
      inputs: ['stage2-collector']
    })

    wires.push({
      fromNodeId: 'stage2-collector',
      toNodeId: 'out-gate',
      points: [
        { x: stage2X + 24, y: stage2Y },
        { x: stage2X + 70, y: stage2Y }
      ]
    })
  }

  const width = Math.max(840, stage2X + 180)
  return { width, height: totalHeight, railXMap, nodes, wires, taps }
}

export function generateTargetGateCircuit(
  groups: KMapGroup[], count: VariableCount, form: OptimizationForm,
  targetGate: TargetGateType, funcName: string = 'Y'
): CircuitDiagram {
  if (targetGate === 'basic') return generateBasicCircuit(groups, count, form, funcName)
  if (!groups.length) return generateBasicCircuit([], count, form, funcName)
  if (groups.some((group) => !group.literals.length)) return generateBasicCircuit([], count, form === 'SOP' ? 'POS' : 'SOP', funcName)
  const diagram = generateBasicCircuit([], count, form, funcName)
  diagram.nodes = diagram.nodes.filter((node) => node.type !== 'output')
  const nand = targetGate.startsWith('nand'), binary = targetGate.endsWith('_2')
  const gateType = nand ? 'nand' : 'nor'
  for (const node of diagram.nodes) {
    if (node.type === 'not') { node.type = gateType; node.tiedInput = true; node.inputs = [node.inputs[0],node.inputs[0]]; node.id = node.id.replace('not-','tied-not-') }
  }
  for (const wire of diagram.wires) {
    wire.fromNodeId = wire.fromNodeId.replace(/^not-/,'tied-not-')
    wire.toNodeId = wire.toNodeId.replace(/^not-/,'tied-not-')
  }
  const startX = Math.max(...Object.values(diagram.railXMap)) + 110
  type Signal = { id:string; x:number; y:number; rail?:boolean }
  let serial = 0
  const addGate = (inputs:Signal[], y:number):Signal => {
    const pins = inputs.length === 1 ? [inputs[0],inputs[0]] : inputs
    const x = Math.max(startX,...pins.filter((pin)=>!pin.rail).map((pin)=>pin.x+110+Math.max(0,pins.length-2)*12))
    const id = `target-${serial++}`
    diagram.nodes.push({id,type:gateType,x,y,inputs:pins.map((pin)=>pin.id),tiedInput:inputs.length===1})
    pins.forEach((pin,index)=>{
      const pinY = y-12+index*24/(pins.length-1)
      const laneX = x-50-index*12
      const points = pin.rail
        ? x===startX ? [{x:pin.x,y:pinY},{x:x-26,y:pinY}] : [{x:pin.x,y:y+44+index*12},{x:laneX,y:y+44+index*12},{x:laneX,y:pinY},{x:x-26,y:pinY}]
        : [{x:pin.x,y:pin.y},{x:laneX,y:pin.y},{x:laneX,y:pinY},{x:x-26,y:pinY}]
      if(pin.rail) diagram.taps.push(points[0])
      diagram.wires.push({fromNodeId:pin.rail?`rail-${pin.id}`:pin.id,toNodeId:id,toPin:index,points})
    })
    return {id,x:x+28,y}
  }
  const combine = (signals:Signal[], inverted:boolean):Signal => {
    if(signals.length===1) return inverted?addGate(signals,signals[0].y):signals[0]
    let inputs=signals
    if(binary&&signals.length>2){
      const middle=Math.ceil(signals.length/2)
      inputs=[combine(signals.slice(0,middle),false),combine(signals.slice(middle),false)]
    }
    const output=addGate(inputs,(Math.min(...signals.map((signal)=>signal.y))+Math.max(...signals.map((signal)=>signal.y)))/2)
    return inverted?output:addGate([output],output.y)
  }
  const crossForm=(form==='POS')===nand
  const terms=groups.map((group,index)=>{
    const y=230+index*160
    const literals=group.literals.map((literal,pin)=>{
      const inverted=crossForm?!literal.inverted:literal.inverted
      const id=`${inverted?'~':''}${literal.variable}`
      return {id,x:diagram.railXMap[id],y:y+(pin-(group.literals.length-1)/2)*42,rail:true}
    })
    return combine(literals,true)
  })
  const output=combine(terms,!crossForm)
  const x=output.x+75
  diagram.nodes.push({id:'out-pin',type:'output',label:funcName,x,y:output.y,inputs:[output.id]})
  diagram.wires.push({fromNodeId:output.id,toNodeId:'out-pin',points:[{x:output.x,y:output.y},{x:x-15,y:output.y}]})
  diagram.width=Math.max(840,x+60)
  diagram.height=Math.max(580,230+(groups.length-1)*160+120)
  return diagram
}

export function generateMultiOutputBasicCircuit(
  outputs: { name:string; groups:KMapGroup[]; form?:OptimizationForm }[],
  count:VariableCount, form:OptimizationForm='SOP'
): CircuitDiagram {
  const combined=generateBasicCircuit([],count,form)
  combined.nodes=combined.nodes.filter((node)=>node.type!=='output')
  let offset=0
  outputs.forEach((output,index)=>{
    const diagram=generateBasicCircuit(output.groups,count,output.form??form,output.name)
    const gates=diagram.nodes.filter((node)=>!node.id.startsWith('in-')&&!node.id.startsWith('not-')&&!node.id.startsWith('lbl-not-'))
    const ids=new Set(gates.map((node)=>node.id))
    const rename=(id:string)=>ids.has(id)?`output-${index}-${id}`:id
    combined.nodes.push(...gates.map((node)=>({...node,id:rename(node.id),y:node.y+offset,inputs:node.inputs.map(rename)})))
    combined.wires.push(...diagram.wires.filter((wire)=>ids.has(wire.toNodeId)).map((wire)=>({...wire,fromNodeId:rename(wire.fromNodeId),toNodeId:rename(wire.toNodeId),points:wire.points.map((point)=>({...point,y:point.y+offset}))})))
    combined.taps.push(...diagram.taps.filter((tap)=>tap.y>126).map((tap)=>({...tap,y:tap.y+offset})))
    combined.width=Math.max(combined.width,diagram.width)
    offset+=Math.max(...gates.map((node)=>node.y))-180+140
  })
  combined.height=Math.max(580,offset+100)
  return combined
}
