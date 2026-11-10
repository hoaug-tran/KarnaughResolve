import React, { useRef, useState } from 'react'
import type { CircuitDiagram, CircuitNode } from '../types'
import { Download, Image, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface CircuitViewerProps {
  diagram: CircuitDiagram
  title: string
  subtitle?: string
}

function formatSubscript(str: string): string {
  return str
    .replace(/_0/g, '₀')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃')
    .replace(/_4/g, '₄')
    .replace(/_5/g, '₅')
    .replace(/_6/g, '₆')
    .replace(/_7/g, '₇')
    .replace(/_8/g, '₈')
    .replace(/_9/g, '₉')
}

export const CircuitViewer: React.FC<CircuitViewerProps> = ({ diagram, title, subtitle }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleMouseDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    const ratio=svgRef.current?.getScreenCTM()?.a ?? 1
    setDragStart({ x:e.clientX-pan.x*ratio, y:e.clientY-pan.y*ratio })
  }

  const handleMouseMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const ratio=svgRef.current?.getScreenCTM()?.a ?? 1
    setPan({ x:(e.clientX-dragStart.x)/ratio, y:(e.clientY-dragStart.y)/ratio })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.15))
  const handleZoomOut = () => setScale((s) => Math.max(0.4, s - 0.15))
  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  const serializeSvg = () => {
    const original=svgRef.current!
    const copy=original.cloneNode(true) as SVGSVGElement
    copy.setAttribute('width',String(diagram.width))
    copy.setAttribute('height',String(diagram.height))
    const source=[original,...original.querySelectorAll('*')],target=[copy,...copy.querySelectorAll('*')]
    source.forEach((element,index)=>{
      const style=getComputedStyle(element)
      for(const property of ['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','font-family','font-size','font-weight','text-anchor']) (target[index] as SVGElement).style.setProperty(property,style.getPropertyValue(property))
    })
    return new XMLSerializer().serializeToString(copy)
  }

  const handleExportSvg = () => {
    if (!svgRef.current) return
    setExportError(null)
    const svgData = serializeSvg()
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_circuit.svg`
    document.body.appendChild(link); link.click(); link.remove()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }

  const handleExportPng = () => {
    if (!svgRef.current) return
    setExportError(null)
    const svgData = serializeSvg()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()

    canvas.width = diagram.width * 2
    canvas.height = diagram.height * 2

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onerror = () => { URL.revokeObjectURL(url); setExportError('Không thể tạo PNG từ sơ đồ. Hãy tải SVG hoặc thử lại.') }
    img.onload = () => {
      try {
        if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas.')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob)=>{
          if (!blob) { setExportError('Không thể mã hóa PNG. Hãy tải SVG hoặc thử lại.'); return }
          const pngUrl=URL.createObjectURL(blob)
          const link=document.createElement('a')
          link.href=pngUrl
          link.download=`${title.toLowerCase().replace(/\s+/g, '_')}_circuit.png`
          document.body.appendChild(link); link.click(); link.remove()
          setTimeout(()=>URL.revokeObjectURL(pngUrl),1000)
        },'image/png')
      } catch(error) { setExportError((error as Error).message) }
      finally { URL.revokeObjectURL(url) }
    }
    img.src = url
  }

  const renderGateLabel = (label: string) => {
    const formatted = formatSubscript(label)
    const chars = Array.from(formatted)
    const elements: { char: string; inverted: boolean }[] = []
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      if (c === '\u0304') {
        if (elements.length > 0) {
          elements[elements.length - 1].inverted = true
        }
      } else {
        elements.push({ char: c, inverted: false })
      }
    }

    const charWidth = 8.5
    const totalWidth = elements.length * charWidth
    const startX = -totalWidth / 2

    return (
      <g className="gate-label-group">
        {elements.map((el, i) => {
          const cx = startX + i * charWidth + charWidth / 2
          return (
            <g key={i}>
              <text x={cx} y="-28" className="gate-label-text">
                {el.char}
              </text>
              {el.inverted && (
                <line
                  x1={cx - 4}
                  y1="-40"
                  x2={cx + 4}
                  y2="-40"
                  className="overline-bar"
                />
              )}
            </g>
          )
        })}
      </g>
    )
  }

  const renderGatePins = (node: CircuitNode) => {
    const rounded = node.type === 'or' || node.type === 'nor'
    const inverted = node.type === 'nand' || node.type === 'nor'
    const inputWires = diagram.wires.filter((wire)=>wire.toNodeId===node.id)
    return <g>
      {inputWires.map((wire,index)=>{
        const end=wire.points.at(-1)!
        const y=end.y-node.y
        const edge=rounded?-13-7*(y/18)**2:-20
        return <line key={index} x1={end.x-node.x} x2={edge} y1={y} y2={y} className="signal-wire"/>
      })}
      <line x1={rounded?20:18} x2={inverted?19.5:28} y1="0" y2="0" className="signal-wire"/>
      {inverted&&<line x1="26.5" x2="28" y1="0" y2="0" className="signal-wire"/>}
    </g>
  }

  const renderGateSymbol = (node: CircuitNode) => {
    if (node.id.startsWith('lbl-not-') || node.id.startsWith('in-not-')) {
      const char = node.label?.replace(/̄/g, '').replace(/\u0304/g, '') || ''
      return (
        <g transform={`translate(${node.x}, ${node.y})`}>
          <rect x="-14" y="-16" width="28" height="28" rx="6" className="not-label-badge-bg" />
          <text x="0" y="6" className="not-label-badge-text">
            {char}
          </text>
          <line x1="-7" y1="-9.5" x2="7" y2="-9.5" className="overline-bar" />
        </g>
      )
    }

    if (node.id.startsWith('not-') || node.id.startsWith('tied-not-')) {
      return (
        <g transform={`translate(${node.x}, ${node.y})`}>
          <path d="M -11 -12 L 11 -12 L 0 6 Z" className="gate-shape" />
          <circle cx="0" cy="11" r="3.5" className="gate-bubble" />
        </g>
      )
    }

    switch (node.type) {
      case 'and':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <path
              d="M -20 -18 H 0 A 18 18 0 0 1 0 18 H -20 Z"
              className="gate-shape"
            />
            {renderGatePins(node)}
            {node.label && renderGateLabel(node.label)}
          </g>
        )
      case 'or':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <path
              d="M -20 -18 Q -6 0 -20 18 Q 8 18 20 0 Q 8 -18 -20 -18 Z"
              className="gate-shape"
            />
            {renderGatePins(node)}
            {node.label && renderGateLabel(node.label)}
          </g>
        )
      case 'nand':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <path
              d="M -20 -18 H 0 A 18 18 0 0 1 0 18 H -20 Z"
              className="gate-shape"
            />
            <circle cx="23" cy="0" r="3.5" className="gate-bubble" />
            {renderGatePins(node)}
            {node.label && renderGateLabel(node.label)}
          </g>
        )
      case 'nor':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <path
              d="M -20 -18 Q -6 0 -20 18 Q 8 18 20 0 Q 8 -18 -20 -18 Z"
              className="gate-shape"
            />
            <circle cx="23" cy="0" r="3.5" className="gate-bubble" />
            {renderGatePins(node)}
            {node.label && renderGateLabel(node.label)}
          </g>
        )
      case 'input':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <circle cx="0" cy="0" r="13" className="input-pin-bg" />
            <text x="0" y="4" className="input-pin-text">
              {node.label}
            </text>
          </g>
        )
      case 'output':
        return (
          <g transform={`translate(${node.x}, ${node.y})`}>
            <circle cx="0" cy="0" r="15" className="output-pin-bg" />
            <text x="0" y="5" className="output-pin-text">
              {node.label ? formatSubscript(node.label) : ''}
            </text>
          </g>
        )
      default:
        return null
    }
  }

  return (
    <div className="circuit-viewer-wrapper">
      <div className="circuit-viewer-toolbar">
        <div>
          <h3 className="circuit-title">{title}</h3>
          {subtitle && <p className="circuit-subtitle">{subtitle}</p>}
        </div>

        <div className="circuit-actions">
          <button type="button" className="toolbar-btn" onClick={handleZoomIn} title="Phóng to">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="toolbar-btn" onClick={handleZoomOut} title="Thu nhỏ">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="toolbar-btn" onClick={handleReset} title="Khôi phục góc nhìn">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="toolbar-divider" />
          <button type="button" className="toolbar-btn primary-action" onClick={handleExportSvg} title="Tải xuống tệp SVG">
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
          <button type="button" className="toolbar-btn primary-action" onClick={handleExportPng} title="Tải xuống ảnh PNG">
            <Image className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {exportError && <p role="alert" className="validation-alert error">{exportError}</p>}

      <div
        className="circuit-canvas-area"
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onPointerCancel={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction:scale>1?'none':'pan-y' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          className="circuit-svg"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {Object.entries(diagram.railXMap).map(([key, rx]) => (
              <line
                key={key}
                x1={rx}
                y1={key.startsWith('~') ? (diagram.nodes.find((node)=>node.id===`lbl-not-${key.slice(1)}`)?.y ?? 114)+12 : 42}
                x2={rx}
                y2={diagram.height - 25}
                className={key.startsWith('~') ? 'bus-wire bus-inverted' : 'bus-wire bus-direct'}
              />
            ))}

            {diagram.wires.map((wire, idx) => {
              if (wire.points.length < 2) return null
              const d = wire.points
                .map((pt, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                .join(' ')
              return (
                <path
                  key={idx}
                  d={d}
                  className="signal-wire"
                  fill="none"
                />
              )
            })}

            {diagram.taps.map((tap, idx) => (
              <circle
                key={idx}
                cx={tap.x}
                cy={tap.y}
                r="3"
                className="wire-tap-dot"
              />
            ))}

            {diagram.nodes.map((node) => (
              <React.Fragment key={node.id}>
                {renderGateSymbol(node)}
              </React.Fragment>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
