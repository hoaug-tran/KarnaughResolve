import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {readFileSync,existsSync} from 'node:fs'
registerHooks({resolve(specifier,context,next){return next(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier)?specifier+(existsSync(new URL(specifier+'.tsx',context.parentURL))?'.tsx':'.ts'):specifier,context)}})
const {solveKMap}=await import('../src/utils/kmapSolver.ts')
const {solveCounter,moduloSequence,stepCounter,convertFlipFlop,nextFlipFlop,evaluateOutput,FF_INPUTS,waveformSequence}=await import('../src/utils/sequentialSolver.ts')
const {layoutSequentialDiagram,registerOutputs}=await import('../src/utils/sequentialDiagram.ts')
const zero=[0,2,3,9,11,13,15],dc=[4,10,14]
const grid=Object.fromEntries(Array.from({length:16},(_,i)=>[i,dc.includes(i)?'d':zero.includes(i)?0:1]))
const solution=solveKMap(4,grid,'POS')
assert.deepEqual(solution.groups.map((g)=>g.cells.length),[4,4,2])
// Câu 1, đề 15–20: use stated functions, never force a three-literal limit.
for(const [exam,inputForm,terms,dc] of [
 [15,'SOP',[3,5,6,9,12,14],[1,4,11]],
 [16,'POS',[0,3,5,7,8,13,15],[9,11,12]],
 [17,'POS',[1,2,3,7,9,11,12],[6,13,14]],
 [18,'SOP',[0,1,4,5,8,10,12,14,15],[]],
 [19,'SOP',[2,3,5,7,12,13,14,15],[]],
 [20,'SOP',[0,1,3,6,8,12,14],[4,15]]
]) {
 const grid=Object.fromEntries(Array.from({length:16},(_,m)=>[m,dc.includes(m)?'d':terms.includes(m)?inputForm==='SOP'?1:0:inputForm==='SOP'?0:1]))
 for(const form of ['SOP','POS']) {
  const result=solveKMap(4,grid,form)
  assert.ok(result.groups.every((group)=>group.literals.length<=3),`Exam ${exam}: unexpected singleton`)
  if(form===inputForm)assert.deepEqual(result.groups.map((group)=>group.cells.length),[4,4,2])
  for(let m=0;m<16;m++)if(grid[m]!=='d') {
   const terms=result.groups.map((group)=>group.literals.map((literal)=>Boolean(m&(1<<(3-'ABCD'.indexOf(literal.variable))))!==literal.inverted))
   assert.equal(form==='SOP'?Number(terms.some((term)=>term.every(Boolean))):Number(terms.every((term)=>term.some(Boolean))),grid[m])
  }
 }
}
const isolated=solveKMap(4,Object.fromEntries(Array.from({length:16},(_,m)=>[m,m===15?1:0])),'SOP')
assert.equal(isolated.groups[0].literals.length,4,'An isolated minterm must retain all four literals')
console.log('PASS: all six exam C1 inputs minimize to 4,4,2; no four-literal terms in either form; isolated minterms remain correct')

