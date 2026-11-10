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

  return transformGate(groups, form, targetGate, funcName)
}

const negate = (expression: string) => `\\overline{${expression}}`

// Group each pair before inversion; NAND/NOR itself is not associative.
function gateExpression(values: string[], operator: string, inverted: boolean, binary: boolean): string {
  if (values.length === 1) return inverted ? negate(values[0]) : values[0]
  let inputs = values
  if (binary && values.length > 2) {
    const middle = Math.ceil(values.length / 2)
    inputs = [gateExpression(values.slice(0, middle), operator, false, true), gateExpression(values.slice(middle), operator, false, true)]
  }
  const expression = inputs.join(operator)
  return inverted ? negate(expression) : negate(negate(expression))
}

function transformGate(groups: KMapGroup[], form: OptimizationForm, targetGate: TargetGateType, funcName: string): TransformationStep[] {
  const nand = targetGate.startsWith('nand')
  const binary = targetGate.endsWith('_2')
  const gate = nand ? 'NAND' : 'NOR'
  const operator = nand ? ' \\cdot ' : ' + '
  const outerOperator = form === 'SOP' ? ' + ' : ' \\cdot '
  const crossForm = (form === 'POS') === nand
  const terms = groups.map(form === 'SOP' ? termToSopLatex : termToPosLatex)
  const initial = terms.join(outerOperator)
  const step = (title: string, description: string, expression: string, ruleName: string, ruleFormula: string): TransformationStep => ({ title, description, latex: `${funcName} = ${expression}`, ruleName, ruleFormula })
  if (groups.some((group) => group.literals.length === 0)) {
    return [step('Hàm logic hằng số', 'Nhóm phủ toàn bộ bìa Karnaugh.', form === 'SOP' ? '1' : '0', 'Hằng số logic', initial)]
  }
  const literalTerms = groups.map((group) => group.literals.map((literal) => crossForm
    ? formatComplementLiteral(literal.variable, literal.inverted)
    : formatLiteral(literal.variable, literal.inverted)))
  const converted = literalTerms.map((literals) => negate(literals.join(operator)))
  const deMorgan = crossForm ? converted.join(outerOperator) : negate(converted.join(operator))
  const steps = [
    step('Biểu thức rút gọn từ bìa Karnaugh', `Viết hàm ở dạng ${form}.`, initial, form, form === 'SOP' ? 'Y = T_1 + T_2 + \\dots + T_k' : 'Y = M_1 \\cdot M_2 \\cdots M_k'),
    step(crossForm ? 'Phủ định kép từng thành phần' : 'Phủ định kép toàn biểu thức', crossForm ? 'Lấy phủ định hai lần từng thành phần, giữ nguyên phép nối giữa các thành phần.' : 'Lấy phủ định hai lần toàn bộ biểu thức.', crossForm ? terms.map((term) => negate(negate(term))).join(outerOperator) : negate(negate(initial)), 'Định luật hoàn nguyên', '\\overline{\\overline{X}} = X'),
    step('Áp dụng định luật De Morgan', crossForm ? `Đổi từng thành phần sang dạng ${gate}, giữ nguyên phép ${form === 'POS' ? 'nhân' : 'cộng'} bên ngoài.` : 'Phân phối dấu phủ định bên trong, giữ nguyên dấu phủ định ngoài cùng.', deMorgan, 'Định luật De Morgan', crossForm ? (nand ? 'A+B=\\overline{\\overline{A}\\cdot\\overline{B}}' : 'A\\cdot B=\\overline{\\overline{A}+\\overline{B}}') : (nand ? '\\overline{A+B}=\\overline{A}\\cdot\\overline{B}' : '\\overline{A\\cdot B}=\\overline{A}+\\overline{B}'))
  ]
  const inner = literalTerms.map((literals) => gateExpression(literals, operator, true, binary))
  if (binary && literalTerms.some((literals) => literals.length > 2)) {
    steps.push(step(`Tách từng thành phần về ${gate} 2 đầu vào`, 'Gom từng cặp và thêm phủ định kép để giữ nguyên giá trị.', crossForm ? inner.join(outerOperator) : negate(inner.join(operator)), 'Phủ định kép từng cặp', nand ? '\\overline{ABC}=\\overline{\\overline{\\overline{AB}}\\cdot C}' : '\\overline{A+B+C}=\\overline{\\overline{\\overline{A+B}}+C}'))
  }
  const final = gateExpression(inner, operator, !crossForm, binary)
  steps.push(step(`Biểu thức toàn ${gate} ${binary ? '2' : 'N'} đầu vào`, binary ? 'Gom các thành phần theo từng cặp. Mỗi dấu phủ định đơn thực hiện bằng cổng chập hai đầu vào.' : 'Dùng cổng nhiều đầu vào; dấu phủ định đơn thực hiện bằng cổng chập đầu vào.', final, 'Định luật hoàn nguyên', '\\overline{\\overline{X}}=X'))
  return steps
}
