import type { KMapGroup, OptimizationForm, TargetGateType, TransformationStep } from '../types'

function formatLiteral(v: string, inverted: boolean): string {
  return inverted ? `\\overline{${v}}` : v
}

function formatComplementLiteral(v: string, inverted: boolean): string {
  return inverted ? v : `\\overline{${v}}`
}

function termToSopLatex(group: KMapGroup): string {
  if (group.literals.length === 0) return '1'
  return group.literals
    .map((l) => formatLiteral(l.variable, l.inverted))
    .join(' \\cdot ')
}

function termToPosInner(group: KMapGroup): string {
  if (group.literals.length === 0) return '0'
  return group.literals
    .map((l) => formatLiteral(l.variable, l.inverted))
    .join(' + ')
}

function termToPosLatex(group: KMapGroup): string {
  if (group.literals.length === 0) return '0'
  return `(${termToPosInner(group)})`
}

export function generateTransformations(
  groups: KMapGroup[],
  form: OptimizationForm,
  targetGate: TargetGateType,
  funcName: string = 'Y'
): TransformationStep[] {
  if (groups.length === 0) {
    const constVal = form === 'SOP' ? '0' : '1'
    return [
      {
        title: 'Hàm logic hằng số',
        description: `Do không có ô nào được chọn trên bìa Karnaugh, hàm luôn nhận giá trị hằng số $${constVal}$.`,
        ruleName: 'Hằng số logic',
        ruleFormula: `${funcName} = ${constVal}`,
        latex: `${funcName} = ${constVal}`
      }
    ]
  }

  if (targetGate === 'basic') {
    const expr = form === 'SOP'
      ? groups.map(termToSopLatex).join(' + ')
      : groups.map(termToPosLatex).join(' \\cdot ')

    return [
      {
        title: 'Xác định biểu thức tối thiểu ban đầu từ bìa Karnaugh',
        description: `Từ kết quả khoanh các nhóm ô tối ưu trên bìa Karnaugh ở Câu a, ta thu được hàm logic ở dạng tối thiểu gồm ${groups.length} thành phần tương ứng với các nhóm ô: ${groups.map((g, i) => `$${form === 'SOP' ? `T_{${i + 1}}` : `M_{${i + 1}}`}$ (${g.cells.join(', ')})`).join(', ')}.`,
        ruleName: form === 'SOP' ? 'Dạng chuẩn tắc Tuyển (SOP)' : 'Dạng chuẩn tắc Hội (POS)',
        ruleFormula: form === 'SOP' ? 'Y = T_1 + T_2 + \\dots + T_k' : 'Y = M_1 \\cdot M_2 \\cdots M_k',
        latex: `${funcName} = ${expr}`
      },
      {
        title: 'Cấu trúc sơ đồ logic cơ bản (AND, OR, NOT)',
        description: form === 'SOP'
          ? 'Tầng 1 gồm các cổng AND để tạo các số hạng tích. Tầng 2 gồm 1 cổng OR để cộng toàn bộ các tích lại với nhau. Các biến đảo được lấy qua cổng NOT.'
          : 'Tầng 1 gồm các cổng OR để tạo các thừa số tổng. Tầng 2 gồm 1 cổng AND để nhân toàn bộ các tổng lại với nhau. Các biến đảo được lấy qua cổng NOT.',
        ruleName: 'Mạch logic 2 tầng cơ bản',
        ruleFormula: form === 'SOP' ? 'Y = \\text{OR}(\\text{AND}_1, \\text{AND}_2, \\dots)' : 'Y = \\text{AND}(\\text{OR}_1, \\text{OR}_2, \\dots)',
        latex: `${funcName} = ${expr}`
      }
    ]
  }

  if (form === 'SOP') {
    return transformSopDetailed(groups, targetGate, funcName)
  }
  return transformPosDetailed(groups, targetGate, funcName)
}

