import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)?s+'.ts':s,c)}})
const {generateBasicCircuit,generateTargetGateCircuit,generateMultiOutputBasicCircuit}=await import('../src/utils/circuitGenerator.ts')
const {solveKMap}=await import('../src/utils/kmapSolver.ts')
function evaluate(diagram,state,count,outputId){
 const nodes=new Map(diagram.nodes.map(n=>[n.id,n])),cache=new Map()
 function value(id){
  if(cache.has(id))return cache.get(id)
  if(/^[~]?[ABCD]$/.test(id)){const bit=Boolean(state&(1<<(count-1-'ABCD'.indexOf(id.at(-1)))));return id.startsWith('~')?!bit:bit}
  const node=nodes.get(id);assert.ok(node,`Unresolved signal ${id}`)
  const inputs=node.inputs.map(value)
  const result=node.type==='input'?value(node.label.replace(/̄/g,'').replace(/^/,'')+(node.label.includes('̄')?'':'')):node.type==='output'?node.inputs.length?inputs[0]:node.label.endsWith('1'):node.type==='not'?!inputs[0]:node.type==='and'?inputs.every(Boolean):node.type==='or'?inputs.some(Boolean):node.type==='nand'?!inputs.every(Boolean):!inputs.some(Boolean)
  cache.set(id,result);return result
 }
 return Number(value(outputId??diagram.nodes.findLast(n=>n.type==='output').id))
}
let checked=0
let seed=20261111
const cases=[[15],[0,3,5,6,9,10,12,15],[0,1,2,3,4,5,6,7],[],Array.from({length:16},(_,i)=>i)]
for(let sample=0;sample<128;sample++)cases.push(Array.from({length:16},(_,i)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%3===0?i:null}).filter(i=>i!==null))
for(const count of [2,3,4])for(const form of ['SOP','POS'])for(const target of ['basic','nand_2','nor_2','nand_n','nor_n'])for(const ones of cases){
 const grid=Object.fromEntries(Array.from({length:1<<count},(_,m)=>[m,ones.includes(m)?1:0]))
 const {groups}=solveKMap(count,grid,form)
 const diagram=target==='basic'?generateBasicCircuit(groups,count,form):generateTargetGateCircuit(groups,count,form,target)
 for(let state=0;state<1<<count;state++)assert.equal(evaluate(diagram,state,count),grid[state],`${form}/${target}, state=${state}, ones=${ones}`)
 const gates=diagram.nodes.filter((node)=>['and','or','nand','nor'].includes(node.type))
 for(let i=0;i<gates.length;i++)for(let j=i+1;j<gates.length;j++)assert.ok(Math.abs(gates[i].x-gates[j].x)>=54||Math.abs(gates[i].y-gates[j].y)>=42,`Overlapping gates: ${gates[i].id}/${gates[j].id}`)
 for(const node of diagram.nodes)if(target.endsWith('_2')&&['nand','nor'].includes(node.type))assert.equal(node.inputs.length,2)
 for(const wire of diagram.wires)for(let i=1;i<wire.points.length;i++)for(const gate of gates){
  if(gate.id===wire.fromNodeId||gate.id===wire.toNodeId||gate.id.startsWith('tied-not-'))continue
  const a=wire.points[i-1],b=wire.points[i]
  const intersects=a.y===b.y?a.y>gate.y-17&&a.y<gate.y+17&&Math.max(a.x,b.x)>gate.x-19&&Math.min(a.x,b.x)<gate.x+19:a.x===b.x&&a.x>gate.x-19&&a.x<gate.x+19&&Math.max(a.y,b.y)>gate.y-17&&Math.min(a.y,b.y)<gate.y+17
  assert.ok(!intersects,`Wire ${wire.fromNodeId}/${wire.toNodeId} crosses gate ${gate.id}`)
 }
 checked++
}
console.log(`PASS: ${checked} circuits evaluated from actual gate inputs across every input state for 2–4 variables`)

for(const form of ['SOP','POS']) {
 const examples=[[],Array.from({length:16},(_,i)=>i),[15],[0,1,2,3,4,5,6,7],[3,6,7,11,12,13,14,15]]
 const outputs=examples.map((ones,index)=>({name:`F_${index+1}`,form,groups:solveKMap(4,Object.fromEntries(Array.from({length:16},(_,m)=>[m,ones.includes(m)?1:0])),form).groups}))
 const diagram=generateMultiOutputBasicCircuit(outputs,4,form)
 for(let index=0;index<outputs.length;index++)for(let m=0;m<16;m++)assert.equal(evaluate(diagram,m,4,`output-${index}-out-gate`),Number(examples[index].includes(m)),`${form}/F${index+1}/${m}`)
}
console.log('PASS: multi-output circuit uses the same checked basic generator; SOP/POS constants and one-literal signals evaluated independently')
