import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)?s+'.ts':s,c)}})
const {solveKMap}=await import('../src/utils/kmapSolver.ts')
const started=performance.now(),cubes=[]
for(let code=0;code<81;code++){
 let rest=code
 const digits=Array.from({length:4},()=>{const digit=rest%3;rest=Math.floor(rest/3);return digit})
 let mask=0
 for(let m=0;m<16;m++)if(digits.every((digit,bit)=>digit===2||digit===((m>>bit)&1)))mask|=1<<m
 cubes.push({mask,literals:digits.filter(digit=>digit!==2).length})
}
const groups=new Uint8Array(65536),literals=new Uint8Array(65536)
groups.fill(255);literals.fill(255);groups[0]=0;literals[0]=0
// Independent union DP allows overlapping cubes, as Karnaugh covers do.
for(let mask=0;mask<65536;mask++)for(const cube of cubes){
 const next=mask|cube.mask,g=groups[mask]+1,l=literals[mask]+cube.literals
 if(g<groups[next]||g===groups[next]&&l<literals[next]){groups[next]=g;literals[next]=l}
}
const cache=new Map()
function expressionMask(group,form){
 const key=form+group.literals.map(l=>l.variable+Number(l.inverted)).join('')
 if(cache.has(key))return cache.get(key)
 let mask=0
 for(let m=0;m<16;m++){
  const values=group.literals.map(l=>Boolean(m&(1<<(3-'ABCD'.indexOf(l.variable))))!==l.inverted)
  if(form==='SOP'?values.every(Boolean):values.some(Boolean))mask|=1<<m
 }
 cache.set(key,mask);return mask
}
for(let mask=0;mask<65536;mask++){
 const grid=Object.fromEntries(Array.from({length:16},(_,m)=>[m,(mask>>m)&1]))
 for(const form of ['SOP','POS']){
  const result=solveKMap(4,grid,form),target=form==='SOP'?mask:65535^mask
  const cost=[result.groups.length,result.groups.reduce((n,g)=>n+g.literals.length,0)]
  assert.deepEqual(cost,[groups[target],literals[target]],`${form}/${mask}: cover not minimal`)
  let actual=form==='SOP'?0:65535
  for(const group of result.groups){const term=expressionMask(group,form);actual=form==='SOP'?actual|term:actual&term}
  assert.equal(actual,mask,`${form}/${mask}: wrong truth table`)
 }
 if(mask&&mask%8192===0)console.log(`Checked ${mask}/65536 functions`)
}
console.log(`PASS: all 65,536 four-variable Boolean functions in SOP and POS; exact truth tables and independently optimal group/literal counts (${((performance.now()-started)/1000).toFixed(1)}s)`)
