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

  groups.forEach((g, idx) => {
    const gateId = `stage1-${idx}`
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
    wires.push({
      fromNodeId: stage1GateIds[0],
      toNodeId: 'out-gate',
      points: [
        { x: stage1StartX + 24, y: topOffset },
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
      const pinY = stage2Y - 16 + idx * (32 / (groups.length - 1))
      wires.push({
        fromNodeId: gId,
        toNodeId: 'stage2-collector',
        points: [
          { x: stage1StartX + 24, y: gY },
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
  groups: KMapGroup[],
  count: VariableCount,
  form: OptimizationForm,
  targetGate: TargetGateType,
  funcName: string = 'Y'
): CircuitDiagram {
  if (targetGate === 'basic') {
    return generateBasicCircuit(groups, count, form, funcName)
  }

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

  const isNand = targetGate.startsWith('nand')
  const isTwoInput = targetGate.endsWith('_2')
  const gateType = isNand ? 'nand' : 'nor'

  const stage1StartX = currentRailX + 90
  const gateSpacing = isTwoInput ? 100 : 80
  const topOffset = 180
  const totalHeight = Math.max(580, topOffset + groups.length * gateSpacing + 80)

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
      id: `tied-not-${v}`,
      type: gateType,
      x: notRx,
      y: 78,
      inputs: [v, v],
      tiedInput: true
    })

    taps.push({ x: rx, y: 56 })
    wires.push({
      fromNodeId: `in-${v}`,
      toNodeId: `tied-not-${v}`,
      points: [
        { x: rx, y: 56 },
        { x: notRx, y: 56 },
        { x: notRx, y: 66 }
      ]
    })
    wires.push({
      fromNodeId: `tied-not-${v}`,
      toNodeId: `lbl-not-${v}`,
      points: [
        { x: notRx, y: 92 },
        { x: notRx, y: 103 }
      ]
    })
  }

  const stage1Outputs: { id: string; x: number; y: number; label?: string }[] = []

  groups.forEach((g, idx) => {
    const groupY = topOffset + idx * gateSpacing
    const activeLiterals = form === 'SOP'
      ? (isNand ? g.literals : g.literals.map((l) => ({ variable: l.variable, inverted: !l.inverted })))
      : (isNand ? g.literals.map((l) => ({ variable: l.variable, inverted: !l.inverted })) : g.literals)

    const termDisplay = formatTermDisplay(g, form)

    if (!isTwoInput || activeLiterals.length <= 2) {
      const gId = `target-st1-${idx}`
      nodes.push({
        id: gId,
        type: gateType,
        label: termDisplay,
        x: stage1StartX,
        y: groupY,
        inputs: activeLiterals.map((l) => (l.inverted ? `~${l.variable}` : l.variable))
      })

      const inCount = activeLiterals.length
      activeLiterals.forEach((lit, pinIdx) => {
        const lineKey = lit.inverted ? `~${lit.variable}` : lit.variable
        const railX = railXMap[lineKey]
        const pinY = inCount === 1 ? groupY : groupY - 12 + pinIdx * 24

        taps.push({ x: railX, y: pinY })
        wires.push({
          fromNodeId: `rail-${lineKey}`,
          toNodeId: gId,
          busLine: lineKey,
          isDirectBusTap: true,
          points: [
            { x: railX, y: pinY },
            { x: stage1StartX - 24, y: pinY }
          ]
        })
      })

      stage1Outputs.push({ id: gId, x: stage1StartX + 24, y: groupY, label: termDisplay })
    } else {
      const g1Id = `target-pair1-${idx}`
      const invId = `target-inv1-${idx}`
      const g2Id = `target-pair2-${idx}`

      const l0 = activeLiterals[0]
      const l1 = activeLiterals[1]
      const l2 = activeLiterals[2]

      nodes.push({
        id: g1Id,
        type: gateType,
        x: stage1StartX,
        y: groupY - 20,
        inputs: [l0.inverted ? `~${l0.variable}` : l0.variable, l1.inverted ? `~${l1.variable}` : l1.variable]
      })

      const rX0 = railXMap[l0.inverted ? `~${l0.variable}` : l0.variable]
      const rX1 = railXMap[l1.inverted ? `~${l1.variable}` : l1.variable]

      taps.push({ x: rX0, y: groupY - 28 })
      wires.push({
        fromNodeId: 'rail-l0',
        toNodeId: g1Id,
        points: [{ x: rX0, y: groupY - 28 }, { x: stage1StartX - 24, y: groupY - 28 }]
      })

      taps.push({ x: rX1, y: groupY - 12 })
      wires.push({
        fromNodeId: 'rail-l1',
        toNodeId: g1Id,
        points: [{ x: rX1, y: groupY - 12 }, { x: stage1StartX - 24, y: groupY - 12 }]
      })

      const invX = stage1StartX + 68
      nodes.push({
        id: invId,
        type: gateType,
        x: invX,
        y: groupY - 20,
        inputs: [g1Id, g1Id],
        tiedInput: true
      })

      wires.push({
        fromNodeId: g1Id,
        toNodeId: invId,
        points: [
          { x: stage1StartX + 24, y: groupY - 20 },
          { x: invX - 24, y: groupY - 20 }
        ]
      })

      const g2X = invX + 75
      nodes.push({
        id: g2Id,
        type: gateType,
        label: termDisplay,
        x: g2X,
        y: groupY,
        inputs: [invId, l2.inverted ? `~${l2.variable}` : l2.variable]
      })

      wires.push({
        fromNodeId: invId,
        toNodeId: g2Id,
        points: [
          { x: invX + 24, y: groupY - 20 },
          { x: invX + 44, y: groupY - 20 },
          { x: invX + 44, y: groupY - 8 },
          { x: g2X - 24, y: groupY - 8 }
        ]
      })

      const rX2 = railXMap[l2.inverted ? `~${l2.variable}` : l2.variable]
      taps.push({ x: rX2, y: groupY + 8 })
      wires.push({
        fromNodeId: 'rail-l2',
        toNodeId: g2Id,
        points: [
          { x: rX2, y: groupY + 8 },
          { x: g2X - 24, y: groupY + 8 }
        ]
      })

      stage1Outputs.push({ id: g2Id, x: g2X + 24, y: groupY, label: termDisplay })
    }
  })

  let finalX = stage1StartX + 140

  if (stage1Outputs.length === 1) {
    const single = stage1Outputs[0]
    finalX = single.x + 90

    if (isNand && form === 'SOP') {
      const outInvId = 'single-collector-inv'
      nodes.push({
        id: outInvId,
        type: gateType,
        x: single.x + 55,
        y: single.y,
        inputs: [single.id, single.id],
        tiedInput: true
      })
      wires.push({
        fromNodeId: single.id,
        toNodeId: outInvId,
        points: [{ x: single.x, y: single.y }, { x: single.x + 31, y: single.y }]
      })
      nodes.push({
        id: 'out-pin',
        type: 'output',
        label: funcName,
        x: single.x + 110,
        y: single.y,
        inputs: [outInvId]
      })
      wires.push({
        fromNodeId: outInvId,
        toNodeId: 'out-pin',
        points: [{ x: single.x + 79, y: single.y }, { x: single.x + 95, y: single.y }]
      })
    } else {
      nodes.push({
        id: 'out-pin',
        type: 'output',
        label: funcName,
        x: single.x + 70,
        y: single.y,
        inputs: [single.id]
      })
      wires.push({
        fromNodeId: single.id,
        toNodeId: 'out-pin',
        points: [{ x: single.x, y: single.y }, { x: single.x + 55, y: single.y }]
      })
    }
  } else if (!isTwoInput) {
    const needsFinalCollectorInverter = (form === 'SOP' && !isNand) || (form === 'POS' && isNand)
    const collectorX = Math.max(...stage1Outputs.map((s) => s.x)) + 90
    const collectorY = topOffset + ((groups.length - 1) * gateSpacing) / 2

    nodes.push({
      id: 'target-collector',
      type: gateType,
      label: funcName,
      x: collectorX,
      y: collectorY,
      inputs: stage1Outputs.map((s) => s.id)
    })

    stage1Outputs.forEach((s, idx) => {
      const pinY = collectorY - 14 + idx * (28 / (stage1Outputs.length - 1))
      wires.push({
        fromNodeId: s.id,
        toNodeId: 'target-collector',
        points: [
          { x: s.x, y: s.y },
          { x: s.x + 24 + idx * 12, y: s.y },
          { x: s.x + 24 + idx * 12, y: pinY },
          { x: collectorX - 24, y: pinY }
        ]
      })
    })

    if (needsFinalCollectorInverter) {
      const invOutX = collectorX + 68
      nodes.push({
        id: 'collector-inv',
        type: gateType,
        x: invOutX,
        y: collectorY,
        inputs: ['target-collector', 'target-collector'],
        tiedInput: true
      })
      wires.push({
        fromNodeId: 'target-collector',
        toNodeId: 'collector-inv',
        points: [{ x: collectorX + 24, y: collectorY }, { x: invOutX - 24, y: collectorY }]
      })
      nodes.push({
        id: 'out-pin',
        type: 'output',
        label: funcName,
        x: invOutX + 75,
        y: collectorY,
        inputs: ['collector-inv']
      })
      wires.push({
        fromNodeId: 'collector-inv',
        toNodeId: 'out-pin',
        points: [{ x: invOutX + 24, y: collectorY }, { x: invOutX + 60, y: collectorY }]
      })
      finalX = invOutX + 90
    } else {
      nodes.push({
        id: 'out-pin',
        type: 'output',
        label: funcName,
        x: collectorX + 75,
        y: collectorY,
        inputs: ['target-collector']
      })
      wires.push({
        fromNodeId: 'target-collector',
        toNodeId: 'out-pin',
        points: [
          { x: collectorX + 24, y: collectorY },
          { x: collectorX + 60, y: collectorY }
        ]
      })
      finalX = collectorX + 90
    }
  } else {
    const maxX = Math.max(...stage1Outputs.map((s) => s.x))
    const coll1X = maxX + 80
    const needsFinalCollectorInverter = (form === 'SOP' && !isNand) || (form === 'POS' && isNand)

    if (stage1Outputs.length === 2) {
      const collY = (stage1Outputs[0].y + stage1Outputs[1].y) / 2
      nodes.push({
        id: 'coll-pair1',
        type: gateType,
        x: coll1X,
        y: collY,
        inputs: [stage1Outputs[0].id, stage1Outputs[1].id]
      })
      wires.push({
        fromNodeId: stage1Outputs[0].id,
        toNodeId: 'coll-pair1',
        points: [
          { x: stage1Outputs[0].x, y: stage1Outputs[0].y },
          { x: stage1Outputs[0].x + 24, y: stage1Outputs[0].y },
          { x: stage1Outputs[0].x + 24, y: collY - 8 },
          { x: coll1X - 24, y: collY - 8 }
        ]
      })
      wires.push({
        fromNodeId: stage1Outputs[1].id,
        toNodeId: 'coll-pair1',
        points: [
          { x: stage1Outputs[1].x, y: stage1Outputs[1].y },
          { x: stage1Outputs[1].x + 24, y: stage1Outputs[1].y },
          { x: stage1Outputs[1].x + 24, y: collY + 8 },
          { x: coll1X - 24, y: collY + 8 }
        ]
      })

      if (needsFinalCollectorInverter) {
        const invOutX = coll1X + 68
        nodes.push({
          id: 'out-inv',
          type: gateType,
          x: invOutX,
          y: collY,
          inputs: ['coll-pair1', 'coll-pair1'],
          tiedInput: true
        })
        wires.push({
          fromNodeId: 'coll-pair1',
          toNodeId: 'out-inv',
          points: [{ x: coll1X + 24, y: collY }, { x: invOutX - 24, y: collY }]
        })
        nodes.push({
          id: 'out-pin',
          type: 'output',
          label: funcName,
          x: invOutX + 75,
          y: collY,
          inputs: ['out-inv']
        })
        wires.push({
          fromNodeId: 'out-inv',
          toNodeId: 'out-pin',
          points: [{ x: invOutX + 24, y: collY }, { x: invOutX + 60, y: collY }]
        })
        finalX = invOutX + 90
      } else {
        nodes.push({
          id: 'out-pin',
          type: 'output',
          label: funcName,
          x: coll1X + 75,
          y: collY,
          inputs: ['coll-pair1']
        })
        wires.push({
          fromNodeId: 'coll-pair1',
          toNodeId: 'out-pin',
          points: [{ x: coll1X + 24, y: collY }, { x: coll1X + 60, y: collY }]
        })
        finalX = coll1X + 90
      }
    } else if (stage1Outputs.length >= 3) {
      const s0 = stage1Outputs[0]
      const s1 = stage1Outputs[1]
      const s2 = stage1Outputs[2]

      const mid01Y = (s0.y + s1.y) / 2
      nodes.push({
        id: 'coll-pair01',
        type: gateType,
        x: coll1X,
        y: mid01Y,
        inputs: [s0.id, s1.id]
      })
      wires.push({
        fromNodeId: s0.id,
        toNodeId: 'coll-pair01',
        points: [
          { x: s0.x, y: s0.y },
          { x: s0.x + 24, y: s0.y },
          { x: s0.x + 24, y: mid01Y - 8 },
          { x: coll1X - 24, y: mid01Y - 8 }
        ]
      })
      wires.push({
        fromNodeId: s1.id,
        toNodeId: 'coll-pair01',
        points: [
          { x: s1.x, y: s1.y },
          { x: s1.x + 24, y: s1.y },
          { x: s1.x + 24, y: mid01Y + 8 },
          { x: coll1X - 24, y: mid01Y + 8 }
        ]
      })

      const inv01X = coll1X + 68
      nodes.push({
        id: 'coll-inv01',
        type: gateType,
        x: inv01X,
        y: mid01Y,
        inputs: ['coll-pair01', 'coll-pair01'],
        tiedInput: true
      })
      wires.push({
        fromNodeId: 'coll-pair01',
        toNodeId: 'coll-inv01',
        points: [{ x: coll1X + 24, y: mid01Y }, { x: inv01X - 24, y: mid01Y }]
      })

      const coll2X = inv01X + 78
      const midFinalY = (mid01Y + s2.y) / 2
      nodes.push({
        id: 'coll-final',
        type: gateType,
        x: coll2X,
        y: midFinalY,
        inputs: ['coll-inv01', s2.id]
      })
      wires.push({
        fromNodeId: 'coll-inv01',
        toNodeId: 'coll-final',
        points: [
          { x: inv01X + 24, y: mid01Y },
          { x: inv01X + 44, y: mid01Y },
          { x: inv01X + 44, y: midFinalY - 8 },
          { x: coll2X - 24, y: midFinalY - 8 }
        ]
      })
      wires.push({
        fromNodeId: s2.id,
        toNodeId: 'coll-final',
        points: [
          { x: s2.x, y: s2.y },
          { x: s2.x + 36, y: s2.y },
          { x: s2.x + 36, y: midFinalY + 8 },
          { x: coll2X - 24, y: midFinalY + 8 }
        ]
      })

      if (needsFinalCollectorInverter) {
        const finalInvX = coll2X + 68
        nodes.push({
          id: 'final-inv',
          type: gateType,
          x: finalInvX,
          y: midFinalY,
          inputs: ['coll-final', 'coll-final'],
          tiedInput: true
        })
        wires.push({
          fromNodeId: 'coll-final',
          toNodeId: 'final-inv',
          points: [{ x: coll2X + 24, y: midFinalY }, { x: finalInvX - 24, y: midFinalY }]
        })
        nodes.push({
          id: 'out-pin',
          type: 'output',
          label: funcName,
          x: finalInvX + 75,
          y: midFinalY,
          inputs: ['final-inv']
        })
        wires.push({
          fromNodeId: 'final-inv',
          toNodeId: 'out-pin',
          points: [{ x: finalInvX + 24, y: midFinalY }, { x: finalInvX + 60, y: midFinalY }]
        })
        finalX = finalInvX + 90
      } else {
        nodes.push({
          id: 'out-pin',
          type: 'output',
          label: funcName,
          x: coll2X + 75,
          y: midFinalY,
          inputs: ['coll-final']
        })
        wires.push({
          fromNodeId: 'coll-final',
          toNodeId: 'out-pin',
          points: [{ x: coll2X + 24, y: midFinalY }, { x: coll2X + 60, y: midFinalY }]
        })
        finalX = coll2X + 90
      }
    }
  }

  const width = Math.max(900, finalX + 160)
  return { width, height: totalHeight, railXMap, nodes, wires, taps }
}

export function generateMultiOutputBasicCircuit(
  outputs: { name: string; groups: KMapGroup[] }[],
  count: VariableCount,
  form: OptimizationForm = 'SOP'
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
  const stage2StartX = stage1StartX + 180
  const outPinX = stage2StartX + 80
  const gateSpacing = 72
  const outputSpacing = 36

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

  let currentY = 170

  outputs.forEach((out, outIdx) => {
    const outGroups = out.groups
    const stage1Type = form === 'SOP' ? 'and' : 'or'
    const stage2Type = form === 'SOP' ? 'or' : 'and'

    if (outGroups.length === 0) {
      const pinId = `out-${out.name}-${outIdx}`
      nodes.push({
        id: pinId,
        type: 'output',
        label: `${out.name}=0`,
        x: stage1StartX + 80,
        y: currentY,
        inputs: []
      })
      currentY += gateSpacing + outputSpacing
      return
    }

    if (outGroups.length === 1 && outGroups[0].literals.length === 0) {
      const pinId = `out-${out.name}-${outIdx}`
      nodes.push({
        id: pinId,
        type: 'output',
        label: `${out.name}=1`,
        x: stage1StartX + 80,
        y: currentY,
        inputs: []
      })
      currentY += gateSpacing + outputSpacing
      return
    }

    const outputGateIds: string[] = []
    const startYForOutput = currentY

    outGroups.forEach((g, gIdx) => {
      const gateId = `mo-gate-${outIdx}-${gIdx}`
      outputGateIds.push(gateId)
      const gateY = currentY

      if (g.literals.length === 1) {
        const lit = g.literals[0]
        const lineKey = lit.inverted ? `~${lit.variable}` : lit.variable
        const railX = railXMap[lineKey]
        taps.push({ x: railX, y: gateY })

        nodes.push({
          id: gateId,
          type: stage1Type,
          label: formatTermDisplay(g, form),
          x: stage1StartX,
          y: gateY,
          inputs: [lineKey]
        })

        wires.push({
          fromNodeId: `rail-${lineKey}`,
          toNodeId: gateId,
          busLine: lineKey,
          isDirectBusTap: true,
          points: [
            { x: railX, y: gateY },
            { x: stage1StartX - 24, y: gateY }
          ]
        })
      } else {
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
      }

      currentY += gateSpacing
    })

    const midY = startYForOutput + ((outGroups.length - 1) * gateSpacing) / 2

    if (outGroups.length === 1) {
      const pinId = `out-${out.name}-${outIdx}`
      nodes.push({
        id: pinId,
        type: 'output',
        label: out.name,
        x: stage1StartX + 90,
        y: midY,
        inputs: [outputGateIds[0]]
      })
      wires.push({
        fromNodeId: outputGateIds[0],
        toNodeId: pinId,
        points: [
          { x: stage1StartX + 24, y: midY },
          { x: stage1StartX + 75, y: midY }
        ]
      })
    } else {
      const collId = `coll-${out.name}-${outIdx}`
      const pinId = `out-${out.name}-${outIdx}`

      nodes.push({
        id: collId,
        type: stage2Type,
        label: out.name,
        x: stage2StartX,
        y: midY,
        inputs: outputGateIds
      })

      outputGateIds.forEach((gId, gIdx) => {
        const gY = startYForOutput + gIdx * gateSpacing
        const pinY = outGroups.length === 1 ? midY : midY - 16 + gIdx * (32 / (outGroups.length - 1))
        wires.push({
          fromNodeId: gId,
          toNodeId: collId,
          points: [
            { x: stage1StartX + 24, y: gY },
            { x: stage1StartX + 60 + (gIdx % 3) * 10, y: gY },
            { x: stage1StartX + 60 + (gIdx % 3) * 10, y: pinY },
            { x: stage2StartX - 24, y: pinY }
          ]
        })
      })

      nodes.push({
        id: pinId,
        type: 'output',
        label: out.name,
        x: outPinX,
        y: midY,
        inputs: [collId]
      })

      wires.push({
        fromNodeId: collId,
        toNodeId: pinId,
        points: [
          { x: stage2StartX + 24, y: midY },
          { x: outPinX - 15, y: midY }
        ]
      })
    }

    currentY += outputSpacing
  })

  const totalHeight = Math.max(580, currentY + 40)
  const width = Math.max(900, outPinX + 100)

  return { width, height: totalHeight, railXMap, nodes, wires, taps }
}