for(const type of Object.keys(FF_INPUTS))for(const direction of ['up','down'])for(let m=2;m<=16;m++)for(const policy of ['dontcare','recover'])for(const async of [false,true]) {
 const sequence=moduloSequence(m,direction),result=solveCounter(sequence,type,policy,async,direction)
 sequence.forEach((state,i)=>assert.equal(stepCounter(result,state),sequence[(i+1)%m]))
 for(const output of result.outputs)for(const [state,value] of Object.entries(output.gridValues))if(value!=='d')assert.equal(evaluateOutput(output,Number(state),result.variables),value,output.name)
 const layout=layoutSequentialDiagram(result.variables,result.outputs,type,false,result.resetOutput)
 assert.equal(layout.rails.length,2*result.count)
 assert.equal(layout.blocks.length,result.count)
 assert.ok(layout.termY>layout.rails.at(-1).y)
 assert.ok(layout.ffY>layout.collectorY&&layout.collectorY>layout.termY)
 for(const block of layout.blocks)for(const pin of block.pins)for(const group of pin.output.groups)for(const literal of group.literals)assert.ok(layout.railFor(literal))
 if(policy==='recover'&&!async) for(const row of result.rows) if(!sequence.includes(row.current))assert.equal(stepCounter(result,row.current),sequence[0])
}
for(const available of Object.keys(FF_INPUTS))for(const desired of Object.keys(FF_INPUTS)){
 const converted=convertFlipFlop(available,desired)
 converted.rows.filter((row)=>row.next!==null).forEach((row)=>assert.equal(nextFlipFlop(available,row.bits.at(-1),converted.outputs.map((out)=>evaluateOutput(out,row.decimal,converted.variables))),row.next))
 layoutSequentialDiagram(['Q'],converted.outputs,available,true,undefined,converted.variables.filter((v)=>v!=='Q'))
}
for(let width=1;width<=8;width++)for(const direction of ['left','right'])for(const feedback of ['serial','ring','johnson'])for(const type of Object.keys(FF_INPUTS)){
 const variables=Array.from({length:width},(_,i)=>`Q_${i+1}`)
 if(feedback==='serial')variables.push('SI')
 const outputs=registerOutputs(width,direction,feedback,type)
 layoutSequentialDiagram(variables.slice(0,width),outputs,type,false,undefined,feedback==='serial'?['SI']:[])
 for(let state=0;state<1<<variables.length;state++){
  const value=feedback==='serial'?state>>1:state,si=state&1,mask=(1<<width)-1
  const edge=direction==='left'?value>>(width-1):value&1
  const input=feedback==='serial'?si:feedback==='ring'?edge:1-edge
  const expected=direction==='left'?((value<<1)|input)&mask:(value>>1)|(input<<(width-1))
  let next=0
  for(let bit=width-1;bit>=0;bit--)next=(next<<1)|nextFlipFlop(type,(value>>bit)&1,outputs.filter((o)=>o.name.endsWith(`_${width-bit}`)).map((out)=>evaluateOutput(out,state,variables)))
  assert.equal(next,expected)
 }
}
const wave=waveformSequence('0111110000','0101011101')
const result=solveCounter(wave.sequence,'RS','recover',false,'up',wave.count)
wave.sequence.forEach((state,i)=>assert.equal(stepCounter(result,state),wave.sequence[(i+1)%wave.sequence.length]))
console.log('PASS: default cover is 4,4,2; 480 counters, 16 FF conversions, all register controls and rail/FF layout contracts')

function oracle(grid,target){
 const required=Object.entries(grid).reduce((mask,[m,value])=>value===target?mask|(1<<m):mask,0),cubes=[]
 for(let code=0;code<81;code++){
  let rest=code;const digits=Array.from({length:4},()=>{const digit=rest%3;rest=Math.floor(rest/3);return digit})
  let cover=0,valid=true
  for(let m=0;m<16;m++)if(digits.every((digit,bit)=>digit===2||digit===((m>>bit)&1))){if(grid[m]!==target&&grid[m]!=='d'){valid=false;break}if(grid[m]===target)cover|=1<<m}
  if(valid&&cover)cubes.push({cover,literals:digits.filter((d)=>d!==2).length})
 }
 const memo=new Map([[0,[0,0]]])
 function visit(mask){if(memo.has(mask))return memo.get(mask);const bit=mask&-mask;let best=[Infinity,Infinity];for(const cube of cubes)if(cube.cover&bit){const tail=visit(mask&~cube.cover),cost=[tail[0]+1,tail[1]+cube.literals];if(cost[0]<best[0]||cost[0]===best[0]&&cost[1]<best[1])best=cost}memo.set(mask,best);return best}
 return visit(required)
}
let seed=2026
for(let sample=0;sample<128;sample++){
 const grid={};for(let m=0;m<16;m++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;grid[m]=[0,1,'d'][seed%3]}
 for(const form of ['SOP','POS']){
  const result=solveKMap(4,grid,form)
  assert.deepEqual([result.groups.length,result.groups.reduce((sum,g)=>sum+g.literals.length,0)],oracle(grid,form==='SOP'?1:0))
  assert.ok(result.groups.every((g,i)=>!i||result.groups[i-1].cells.length>=g.cells.length))
 }
}
console.log('PASS: independent exact-cover oracle and largest-group-first presentation on 256 seeded K-map cases')

