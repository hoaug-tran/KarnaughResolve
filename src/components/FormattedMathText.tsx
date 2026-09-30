import React from 'react'
import { KaTeXView } from './KaTeXView'

interface FormattedMathTextProps {
  text: string
  className?: string
}

export const FormattedMathText: React.FC<FormattedMathTextProps> = ({ text, className = '' }) => {
  if (!text) return null

  const parts = text.split(/(\$[^$]+\$)/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1)
          return <KaTeXView key={index} math={math} />
        }

        const subParts = part.split(/(U_\d+|T_\d+|M_\d+|V_\d+|S_\{\d+\}|S_\d+|P_\{\d+\}|P_\d+|\\overline\{[^{}]+\})/g)
        if (subParts.length > 1) {
          return (
            <React.Fragment key={index}>
              {subParts.map((sub, sIdx) => {
                if (/^(U_\d+|T_\d+|M_\d+|V_\d+|S_\{\d+\}|S_\d+|P_\{\d+\}|P_\d+|\\overline\{[^{}]+\})$/.test(sub)) {
                  return <KaTeXView key={sIdx} math={sub} />
                }
                return <span key={sIdx}>{sub}</span>
              })}
            </React.Fragment>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
