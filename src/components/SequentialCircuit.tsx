import { useRef, useState } from 'react'
import type { CounterResult, SequentialOutput } from '../utils/sequentialSolver'
import { layoutSequentialDiagram } from '../utils/sequentialDiagram'
import { formatSubscript } from '../utils/circuitGenerator'

type DiagramResult = Pick<CounterResult,'variables'|'outputs'|'flipFlop'|'asynchronous'|'direction'|'resetState'|'resetOutput'> & {extraSignals?:string[]}
export function SequentialCircuit({result,unindexed=false}:{result:DiagramResult;unindexed?:boolean}) {
  const layout=layoutSequentialDiagram(result.variables,result.outputs,result.flipFlop,unindexed,undefined,result.extraSignals)
  const {rails,blocks,termY,collectorY,ffY,width,height,railFor}=layout
  const [fit,setFit]=useState(false)
  const svgRef=useRef<SVGSVGElement|null>(null)
  const line=(points:number[][],key?:string)=> <polyline key={key} points={points.map((p)=>p.join(',')).join(' ')} fill="none" className="signal-wire"/>
  const dot=(x:number,y:number,key?:string)=><circle key={key} cx={x} cy={y} r="3" className="wire-tap-dot"/>
  const label=(variable:string,inverted:boolean,x:number,y:number,anchor:'start'|'end'='start')=> {
    const [name,index]=variable.split('_')
    return <text x={x} y={y} textAnchor={anchor} className="seq-diagram-label"><tspan textDecoration={inverted?'overline':undefined}>{name}</tspan>{index&&<tspan fontSize="11" baselineShift="sub">{index}</tspan>}</text>
  }
  const gate=(kind:'and'|'or',x:number,y:number,pinCount=2)=> <g transform={`translate(${x},${y}) rotate(90)`}><path d={kind==='and'?'M -20 -18 H 0 A 18 18 0 0 1 0 18 H -20 Z':'M -20 -18 Q -6 0 -20 18 Q 8 18 20 0 Q 8 -18 -20 -18 Z'} className="gate-shape"/>{kind==='or'&&Array.from({length:pinCount},(_,i)=>{const offset=-14+i*28/(pinCount-1);return <line key={i} x1="-20" x2={-13-7*(offset/18)**2} y1={offset} y2={offset} className="signal-wire"/>})}</g>
  const functionDrawing=(output:SequentialOutput,center:number,span:number,targetX:number,targetY:number)=> {
    const constant=!output.groups.length?'0':output.groups.some((g)=>!g.literals.length)?'1':null
    if(constant!==null) return <g><text x={targetX-5} y={termY} className="seq-diagram-label">{constant}</text>{line([[targetX,termY+10],[targetX,targetY]])}</g>
    const count=output.groups.length
    return <g>{output.groups.map((group,index)=>{
      const x=center-span/2+(index+.5)*span/count
      const multi=group.literals.length>1
      const routeY=termY+60+index*12
      const inputX=center+(count>1?-14+index*28/(count-1):0)
      const startY=multi?termY+18:railFor(group.literals[0]).y
      return <g key={group.id}>
        {multi? <>{group.literals.map((literal,pin)=>{
          const px=x+(pin-(group.literals.length-1)/2)*12
          const ry=railFor(literal).y
          return <g key={literal.variable}>{line([[px,ry],[px,termY-20]])}{dot(px,ry)}</g>
        })}{gate('and',x,termY)}</> : dot(x,startY)}
        {count>1?line([[x,startY],[x,routeY],[inputX,routeY],[inputX,collectorY-20]]):line([[x,startY],[x,collectorY+25],[targetX,collectorY+25],[targetX,targetY]])}
      </g>
    })}{count>1&&<>{gate('or',center,collectorY,count)}{line([[center,collectorY+20],[center,collectorY+40],[targetX,collectorY+40],[targetX,targetY]])}</>}</g>
  }
  const save=()=>{
    if(!svgRef.current)return
    const svg=svgRef.current.cloneNode(true) as SVGSVGElement
    svg.setAttribute('width',String(width));svg.setAttribute('height',String(height))
    const old=[svgRef.current,...svgRef.current.querySelectorAll('*')],copies=[svg,...svg.querySelectorAll('*')]
    old.forEach((element,i)=>{const style=getComputedStyle(element);for(const property of ['fill','stroke','stroke-width','font-family','font-size','text-anchor']) (copies[i] as SVGElement).style.setProperty(property,style.getPropertyValue(property))})
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}))
    const link=document.createElement('a');link.href=url;link.download='cau-3-so-do-day-du.svg';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <div className="seq-integrated"><div className="seq-diagram-toolbar"><strong>Sơ đồ đầy đủ: thanh Q / Q̄ · cổng · flip-flop</strong><button type="button" className="toolbar-btn" onClick={()=>setFit(!fit)}>{fit?'Cỡ gốc':'Vừa chiều rộng'}</button><button type="button" className="toolbar-btn" onClick={save}>Tải SVG</button></div>
    <div className="seq-diagram-scroll" tabIndex={0} role="region" aria-label="Sơ đồ Câu 3 đầy đủ, cuộn ngang để xem tất cả FF"><svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={fit?'100%':width} height={fit?undefined:height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Các thanh Q và Q đảo ở trên, cổng đi xuống đầu vào FF, Ck và CLR phía dưới">
      <rect width={width} height={height} className="seq-diagram-background"/>
      {rails.map((rail)=><g key={`${rail.variable}-${rail.inverted}`}>{line([[140,rail.y],[width-25,rail.y]])}{label(rail.variable,rail.inverted,rail.inverted?width-30:145,rail.y-6,rail.inverted?'end':'start')}</g>)}
      {(result.extraSignals??[]).map((variable)=>{
        const y=rails.find((rail)=>rail.variable===variable&&!rail.inverted)!.y
        return <g key={variable}>{line([[140,y],[115,y],[115,y+5]])}<path d={`M 106 ${y+5} H 124 L 115 ${y+18} Z`} className="gate-shape"/><circle cx="115" cy={y+21} r="2.5" className="gate-bubble"/>{line([[115,y+23.5],[115,y+25],[140,y+25]])}</g>
      })}
      {blocks.map((block,index)=>{
        const left=block.center-90
        return <g key={block.variable}>
          {block.pins.map((pin,pinIndex)=>{
            const targetX=block.center+(pinIndex-(block.pins.length-1)/2)*80
            return <g key={pin.name}>{functionDrawing(pin.output,pin.x,pin.width,targetX,ffY)}</g>
          })}
          <rect x={left} y={ffY} width="180" height="104" className="gate-shape"/>
          {block.pins.map((pin,i)=><text key={pin.name} x={block.center+(i-(block.pins.length-1)/2)*80} y={ffY+24} textAnchor="middle" className="seq-diagram-label">{formatSubscript(pin.name)}</text>)}
          <text x={block.center} y={ffY+58} textAnchor="middle" className="seq-diagram-note">FF–{formatSubscript(block.variable)}</text>
          <path d={`M ${left} ${ffY+43} l 10 7 l -10 7`} className="signal-wire" fill="none"/>
          {result.asynchronous&&<circle cx={left-4} cy={ffY+50} r="4" className="gate-bubble"/>}
          {result.asynchronous&&index<blocks.length-1 ? <>{line([[left-22,rails[(index+1)*2+(result.direction==='down'?1:0)].y],[left-22,ffY+50],[left-8,ffY+50]])}{dot(left-22,rails[(index+1)*2+(result.direction==='down'?1:0)].y)}</> : <>{line([[left-(result.asynchronous?8:0),ffY+50],[left-25,ffY+50],[left-25,ffY+183]])}{dot(left-25,ffY+183)}</>}
          {line([[block.center-60,ffY+104],[block.center-60,ffY+132]])}
          <circle cx={block.center+60} cy={ffY+108} r="4" className="gate-bubble"/>
          {line([[block.center+60,ffY+112],[block.center+60,ffY+132]])}
          {label(block.variable,false,block.center-74,ffY+154)}{label(block.variable,true,block.center+48,ffY+154)}
          <path d={`M ${block.center-7} ${ffY+104} l 7 -8 l 7 8`} className="signal-wire" fill="none"/>
          {line([[block.center,ffY+104],[block.center,ffY+219]])}{dot(block.center,ffY+219)}

        </g>
      })}
      {line([[145,ffY+183],[width-25,ffY+183]])}<text x="95" y={ffY+179} className="seq-diagram-label">C<tspan fontSize="11" baselineShift="sub">k</tspan></text>
      {line([[145,ffY+219],[width-25,ffY+219]])}<text x="95" y={ffY+215} className="seq-diagram-label">CLR</text>
    </svg></div>

  </div>
}
