import React, { useMemo } from 'react'
import katex from 'katex'

interface KaTeXViewProps {
  math: string
  block?: boolean
  className?: string
}

export const KaTeXView: React.FC<KaTeXViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false
      })
    } catch {
      return math
    }
  }, [math, block])

  return (
    <span
      className={`katex-render ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
