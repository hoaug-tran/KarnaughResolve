import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)?s+'.ts':s,c)}})
const {parseExpression,parseNumberList,solveKMap}=await import('../src/utils/kmapSolver.ts')
for(const [expression,predicate] of [["A'B + BC'D",(a,b,c,d)=>(!a&&b)||(b&&!c&&d)],['(A+B)(C+D)',(a,b,c,d)=>(a||b)&&(c||d)],['0',()=>false],['1',()=>true],["~(A+B)'",(a,b)=>a||b],['A·B + !C*D',(a,b,c,d)=>(a&&b)||(!c&&d)]]){
 const expected=Array.from({length:16},(_,m)=>m).filter(m=>predicate(...[3,2,1,0].map(bit=>(m>>bit)&1)))
 assert.deepEqual(parseExpression(expression,4).minterms,expected,expression)
}
for(const bad of ['A+','()','(A','A)','ABOGUS','2','A**B','A'.repeat(257)])assert.throws(()=>parseExpression(bad,4))
assert.throws(()=>parseExpression('D',3))
assert.deepEqual(parseExpression('',4).minterms,[])
console.log('PASS: Boolean input preserves SOP/POS semantics, constants, inversion and grouping; invalid/bounded inputs rejected')

assert.deepEqual(parseExpression('!(A & B) + C',3).minterms,[0,1,2,3,4,5,7])
assert.deepEqual(parseNumberList('3, 1; 3 0',3),[0,1,3])
for(const text of ['-1','1.5','A1','16','0 '.repeat(129)])assert.throws(()=>parseNumberList(text))
assert.throws(()=>parseNumberList('4',3))
assert.throws(()=>solveKMap(4,{0:1},'SOP'))
console.log('PASS: minterm bounds and malformed lists rejected; README AND syntax supported')
