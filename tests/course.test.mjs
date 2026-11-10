import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {existsSync,readFileSync} from 'node:fs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)?s+(existsSync(new URL(s+'.tsx',c.parentURL))?'.tsx':'.ts'):s,c)}})
const {COURSE_CODE_PRESETS,COURSE_RULE_PRESETS,courseCodeRows,CHAIR_MINTERMS}=await import('../src/utils/coursePresets.ts')
const {parseSevenSegmentBits,COMMON_7SEG_PRESETS}=await import('../src/utils/sevenSegment.ts')
const {solveKMap}=await import('../src/utils/kmapSolver.ts')
const {solveCounter,moduloSequence,stepCounter}=await import('../src/utils/sequentialSolver.ts')
function truth(groups,form,m){const terms=groups.map(g=>g.literals.map(l=>Boolean(m&(1<<(3-'ABCD'.indexOf(l.variable))))!==l.inverted));return Number(form==='SOP'?terms.some(t=>t.every(Boolean)):terms.every(t=>t.some(Boolean)))}
for(let m=0;m<16;m++){
 const [a,b,c,d]=[3,2,1,0].map(bit=>(m>>bit)&1)
 assert.equal(Number(CHAIR_MINTERMS.includes(m)),(a&b)|(b&c)|(c&d))
}
for(const preset of COURSE_CODE_PRESETS){
 const rows=courseCodeRows(preset)
 assert.equal(new Set(rows.map(row=>row.decimal)).size,10)
 for(let bit=0;bit<4;bit++)for(const form of ['SOP','POS']){
  const grid=Object.fromEntries(Array.from({length:16},(_,m)=>[m,rows.find(r=>r.decimal===m)?.outputBits[bit]??'d']))
  const result=solveKMap(4,grid,form)
  rows.forEach(row=>assert.equal(truth(result.groups,form,row.decimal),row.outputBits[bit]))
 }
}
const glyphs={ '0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg',A:'abcefg',b:'cdefg',C:'adef',d:'bcdeg',E:'adefg',F:'aefg',H:'bcefg',P:'abefg','°':'abfg' }
for(const [glyph,segments] of Object.entries(glyphs))for(const polarity of ['anode_common','cathode_common']){
 const actual=parseSevenSegmentBits(glyph,polarity)
 for(const segment of 'abcdefg')assert.equal(actual[segment],Number(segments.includes(segment))^(polarity==='anode_common'?1:0),`${glyph}/${segment}`)
}
for(const preset of COMMON_7SEG_PRESETS)for(const segment of preset.segments??[]){
 const grid=Object.fromEntries(Array.from({length:16},(_,m)=>[m,m<preset.chars.length?parseSevenSegmentBits(preset.chars[m],preset.polarity)[segment]:'d']))
 for(const form of ['SOP','POS']){const result=solveKMap(4,grid,form);for(let m=0;m<preset.chars.length;m++)assert.equal(truth(result.groups,form,m),grid[m])}
}
for(const sequence of [[2,4,6,8,10,12,14,15],[1,3,5,7,9,11,13,15],[1,2,5,6,8,11,12,13,15],[2,3,5,7,9,11,13,14],moduloSequence(11,'up'),moduloSequence(7,'up'),moduloSequence(9,'down'),moduloSequence(6,'up')])for(const ff of ['JK','RS']){
 const result=solveCounter(sequence,ff)
 sequence.forEach((state,index)=>assert.equal(stepCounter(result,state),sequence[(index+1)%sequence.length]))
}