function transformSopDetailed(
  groups: KMapGroup[],
  targetGate: TargetGateType,
  funcName: string
): TransformationStep[] {
  const steps: TransformationStep[] = []
  const initialSop = groups.map(termToSopLatex).join(' + ')

  steps.push({
    title: 'Xác định biểu thức tối thiểu ban đầu từ bìa Karnaugh',
    description: `Từ kết quả khoanh các nhóm ô 1 và X trên bìa Karnaugh ở Câu a, ta thu được biểu thức dạng Chuẩn tắc Tuyển tối thiểu (SOP) gồm ${groups.length} số hạng tích:\n` +
      groups.map((g, i) => `• Số hạng $T_{${i + 1}}$ (nhóm ${g.cells.length} ô {${g.cells.join(', ')}}): $T_{${i + 1}} = ${termToSopLatex(g)}$`).join('\n'),
    ruleName: 'Dạng chuẩn tắc tuyển (SOP)',
    ruleFormula: 'Y = T_1 + T_2 + \\dots + T_k',
    latex: `${funcName} = ${initialSop}`
  })

  steps.push({
    title: 'Phủ định kép toàn phần (Áp dụng định luật hoàn nguyên)',
    description: 'Lấy phủ định 2 lần toàn bộ biểu thức hàm $Y$. Theo định luật hoàn nguyên, giá trị chân lý của hàm không đổi. Hai dấu gạch ngang trùm lên toàn bộ biểu thức ban đầu:',
    ruleName: 'Định luật hoàn nguyên (Involution)',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{ ${initialSop} }}`
  })

  if (targetGate === 'nand_n' || targetGate === 'nand_2') {
    const nandTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'Phân phối dấu gạch dưới theo định luật De Morgan',
      description: 'Giữ nguyên dấu gạch phủ định ở tầng trên cùng. Áp dụng định luật De Morgan cho dấu gạch phủ định bên dưới: phép cộng giữa các số hạng tích chuyển thành phép nhân giữa các số hạng có dấu gạch đảo $\\overline{T_i}$:',
      ruleName: 'Định luật De Morgan cho phép cộng',
      ruleFormula: '\\overline{X_1 + X_2 + \\dots + X_k} = \\overline{X_1} \\cdot \\overline{X_2} \\cdots \\overline{X_k}',
      latex: `${funcName} = \\overline{ ${nandTerms.join(' \\cdot ')} }`
    })

    if (targetGate === 'nand_n') {
      steps.push({
        title: 'Kết luận cấu trúc sơ đồ toàn cổng NAND N đầu vào',
        description: `Mỗi thành phần số hạng đảo $\\overline{T_i}$ được thực hiện bởi 1 cổng NAND N đầu vào ở tầng 1: ${groups.map((_, i) => `$\\overline{T_{${i + 1}}} = ${nandTerms[i]}$`).join(', ')}. Tầng 2 gồm đúng 1 cổng NAND có ${groups.length} đầu vào gom toàn bộ các tín hiệu tầng 1 để thu được kết quả hàm $Y$.`,
        ruleName: 'Mạch logic 2 tầng toàn NAND N đầu vào',
        ruleFormula: 'Y = \\text{NAND}(\\overline{T_1}, \\overline{T_2}, \\dots, \\overline{T_k})',
        latex: `${funcName} = \\overline{ ${nandTerms.join(' \\cdot ')} }`
      })
      return steps
    }

    const decomposedNandTerms: string[] = []
    let hasMultiLiteral = false

    groups.forEach((g, idx) => {
      const litCount = g.literals.length
      if (litCount <= 2) {
        decomposedNandTerms.push(nandTerms[idx])
      } else if (litCount === 3) {
        hasMultiLiteral = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} \\cdot ${l1}}`
        decomposedNandTerms.push(`\\overline{ \\overline{${pair}} \\cdot ${l2} }`)
      } else {
        hasMultiLiteral = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} \\cdot ${l1}}`
        const pair2 = `\\overline{${l2} \\cdot ${l3}}`
        decomposedNandTerms.push(`\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`)
      }
    })

    if (hasMultiLiteral) {
      steps.push({
        title: 'Tách các số hạng có từ 3 biến trở lên về cổng NAND 2 đầu vào',
        description: 'Vì mỗi cổng logic chỉ có tối đa 2 đầu vào, các số hạng có từ 3 biến trở lên được tách thành chuỗi các cổng NAND 2 đầu vào nối tiếp qua các cổng đảo chập chân:',
        ruleName: 'Phân tích tích nhiều biến bằng cổng NAND 2 đầu vào',
        ruleFormula: '\\overline{A \\cdot B \\cdot C} = \\overline{ \\overline{\\overline{A \\cdot B}} \\cdot C }',
        latex: `${funcName} = \\overline{ ${decomposedNandTerms.join(' \\cdot ')} }`
      })
    }

    if (decomposedNandTerms.length === 1) {
      steps.push({
        title: 'Biểu thức ngõ ra cuối cùng',
        description: `Vì hàm chỉ có 1 số hạng tích $T_1 = ${termToSopLatex(groups[0])}$, ta lấy qua 1 cổng NAND chập chân để thu được $Y = T_1$:`,
        ruleName: 'Cổng đảo ngõ ra đơn',
        ruleFormula: `${funcName} = \\overline{U_1} = T_1`,
        latex: `${funcName} = \\overline{${decomposedNandTerms[0]}}`
      })
    } else if (decomposedNandTerms.length === 2) {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra bằng cổng NAND 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: 'Hai tín hiệu tầng 1 được đưa thẳng vào 1 cổng NAND 2 đầu vào duy nhất ở ngõ ra:',
        ruleName: 'Gom 2 số hạng bằng 1 cổng NAND 2 đầu vào',
        ruleFormula: 'Y = \\overline{ U_1 \\cdot U_2 }',
        latex: `${funcName} = \\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }`,
        intermediateSignal: `${funcName} = \\overline{ U_1 \\cdot U_2 }`
      })
    } else if (decomposedNandTerms.length === 3) {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra theo từng cặp 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: `Vì mỗi cổng NAND chỉ có tối đa 2 đầu vào, ta gom 2 số hạng đầu bằng cách lấy phủ định 2 lần: $U_1 \\cdot U_2 = \\overline{\\overline{ U_1 \\cdot U_2 }}$, sau đó đưa cùng $U_3$ vào cổng NAND ngõ ra:`,
        ruleName: 'Phân tầng tuần tự qua tích trung gian 2 đầu vào',
        ruleFormula: 'Y = \\overline{ \\overline{\\overline{ U_1 \\cdot U_2 }} \\cdot U_3 }',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }} \\cdot ${decomposedNandTerms[2]} }`,
        intermediateSignal: `${funcName} = \\overline{ P_{12} \\cdot U_3 } \\quad , \\quad P_{12} = \\overline{\\overline{ U_1 \\cdot U_2 }}`
      })
    } else {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra theo cây nhị phân 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: 'Với 4 số hạng, ta chia thành 2 nhánh cân bằng bằng cổng NAND 2 đầu vào:',
        ruleName: 'Cây nhị phân ghép tầng qua tín hiệu trung gian',
        ruleFormula: 'Y = \\overline{ \\overline{\\overline{ U_1 \\cdot U_2 }} \\cdot \\overline{\\overline{ U_3 \\cdot U_4 }} }',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }} \\cdot \\overline{\\overline{ ${decomposedNandTerms[2]} \\cdot ${decomposedNandTerms[3]} }} }`,
        intermediateSignal: `${funcName} = \\overline{ P_{12} \\cdot P_{34} } \\quad , \\quad P_{12} = \\overline{\\overline{ U_1 \\cdot U_2 }} \\quad , \\quad P_{34} = \\overline{\\overline{ U_3 \\cdot U_4 }}`
      })
    }
    return steps
  }

  const norTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' + ')
    return `\\overline{${inside}}`
  })

  steps.push({
    title: 'Biến đổi từng số hạng tích sang dạng phủ định tổng theo định luật De Morgan',
    description: 'Áp dụng định luật De Morgan biến đổi từng số hạng tích bên dưới dấu phủ định kép thành dạng phủ định tổng:\n' +
      groups.map((g, i) => `• $T_{${i + 1}} = ${termToSopLatex(g)} = ${norTerms[i]}$`).join('\n'),
    ruleName: 'Biến đổi tích sang NOR',
    ruleFormula: 'A \\cdot B = \\overline{\\overline{A} + \\overline{B}}',
    latex: `${funcName} = \\overline{\\overline{ ${norTerms.join(' + ')} }}`
  })

  if (targetGate === 'nor_n') {
    steps.push({
      title: 'Kết luận cấu trúc sơ đồ toàn cổng NOR N đầu vào',
      description: `Mỗi thành phần số hạng được tạo bằng 1 cổng NOR N đầu vào ở tầng 1: ${groups.map((_, i) => `$T_{${i + 1}} = ${norTerms[i]}$`).join(', ')}. Tầng 2 gồm đúng 1 cổng NOR N đầu vào nhận các tín hiệu tầng 1 thực hiện phép toán dưới dấu gạch dưới, sau đó qua cổng NOR chập 2 chân vào (cổng đảo NOT) để cho ra kết quả $Y$.`,
      ruleName: 'Mạch logic 2 tầng toàn NOR N đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\sum T_i } }',
      latex: `${funcName} = \\overline{ \\overline{ ${norTerms.join(' + ')} } }`
    })
    return steps
  }

  const decomposedNorTerms: string[] = []
  let hasMultiLitNor = false

  groups.forEach((g, idx) => {
    const litCount = g.literals.length
    if (litCount <= 2) {
      decomposedNorTerms.push(norTerms[idx])
    } else if (litCount === 3) {
      hasMultiLitNor = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} + ${l1}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair}} + ${l2} }`)
    } else {
      hasMultiLitNor = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} + ${l1}}`
      const pair2 = `\\overline{${l2} + ${l3}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`)
    }
  })

  if (hasMultiLitNor) {
    steps.push({
      title: 'Tách các số hạng có từ 3 biến trở lên về cổng NOR 2 đầu vào',
      description: 'Vì mỗi cổng logic chỉ có tối đa 2 đầu vào, các số hạng có từ 3 biến trở lên được tách thành chuỗi các cổng NOR 2 đầu vào nối tiếp qua các cổng đảo chập chân:',
      ruleName: 'Phân tích tổng nhiều biến bằng cổng NOR 2 đầu vào',
      ruleFormula: '\\overline{A + B + C} = \\overline{ \\overline{\\overline{A + B}} + C }',
      latex: `${funcName} = \\overline{\\overline{ ${decomposedNorTerms.join(' + ')} }}`
    })
  }

  if (decomposedNorTerms.length === 1) {
    steps.push({
      title: 'Biểu thức ngõ ra cuối cùng',
      description: `Hàm chỉ có 1 số hạng tích nên ngõ ra chính là ngõ ra cổng NOR tầng 1: $Y = T_1$:`,
      ruleName: 'Cổng NOR đơn',
      ruleFormula: 'Y = T_1',
      latex: `${funcName} = ${decomposedNorTerms[0]}`
    })
  } else if (decomposedNorTerms.length === 2) {
    steps.push({
      title: 'Phân tầng thu gom ngõ ra bằng cổng NOR 2 đầu vào (Biểu thức hoàn chỉnh)',
      description: 'Hai số hạng được gom qua 1 cổng NOR 2 đầu vào kèm cổng đảo:',
      ruleName: 'Cổng NOR gom 2 số hạng kèm cổng đảo',
      ruleFormula: 'Y = \\overline{ \\overline{ T_1 + T_2 } }',
      latex: `${funcName} = \\overline{ \\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} } }`,
      intermediateSignal: `${funcName} = \\overline{ \\overline{ T_1 + T_2 } }`
    })
  } else if (decomposedNorTerms.length === 3) {
    steps.push({
      title: 'Phân tầng thu gom ngõ ra theo từng cặp 2 đầu vào (Biểu thức hoàn chỉnh)',
      description: 'Vì mỗi cổng NOR chỉ có tối đa 2 đầu vào, ta gom 2 số hạng đầu bằng cách lấy phủ định 2 lần, sau đó gom với số hạng thứ 3:',
      ruleName: 'Phân tầng tuần tự 3 số hạng qua cổng NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\overline{ \\overline{ T_1 + T_2 } } + T_3 } }',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} } } + ${decomposedNorTerms[2]} } }`,
      intermediateSignal: `${funcName} = \\overline{ \\overline{ S_{12} + T_3 }} \\quad , \\quad S_{12} = \\overline{\\overline{ T_1 + T_2 }}`
    })
  } else {
    steps.push({
      title: 'Phân tầng thu gom ngõ ra theo cây nhị phân 2 đầu vào (Biểu thức hoàn chỉnh)',
      description: 'Với 4 số hạng, ta chia thành 2 nhánh cân bằng bằng cổng NOR 2 đầu vào:',
      ruleName: 'Cây ghép tầng 4 số hạng qua cổng NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\overline{ \\overline{ T_1 + T_2 } } + \\overline{ \\overline{ T_3 + T_4 } } } }',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} } } + \\overline{ \\overline{ ${decomposedNorTerms[2]} + ${decomposedNorTerms[3]} } } } }`,
      intermediateSignal: `${funcName} = \\overline{ \\overline{ S_{12} + S_{34} }} \\quad , \\quad S_{12} = \\overline{\\overline{ T_1 + T_2 }} \\quad , \\quad S_{34} = \\overline{\\overline{ T_3 + T_4 }}`
    })
  }

  return steps
}

function transformPosDetailed(
  groups: KMapGroup[],
  targetGate: TargetGateType,
  funcName: string
): TransformationStep[] {
  const steps: TransformationStep[] = []
  const initialPos = groups.map(termToPosLatex).join(' \\cdot ')

  steps.push({
    title: 'Xác định biểu thức tối thiểu ban đầu từ bìa Karnaugh (Chuẩn tắc Hội)',
    description: `Từ kết quả khoanh các nhóm ô 0 và X trên bìa Karnaugh ở Câu a, ta thu được hàm logic ở dạng Chuẩn tắc Hội tối thiểu (POS) gồm ${groups.length} thừa số tổng:\n` +
      groups.map((g, i) => `• Thừa số $M_{${i + 1}}$ (nhóm ${g.cells.length} ô {${g.cells.join(', ')}}): $M_{${i + 1}} = ${termToPosLatex(g)}$`).join('\n'),
    ruleName: 'Chuẩn tắc hội (POS)',
    ruleFormula: 'Y = M_1 \\cdot M_2 \\cdots M_k',
    latex: `${funcName} = ${initialPos}`
  })

  steps.push({
    title: 'Phủ định kép toàn phần (Áp dụng định luật hoàn nguyên)',
    description: 'Lấy phủ định 2 lần toàn bộ biểu thức hàm $Y$. Theo định luật hoàn nguyên, giá trị chân lý của hàm không đổi. Hai dấu gạch ngang trùm lên toàn bộ biểu thức ban đầu:',
    ruleName: 'Định luật hoàn nguyên (Involution)',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{ ${initialPos} }}`
  })

  if (targetGate === 'nand_n' || targetGate === 'nand_2') {
    const overlinedTerms = groups.map((g) => `\\overline{${termToPosInner(g)}}`)

    steps.push({
      title: 'Phân phối dấu gạch dưới theo định luật De Morgan (Tích sang tổng)',
      description: 'Giữ nguyên dấu gạch phủ định ở trên cùng. Áp dụng định luật De Morgan cho dấu gạch phủ định bên dưới: phép nhân giữa các thừa số tổng chuyển thành phép cộng giữa các thừa số có dấu gạch đảo $\\overline{M_i}$:',
      ruleName: 'Định luật De Morgan cho phép nhân',
      ruleFormula: '\\overline{X_1 \\cdot X_2 \\cdots X_k} = \\overline{X_1} + \\overline{X_2} + \\dots + \\overline{X_k}',
      latex: `${funcName} = \\overline{ ${overlinedTerms.join(' + ')} }`
    })

    const productTerms = groups.map((g) => {
      return g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' \\cdot ')
    })

    steps.push({
      title: 'Khai triển De Morgan cho từng số hạng bên trong (Chuyển tổng về tích)',
      description: 'Áp dụng định luật De Morgan cho từng số hạng $\\overline{M_i}$ bên dưới dấu phủ định chung để biến đổi tổng thành tích các biến:\n' +
        groups.map((g, i) => `• $P_{${i + 1}} = \\overline{M_{${i + 1}}} = \\overline{${termToPosInner(g)}} = ${productTerms[i]}$`).join('\n') +
        '\nDấu gạch phủ định chung trên đầu vẫn được giữ nguyên vẹn trùm lên toàn bộ tổng các số hạng:',
      ruleName: 'Định luật De Morgan cho phép cộng',
      ruleFormula: '\\overline{X + Y} = \\overline{X} \\cdot \\overline{Y}',
      latex: `${funcName} = \\overline{ ${productTerms.join(' + ')} }`
    })

    if (targetGate === 'nand_n') {
      steps.push({
        title: 'Kết luận cấu trúc sơ đồ toàn cổng NAND N đầu vào',
        description: `Mỗi thành phần tích $P_i$ được thực hiện bởi cổng NAND N đầu vào kèm cổng đảo. Tầng 2 gồm 1 cổng NAND gom toàn bộ tín hiệu để thu được $Y$.`,
        ruleName: 'Mạch logic 2 tầng toàn NAND N đầu vào',
        ruleFormula: `${funcName} = \\overline{ P_1 + P_2 + \\dots + P_k }`,
        latex: `${funcName} = \\overline{ ${productTerms.join(' + ')} }`
      })
      return steps
    }

    const decomposedProductTerms: string[] = []
    let hasMultiLiteral = false

    groups.forEach((g, idx) => {
      const litCount = g.literals.length
      if (litCount <= 2) {
        decomposedProductTerms.push(productTerms[idx])
      } else if (litCount === 3) {
        hasMultiLiteral = true
        const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} \\cdot ${l1}}`
        decomposedProductTerms.push(`\\overline{\\overline{ \\overline{${pair}} \\cdot ${l2} }}`)
      } else {
        hasMultiLiteral = true
        const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} \\cdot ${l1}}`
        const pair2 = `\\overline{${l2} \\cdot ${l3}}`
        decomposedProductTerms.push(`\\overline{\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }}`)
      }
    })

    if (hasMultiLiteral) {
      steps.push({
        title: 'Tách các số hạng tích có từ 3 biến trở lên về cổng NAND 2 đầu vào',
        description: 'Vì mỗi cổng logic chỉ có tối đa 2 đầu vào, các số hạng tích có từ 3 biến trở lên được tách thành chuỗi các cổng NAND 2 đầu vào nối tiếp qua các cổng đảo chập chân:\n' +
          groups.map((_, i) => `• $P_{${i + 1}} = ${decomposedProductTerms[i]}$`).join('\n') +
          '\nThay vào phương trình hàm số, dấu phủ định chung trên đầu vẫn giữ nguyên:',
        ruleName: 'Phân tích tích nhiều biến bằng cổng NAND 2 đầu vào',
        ruleFormula: 'A \\cdot B \\cdot C = \\overline{\\overline{ \\overline{\\overline{A \\cdot B}} \\cdot C }}',
        latex: `${funcName} = \\overline{ ${decomposedProductTerms.join(' + ')} }`
      })
    }

    if (decomposedProductTerms.length === 1) {
      steps.push({
        title: 'Biểu thức ngõ ra cuối cùng',
        description: `Vì hàm chỉ có 1 số hạng $P_1$, ngõ ra thu được là:`,
        ruleName: 'Cổng ngõ ra đơn',
        ruleFormula: `${funcName} = \\overline{P_1}`,
        latex: `${funcName} = \\overline{${decomposedProductTerms[0]}}`
      })
    } else if (decomposedProductTerms.length === 2) {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra bằng cổng 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: 'Hai số hạng được gom qua cổng 2 đầu vào ở ngõ ra:',
        ruleName: 'Gom 2 số hạng bằng cổng 2 đầu vào',
        ruleFormula: `${funcName} = \\overline{ P_1 + P_2 }`,
        latex: `${funcName} = \\overline{ ${decomposedProductTerms[0]} + ${decomposedProductTerms[1]} }`,
        intermediateSignal: `${funcName} = \\overline{ P_1 + P_2 }`
      })
    } else if (decomposedProductTerms.length === 3) {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra theo từng cặp 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: 'Vì mỗi cổng chỉ có tối đa 2 đầu vào, ta gom 2 số hạng đầu $P_1, P_2$ bằng cách lấy phủ định 2 lần tạo tín hiệu trung gian $P_{12} = \\overline{\\overline{ P_1 + P_2 }}$, sau đó gom với số hạng thứ 3 $P_3$ ở ngõ ra:',
        ruleName: 'Phân tầng gom nhóm 2 đầu vào',
        ruleFormula: `${funcName} = \\overline{\\overline{ \\overline{\\overline{ P_1 + P_2 }} + P_3 }}`,
        latex: `${funcName} = \\overline{\\overline{ \\overline{\\overline{ ${decomposedProductTerms[0]} + ${decomposedProductTerms[1]} }} + ${decomposedProductTerms[2]} }}`,
        intermediateSignal: `${funcName} = \\overline{\\overline{ P_{12} + P_3 }} \\quad , \\quad P_{12} = \\overline{\\overline{ P_1 + P_2 }}`
      })
    } else {
      steps.push({
        title: 'Phân tầng thu gom ngõ ra theo cây nhị phân 2 đầu vào (Biểu thức hoàn chỉnh)',
        description: 'Với 4 số hạng, ta chia thành 2 nhánh cân bằng: gom $P_1, P_2$ tạo $P_{12}$; gom $P_3, P_4$ tạo $P_{34}$; sau đó gom $P_{12}, P_{34}$ ở ngõ ra:',
        ruleName: 'Cây nhị phân ghép tầng qua tín hiệu trung gian',
        ruleFormula: `${funcName} = \\overline{\\overline{ \\overline{\\overline{ P_1 + P_2 }} + \\overline{\\overline{ P_3 + P_4 }} }}`,
        latex: `${funcName} = \\overline{\\overline{ \\overline{\\overline{ ${decomposedProductTerms[0]} + ${decomposedProductTerms[1]} }} + \\overline{\\overline{ ${decomposedProductTerms[2]} + ${decomposedProductTerms[3]} }} }}`,
        intermediateSignal: `${funcName} = \\overline{\\overline{ P_{12} + P_{34} }} \\quad , \\quad P_{12} = \\overline{\\overline{ P_1 + P_2 }} \\quad , \\quad P_{34} = \\overline{\\overline{ P_3 + P_4 }}`
      })
    }

    return steps
  }

  steps.push({
    title: 'Phân phối dấu gạch dưới theo định luật De Morgan',
    description: 'Giữ nguyên dấu gạch phủ định ở trên cùng. Áp dụng định luật De Morgan cho dấu gạch phủ định bên dưới: phép nhân giữa các thừa số tổng chuyển thành phép cộng giữa các thừa số có dấu gạch đảo:',
    ruleName: 'Định luật De Morgan cho phép nhân',
    ruleFormula: '\\overline{X_1 \\cdot X_2 \\cdots X_k} = \\overline{X_1} + \\overline{X_2} + \\dots + \\overline{X_k}',
    latex: `${funcName} = \\overline{ ${groups.map((g) => `\\overline{${termToPosInner(g)}}`).join(' + ')} }`
  })

  const norTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')
    return `\\overline{${inside}}`
  })

  if (targetGate === 'nor_n') {
    steps.push({
      title: 'Kết luận cấu trúc sơ đồ toàn cổng NOR N đầu vào',
      description: `Mỗi thành phần thừa số đảo $\\overline{M_i}$ được thực hiện bởi 1 cổng NOR N đầu vào ở tầng 1: ${groups.map((_, i) => `$\\overline{M_{${i + 1}}} = ${norTerms[i]}$`).join(', ')}. Tầng 2 gồm đúng 1 cổng NOR có ${groups.length} đầu vào gom toàn bộ các tín hiệu tầng 1 để cho ra kết quả $Y$.`,
      ruleName: 'Mạch logic 2 tầng toàn NOR N đầu vào',
      ruleFormula: 'Y = \\text{NOR}(\\overline{M_1}, \\overline{M_2}, \\dots, \\overline{M_k})',
      latex: `${funcName} = \\overline{ ${norTerms.join(' + ')} }`
    })
    return steps
  }

  const decomposedNorTerms: string[] = []
  let hasMultiSum = false

  groups.forEach((g, idx) => {
    const litCount = g.literals.length
    if (litCount <= 2) {
      decomposedNorTerms.push(norTerms[idx])
    } else if (litCount === 3) {
      hasMultiSum = true
      const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} + ${l1}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair}} + ${l2} }`)
    } else {
      hasMultiSum = true
      const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} + ${l1}}`
      const pair2 = `\\overline{${l2} + ${l3}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`)
    }
  })

  if (hasMultiSum) {
    steps.push({
      title: 'Tách các thừa số có từ 3 biến trở lên về cổng NOR 2 đầu vào',
      description: 'Vì mỗi cổng logic chỉ có tối đa 2 đầu vào, các thừa số có từ 3 biến trở lên được tách thành chuỗi các cổng NOR 2 đầu vào nối tiếp qua các cổng đảo chập chân:\n' +
        groups.map((_, i) => `• $\\overline{M_{${i + 1}}} = ${decomposedNorTerms[i]}$`).join('\n'),
      ruleName: 'Phân tích tổng nhiều biến bằng cổng NOR 2 đầu vào',
      ruleFormula: '\\overline{A + B + C} = \\overline{ \\overline{\\overline{A + B}} + C }',
      latex: groups.map((_, i) => `\\overline{M_{${i + 1}}} = ${decomposedNorTerms[i]}`).join(' \\quad , \\quad ')
    })
  }

  if (decomposedNorTerms.length === 1) {
    steps.push({
      title: 'Biểu thức ngõ ra cuối cùng',
      description: `Vì hàm chỉ có 1 thừa số tổng $M_1$, ta lấy qua 1 cổng NOR chập chân để thu được $Y = M_1$:`,
      ruleName: 'Cổng đảo ngõ ra đơn',
      ruleFormula: `${funcName} = \\overline{V_1} = M_1`,
      latex: `${funcName} = \\overline{${decomposedNorTerms[0]}}`
    })
  } else if (decomposedNorTerms.length === 2) {
    steps.push({
      title: 'Phân tầng thu gom ngõ ra bằng cổng NOR 2 đầu vào (Biểu thức hoàn chỉnh)',
      description: 'Hai tín hiệu tầng 1 được đưa thẳng vào 1 cổng NOR 2 đầu vào duy nhất ở ngõ ra:',
      ruleName: 'Gom 2 thừa số bằng 1 cổng NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ V_1 + V_2 }',
      latex: `${funcName} = \\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }`
    })
  } else if (decomposedNorTerms.length === 3) {
    steps.push({
      title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
      description: 'Vì mỗi cổng NOR chỉ có tối đa 2 đầu vào, ta gom 2 thừa số đầu qua cổng NOR và cổng đảo tạo tín hiệu trung gian $S_{12}$, sau đó gom với thừa số thứ 3:',
      ruleName: 'Phân tầng tuần tự qua cổng NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ S_{12} + \\overline{M_3} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }}',
      latex: `${funcName} = \\overline{ S_{12} + \\overline{M_3} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }}`
    })
    steps.push({
      title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
      description: 'Thay thế các thừa số vào phương trình phân tầng, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào:',
      ruleName: 'Biểu thức logic toàn phần NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} + \\overline{M_3} }',
      latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }} + ${decomposedNorTerms[2]} }`,
      intermediateSignal: `${funcName} = \\overline{ S_{12} + \\overline{M_3} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }}`
    })
  } else {
    steps.push({
      title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
      description: 'Với 4 thừa số, ta chia thành 2 nhánh cân bằng bằng cổng NOR 2 đầu vào:',
      ruleName: 'Cây nhị phân ghép tầng qua cổng NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ S_{12} + S_{34} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} \\quad , \\quad S_{34} = \\overline{\\overline{ \\overline{M_3} + \\overline{M_4} }}',
      latex: `${funcName} = \\overline{ S_{12} + S_{34} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} \\quad , \\quad S_{34} = \\overline{\\overline{ \\overline{M_3} + \\overline{M_4} }}`
    })
    steps.push({
      title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
      description: 'Thay thế các thừa số vào phương trình phân tầng, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào:',
      ruleName: 'Biểu thức logic toàn phần NOR 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} + \\overline{\\overline{ \\overline{M_3} + \\overline{M_4} }} }',
      latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }} + \\overline{\\overline{ ${decomposedNorTerms[2]} + ${decomposedNorTerms[3]} }} }`,
      intermediateSignal: `${funcName} = \\overline{ S_{12} + S_{34} } \\quad , \\quad S_{12} = \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} \\quad , \\quad S_{34} = \\overline{\\overline{ \\overline{M_3} + \\overline{M_4} }}`
    })
  }

  return steps
}
