import type { CellValue,CombinationalRow,OptimizationForm,TargetGateType } from '../types'

// Tables transcribed from the supplied course documents; values are code words, not weights.
export const COURSE_CODE_PRESETS = [
  { label:'5211 → nhị phân (bản chữa Câu 2, trang 8)', inputs:[0,1,4,5,7,8,9,12,13,15], outputs:[0,1,2,3,4,5,6,7,8,9] },
  { label:'5211 → mã vòng dư 3 (Bài tập ôn tập, Câu 2_2)', inputs:[0,1,4,5,7,8,9,12,13,15], outputs:[2,6,7,5,4,12,13,15,14,10] },
  { label:'Mã A → mã B (Bài tập ôn tập, Câu 2_1)', inputs:[0,3,11,4,13,7,9,10,12,5], outputs:[3,11,4,13,7,9,10,12,5,0] }
]
export function courseCodeRows(preset: typeof COURSE_CODE_PRESETS[number]): CombinationalRow[] {
  return preset.inputs.map((decimal,index)=>({id:`course-${decimal}`,decimal,inputBits:[3,2,1,0].map((bit)=>(decimal>>bit)&1),outputBits:[3,2,1,0].map((bit)=>((preset.outputs[index]>>bit)&1) as 0|1),isUnused:false}))
}
export const CHAIR_MINTERMS = [3,6,7,11,12,13,14,15]

export const COURSE_RULE_PRESETS = [
  {label:'4 ghế: ít nhất 2 ghế liền nhau có người (F = AB + BC + CD)',minterms:CHAIR_MINTERMS},
  {label:'Chia hết cho 2 hoặc 3 (Đề 18)',minterms:[0,2,3,4,6,8,9,10,12,14,15]},
  {label:'Chia hết cho 2 hoặc 5 (Đề cương C5, đủ 16 tổ hợp)',minterms:[0,2,4,5,6,8,10,12,14,15]},
  {label:'Chia hết cho 3 hoặc 5',minterms:[0,3,5,6,9,10,12,15]}
]

export type BooleanExample={label:string;form:OptimizationForm;gate:TargetGateType;terms:number[];dc:number[]}
export const BOOLEAN_EXAMPLES:BooleanExample[]=[
 {label:'Đề 15 · Câu 1',form:'SOP',gate:'nand_2',terms:[3,5,6,9,12,14],dc:[1,4,11]},
 {label:'Đề 16 · Câu 1',form:'POS',gate:'nand_2',terms:[0,3,5,7,8,13,15],dc:[9,11,12]},
 {label:'Đề 17 · Câu 1',form:'POS',gate:'nand_2',terms:[1,2,3,7,9,11,12],dc:[6,13,14]},
 {label:'Đề 18 · Câu 1',form:'SOP',gate:'nor_2',terms:[0,1,4,5,8,10,12,14,15],dc:[]},
 {label:'Đề 19 · Câu 1',form:'SOP',gate:'nor_2',terms:[2,3,5,7,12,13,14,15],dc:[]},
 {label:'Đề 20 · Câu 1',form:'SOP',gate:'nor_2',terms:[0,1,3,6,8,12,14],dc:[4,15]},
 {label:'Ôn tập · Câu 1_1',form:'POS',gate:'nand_2',terms:[0,3,5,7,8,13,15],dc:[9,11,12]},
 {label:'Ôn tập · Câu 1_2',form:'POS',gate:'nor_2',terms:[0,1,2,7,10,13,15],dc:[3,5,9]},
 {label:'Ôn tập · Câu 1_3',form:'SOP',gate:'nand_2',terms:[0,1,4,5,7,9],dc:[3,6,14]},
 {label:'Ôn tập · Câu 1_4',form:'SOP',gate:'nor_2',terms:[1,3,6,9,12,14],dc:[4,5,7]},
 {label:'Ôn tập · Câu 1_5',form:'POS',gate:'nand_2',terms:[0,2,3,4,5,8,10,12],dc:[7,13,14]},
 {label:'Ôn tập · Câu 1_6',form:'SOP',gate:'nor_2',terms:[0,2,4,5,8,12],dc:[7,11,13]},
 {label:'Ôn tập · Câu 1_7',form:'SOP',gate:'nor_2',terms:[0,1,3,6,8,12,14],dc:[4,15]},
 {label:'Ôn tập · Câu 1_8',form:'POS',gate:'nand_2',terms:[1,2,3,7,9,11,12],dc:[6,13,14]},
 {label:'Đề cương · Câu 1',form:'POS',gate:'nand_2',terms:[0,2,3,9,11,13,15],dc:[4,10,14]},
 {label:'Đề cương · Câu 2',form:'SOP',gate:'nand_2',terms:[1,2,4,5,9,10,12],dc:[0,13,14]},
 {label:'Đề cương · Câu 3',form:'SOP',gate:'nor_2',terms:[2,3,5,7,12,13,14,15],dc:[]}
]
export function booleanExampleGrid(example:BooleanExample):Record<number,CellValue> {
 return Object.fromEntries(Array.from({length:16},(_,m)=>[m,example.dc.includes(m)?'d':example.terms.includes(m)?example.form==='SOP'?1:0:example.form==='SOP'?0:1]))
}
export const COUNTER_EXAMPLES=[
 {label:'Đề 15 · Dãy 2,4,6,8,10,12,14,15',mode:'sequence',ff:'JK',sequence:'2,4,6,8,10,12,14,15'},
 {label:'Đề 16 / Ôn tập 3_1 · Đếm tiến modul 11',mode:'up',ff:'JK',modulus:11},
 {label:'Đề 17 · Đếm tiến modul 7',mode:'up',ff:'JK',modulus:7},
 {label:'Đề 18 · Đếm lùi modul 9',mode:'down',ff:'JK',modulus:9},
 {label:'Đề 19 / Ôn tập 3_6 · Dãy số lẻ',mode:'sequence',ff:'JK',sequence:'1,3,5,7,9,11,13,15'},
 {label:'Đề 20 · Đếm tiến modul 6',mode:'up',ff:'JK',modulus:6},
 {label:'Đề cương 7 · Đếm tiến modul 10',mode:'up',ff:'JK',modulus:10},
 {label:'Đề cương 8 · Đếm lùi modul 12',mode:'down',ff:'JK',modulus:12},
 {label:'Đề cương 9 · Dãy 1,2,5,6,8,11,12,13,15',mode:'sequence',ff:'JK',sequence:'1,2,5,6,8,11,12,13,15'},
 {label:'Ôn tập 3_2 · Đếm lùi modul 10',mode:'down',ff:'JK',modulus:10},
 {label:'Ôn tập 3_3 · Z1,Z2 · RS',mode:'waveform',ff:'RS',z1:'0111110000',z2:'0101011101'},
 {label:'Ôn tập 3_4 · Z1,Z2 · RS',mode:'waveform',ff:'RS',z1:'0111101100',z2:'0101011001'},
 {label:'Ôn tập 3_5 · Dãy 2,3,5,7,9,11,13,14',mode:'sequence',ff:'JK',sequence:'2,3,5,7,9,11,13,14'}
] as const
