import type {CellValue,CombinationalOptStrategy,CombinationalOutputResult,CombinationalRow,OptimizationForm} from '../types'
import {solveKMap} from './kmapSolver'

export function solveCombinationalOutputs(outputVars:string[],rows:CombinationalRow[],strategy:CombinationalOptStrategy,overrides:Record<string,OptimizationForm>={}):CombinationalOutputResult[] {
    return outputVars.map((outVarName, outIdx) => {
      const gValues: Record<number, CellValue> = {}
      let oneCount = 0
      let zeroCount = 0

      for (let m = 0; m < 16; m++) {
        const row = rows.find((r) => r.decimal === m)
        if (row && !row.isUnused) {
          const bit = row.outputBits[outIdx]
          if (![0,1,'X'].includes(bit)) throw new Error(`Giá trị ${outVarName} tại ô ${m} phải là 0, 1 hoặc X.`)
          if (bit === 1) oneCount++
          else if (bit === 0) zeroCount++
          gValues[m] = bit === 'X' ? 'd' : bit === 1 ? 1 : 0
        } else {
          gValues[m] = 'd'
        }
      }

      let chosenForm: OptimizationForm = 'SOP'
      let reasonText = ''

      const override = overrides[outVarName]
      if (override) {
        chosenForm = override
        reasonText = `Thủ công: ${chosenForm === 'SOP' ? 'Khoanh theo ô 1 (SOP)' : 'Khoanh theo ô 0 (POS)'} (${oneCount} ô 1, ${zeroCount} ô 0)`
      } else if (strategy === 'sop') {
        chosenForm = 'SOP'
        reasonText = `Cố định theo ô 1 (SOP: ${oneCount} ô 1, ${zeroCount} ô 0)`
      } else if (strategy === 'pos') {
        chosenForm = 'POS'
        reasonText = `Cố định theo ô 0 (POS: ${zeroCount} ô 0, ${oneCount} ô 1)`
      } else {
        if (oneCount < zeroCount) {
          chosenForm = 'SOP'
          reasonText = `Ưu tiên ô 1 (${oneCount} ô 1 < ${zeroCount} ô 0) ➔ Rút gọn theo 1 (SOP)`
        } else if (zeroCount < oneCount) {
          chosenForm = 'POS'
          reasonText = `Ưu tiên ô 0 (${zeroCount} ô 0 < ${oneCount} ô 1) ➔ Rút gọn theo 0 (POS)`
        } else {
          chosenForm = 'SOP'
          reasonText = `Số ô bằng nhau (${oneCount} ô 1 = ${zeroCount} ô 0) ➔ Mặc định rút gọn theo 1 (SOP)`
        }
      }

      const { groups: gList, simplifiedLatex: sLatex, simplifiedPlain: sPlain } = solveKMap(4, gValues, chosenForm)

      const uniqueGroups = gList.map((g, gIdx) => ({
        ...g,
        id: `${outVarName}-grp-${gIdx}`
      }))

      return {
        name: outVarName,
        groups: uniqueGroups,
        simplifiedLatex: sLatex,
        simplifiedPlain: sPlain,
        gridValues: gValues,
        form: chosenForm,
        oneCount,
        zeroCount,
        reasonText
      }
    })
}