const ts=(await import('typescript')).default
registerHooks({load(url,context,next){
 if(url.endsWith('.tsx'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true}
 return next(url,context)
}})
const {createElement}=await import('react')
const {renderToStaticMarkup}=await import('react-dom/server')
const {SequentialCircuit}=await import('../src/components/SequentialCircuit.tsx')
for(const type of ['JK','RS','D','T']) {
 const result=solveCounter(moduloSequence(11,'up'),type)
 const layout=layoutSequentialDiagram(result.variables,result.outputs,type)
 const html=renderToStaticMarkup(createElement(SequentialCircuit,{result}))
 assert.ok(html.includes('FF–Q₁'))
 for(const pin of FF_INPUTS[type])assert.ok(html.includes(`${pin}₁`))
 for(const rail of layout.rails){
  const x=rail.inverted?layout.width-30:145
  assert.ok(html.includes(`x="${x}" y="${rail.y-6}" text-anchor="${rail.inverted?'end':'start'}"`),'Q labels must alternate left/right')
 }
 assert.ok(html.includes('>CLR</text>')&&html.includes('baseline-shift="sub">k</tspan>'))
 assert.ok(!/PRE|INIT|LOAD|Chấm đặc|hồi tiếp trực tiếp/.test(html))
 assert.equal((html.match(/<rect[^>]*class="gate-shape"/g)||[]).length,result.count)
 for(const match of html.matchAll(/<polyline[^>]*points="([^"]+)"/g)){
  const ys=match[1].split(' ').map((point)=>Number(point.split(',')[1]))
  if(Math.max(...ys)>layout.ffY+104) assert.ok(Math.min(...ys)>=layout.ffY,'An output/control wire loops back to the top rails')
 }
}
console.log('PASS: rendered FF boxes have indexed pins, short Q outputs, shared Ck/CLR, no feedback loops or PRE/L/INIT explanations')

const {SequentialPanel}=await import('../src/components/SequentialPanel.tsx')
const panel=renderToStaticMarkup(createElement(SequentialPanel,{activeTab:'report'}))
const tableMarkup=panel.match(/<table class="combinational-table sequential-state-table">([\s\S]*?)<\/table>/)[1]
assert.equal((tableMarkup.match(/class="row-unused first-unused-row"/g)||[]).length,1)
assert.ok(tableMarkup.includes('<td>11</td>'))
for(const decimal of [12,13,14,15])assert.ok(!tableMarkup.includes(`<td>${decimal}</td>`))
assert.ok(!panel.includes('Nhóm toàn bộ bìa:')&&!panel.includes('Các ô ('))
assert.equal((panel.match(/class="sequential-map-result"/g)||[]).length,8)
for(const text of ['STT','T+1','Đầu ra','Q₁','Q₄','J₁','K₄','first-unused-row','cross-svg']) assert.ok(panel.includes(text),text)
for(const text of ['Khởi tạo bằng nạp','Cấp 1 xung','Nạp ban đầu','Thử trạng thái','Giản đồ tại các cạnh','Chuyển đổi FF','Thanh ghi dịch','ripple','Johnson']) assert.ok(!panel.includes(text),text)
for(const direction of ['up','down']) {
 const result=solveCounter(moduloSequence(9,direction),'JK')
 assert.deepEqual(result.variables,['Q_1','Q_2','Q_3','Q_4'])
 assert.deepEqual(result.outputs.map((output)=>output.name),['J_1','K_1','J_2','K_2','J_3','K_3','J_4','K_4'])
 assert.deepEqual(result.rows.slice(0,9).map((row)=>row.current),moduloSequence(9,direction))
 assert.deepEqual(result.rows.slice(9).map((row)=>row.current),[9,10,11,12,13,14,15])
}
console.log('PASS: C3 covers counting, arbitrary sequences and waveform exercises, grouped 1-based table, separated unused rows, no extra simulation/timing UI')

const downNine=solveCounter(moduloSequence(9,'down'),'JK')
const k1=downNine.outputs.find((output)=>output.name==='K_1')
assert.equal(k1.simplifiedLatex,'1')
assert.equal(k1.gridValues[8],1)
assert.ok(Object.values(k1.gridValues).every((value)=>value===1||value==='d'))
assert.equal(stepCounter(downNine,8),7)
console.log('PASS: each minimized input matches every specified excitation cell, including legitimate K1 = 1')

const styles=readFileSync('src/App.css','utf8')
assert.ok(!styles.includes('.sequential-panel button'))
assert.ok(panel.includes('class="single-output-kmap-card sequential-function"'))
assert.ok(panel.includes('class="segmented-control"')&&panel.includes('class="panel-config-row"'))
console.log('PASS: C3 uses shared page controls; Q labels left, complemented rails right')

const {CircuitViewer}=await import('../src/components/CircuitViewer.tsx')
const {generateTargetGateCircuit}=await import('../src/utils/circuitGenerator.ts')
for(const gate of ['nand_2','nand_n','nor_2','nor_n']){
 const diagram=generateTargetGateCircuit(solution.groups,4,'POS',gate)
 const html=renderToStaticMarkup(createElement(CircuitViewer,{diagram,title:'Circuit'}))
 assert.equal((html.match(/M -11 -12 L 11 -12 L 0 6 Z/g)||[]).length,4,'Input inverters must use triangle symbols')
 assert.ok(!html.includes('rotate(90)'))
}
console.log('PASS: all four input inverter symbols match the requested triangle-and-bubble reference')
