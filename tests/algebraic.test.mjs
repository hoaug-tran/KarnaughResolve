import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import katex from 'katex'
registerHooks({resolve(specifier,context,next){return next(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier)?specifier+'.ts':specifier,context)}})
const {generateTransformations}=await import('../src/utils/algebraicTransformer.ts')

function parse(latex) {
 const tokens=latex.slice(latex.indexOf('=')+1).match(/\\overline|\\cdot|[A-D01+{}()]/g)
 let i=0
 function atom(){
  const token=tokens[i++]
  if(token==='\\overline'){assert.equal(tokens[i++],'{');const value=expression();assert.equal(tokens[i++],'}');return {op:'not',args:[value]}}
  if(token==='('){const value=expression();assert.equal(tokens[i++],')');return value}
  assert.match(token,/^[A-D01]$/)
  return {value:token}
 }
 function product(){const args=[atom()];while(tokens[i]==='\\cdot'){i++;args.push(atom())}return args.length===1?args[0]:{op:'and',args}}
 function expression(){const args=[product()];while(tokens[i]==='+'){i++;args.push(product())}return args.length===1?args[0]:{op:'or',args}}
 const result=expression();assert.equal(i,tokens.length);return result
}
function evaluate(node,state){
 if(node.value)return node.value==='1'||node.value!=='0'&&Boolean(state&(1<<(3-'ABCD'.indexOf(node.value))))
 const args=node.args.map((arg)=>evaluate(arg,state))
 return node.op==='not'?!args[0]:node.op==='and'?args.every(Boolean):args.some(Boolean)
}
function checkGates(node,target,parent){
 if(!node.op)return
 if(node.op!=='not'){
  assert.equal(node.op,target.startsWith('nand')?'and':'or')
  assert.equal(parent,'not','A bare AND/OR remains in final gate expression')
  if(target.endsWith('_2'))assert.equal(node.args.length,2,'Gate exceeds two inputs')
 }
 node.args.forEach((arg)=>checkGates(arg,target,node.op))
}
const group=(literals)=>({literals:literals.map(([variable,inverted])=>({variable,inverted})),cells:[]})
const fixtures=[
 // Exam 15 POS: (C′+D′)(B′+D′)(B+C+D).
 [group([['C',true],['D',true]]),group([['B',true],['D',true]]),group([['B',false],['C',false],['D',false]])],
 // Exam 17 SOP: BD + AB + A′B′C.
 [group([['B',false],['D',false]]),group([['A',false],['B',false]]),group([['A',true],['B',true],['C',false]])],
 [],[group([])]
]
for(let size=1;size<=8;size++)for(let width=1;width<=4;width++)fixtures.push(Array.from({length:size},(_,term)=>group(Array.from({length:width},(_,bit)=>['ABCD'[bit],Boolean((term>>bit)&1)]))))
let checked=0
for(const groups of fixtures)for(const form of ['SOP','POS'])for(const target of ['nand_2','nor_2','nand_n','nor_n']){
 const steps=generateTransformations(groups,form,target)
 for(const step of steps){
  katex.renderToString(step.latex,{throwOnError:true})
  const tree=parse(step.latex)
  for(let state=0;state<16;state++){
   const terms=groups.map((g)=>g.literals.map((literal)=>Boolean(state&(1<<(3-'ABCD'.indexOf(literal.variable))))!==literal.inverted))
   const expected=form==='SOP'?terms.some((term)=>term.every(Boolean)):terms.every((term)=>term.some(Boolean))
   assert.equal(evaluate(tree,state),expected,`${form}/${target} state ${state}: ${step.latex}`)
  }
 }
 checkGates(parse(steps.at(-1).latex),target)
 checked++
}
for(const [form,target] of [['POS','nand_2'],['SOP','nor_2']]){
 const steps=generateTransformations(fixtures[form==='POS'?0:1],form,target)
 assert.match(steps[1].title,/từng thành phần/)
 assert.ok(!steps[2].latex.includes(target==='nand_2'?'+':'\\cdot'))
}
console.log(`PASS: ${checked} SOP/POS to NAND/NOR proofs; every step equivalent on all 16 states; final gate type and fan-in checked; KaTeX valid`)