for(const [inputForm,terms,dc] of [
 ['POS',[0,3,5,7,8,13,15],[9,11,12]],
 ['POS',[0,1,2,7,10,13,15],[3,5,9]],
 ['SOP',[0,1,4,5,7,9],[3,6,14]],
 ['SOP',[1,3,6,9,12,14],[4,5,7]],
 ['POS',[0,2,3,4,5,8,10,12],[7,13,14]],
 ['SOP',[0,2,4,5,8,12],[7,11,13]],
 ['SOP',[0,1,3,6,8,12,14],[4,15]],
 ['POS',[1,2,3,7,9,11,12],[6,13,14]],
 ['POS',[0,2,3,9,11,13,15],[4,10,14]],
 ['SOP',[1,2,4,5,9,10,12],[0,13,14]]
]) {
 const grid=Object.fromEntries(Array.from({length:16},(_,m)=>[m,dc.includes(m)?'d':terms.includes(m)?inputForm==='SOP'?1:0:inputForm==='SOP'?0:1]))
 for(const form of ['SOP','POS']){const result=solveKMap(4,grid,form);for(let m=0;m<16;m++)if(grid[m]!=='d')assert.equal(truth(result.groups,form,m),grid[m])}
}
const ts=(await import('typescript')).default
registerHooks({load(url,c,n){if(url.endsWith('.tsx'))return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText};return n(url,c)}})
const {createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server')
const {CombinationalInputPanel}=await import('../src/components/CombinationalInputPanel.tsx')
for(const [label,predicate] of [['4 ghế',m=>Boolean((m&12)===12||(m&6)===6||(m&3)===3)],['Chia hết cho 2 hoặc 5',m=>m%2===0||m%5===0],['Chia hết cho 2 hoặc 3',m=>m%2===0||m%3===0],['Chia hết cho 3 hoặc 5',m=>m%3===0||m%5===0]]){
 const props={subtype:'single_rule',outputPrefix:'F',onOutputPrefixChange:()=>{},onSubtypeChange:()=>{},onSingleRuleRowsChange:()=>{},onConverterRowsChange:()=>{},polarity:'cathode_common',onPolarityChange:()=>{},sevenSegChars:'',onSevenSegCharsChange:()=>{},selectedOutputs:[],onSelectedOutputsChange:()=>{},optStrategy:'auto',onOptStrategyChange:()=>{}}
 const html=renderToStaticMarkup(createElement(CombinationalInputPanel,props))
 assert.ok(html.includes(label))
 const minterms=COURSE_RULE_PRESETS.find(preset=>preset.label.startsWith(label)).minterms
 for(let m=0;m<16;m++)assert.equal(minterms.includes(m),predicate(m))
}
console.log('PASS: course code tables, glyphs and both LED polarities, all exam counter cycles, chair and divisibility presets across all 16 inputs')

const {solveCombinationalOutputs}=await import('../src/utils/combinationalSolver.ts')
for(const preset of COURSE_CODE_PRESETS)for(const strategy of ['auto','sop','pos']){
 const rows=courseCodeRows(preset)
 const outputs=solveCombinationalOutputs(['F1','F2','F3','F4'],rows,strategy)
 outputs.forEach((output,bit)=>{
  rows.forEach(row=>assert.equal(truth(output.groups,output.form,row.decimal),row.outputBits[bit]))
  if(strategy==='auto')assert.equal(output.form,output.zeroCount<output.oneCount?'POS':'SOP')
 })
}
const dcRow=[{id:'test',decimal:0,inputBits:[0,0,0,0],outputBits:['X']}]
assert.equal(solveCombinationalOutputs(['F'],dcRow,'auto')[0].gridValues[0],'d')
assert.throws(()=>solveCombinationalOutputs(['F'],[{...dcRow[0],outputBits:[2]}],'auto'))
console.log('PASS: actual C2 solver matches source code tables, chooses fewer 0/1 cells and preserves X')

const {BOOLEAN_EXAMPLES,booleanExampleGrid,COUNTER_EXAMPLES}=await import('../src/utils/coursePresets.ts')
const {parseStateSequence,waveformSequence}=await import('../src/utils/sequentialSolver.ts')
for(const example of BOOLEAN_EXAMPLES){
 const grid=booleanExampleGrid(example)
 const result=solveKMap(4,grid,example.form)
 for(let m=0;m<16;m++)if(grid[m]!=='d')assert.equal(truth(result.groups,example.form,m),grid[m],example.label)
}
for(const preset of COUNTER_EXAMPLES){
 const wave=preset.mode==='waveform'?waveformSequence(preset.z1,preset.z2):null
 const sequence=preset.mode==='sequence'?parseStateSequence(preset.sequence):preset.mode==='waveform'?wave.sequence:moduloSequence(preset.modulus,preset.mode)
 const result=solveCounter(sequence,preset.ff,'dontcare',false,preset.mode==='down'?'down':'up',wave?.count)
 sequence.forEach((state,index)=>{
  assert.equal(stepCounter(result,state),sequence[(index+1)%sequence.length],preset.label)
  if(wave){assert.equal((state>>(result.count-1))&1,Number(preset.z1[index]));assert.equal((state>>(result.count-2))&1,Number(preset.z2[index]))}
 })
}
console.log(`PASS: all ${BOOLEAN_EXAMPLES.length} Boolean and ${COUNTER_EXAMPLES.length} counter presets preserve source data and complete cycles`)
