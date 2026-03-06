import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      darkMode: true,
      background: '#000000',
      primaryColor: '#7c3aed',
      primaryTextColor: '#f5f5f5',
      primaryBorderColor: '#a78bfa',
      lineColor: '#a1a1aa',
      secondaryColor: '#1a1a1a',
      tertiaryColor: '#7f1d1d',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '14px',
      nodeBorder: '#a78bfa',
      mainBkg: '#1a1a2e',
      clusterBkg: '#161616',
      titleColor: '#f5f5f5',
      edgeLabelBackground: '#161616',
      nodeTextColor: '#f5f5f5',
    },
    flowchart: { curve: 'basis', padding: 16, htmlLabels: true },
    stateDiagram: { defaultRenderer: 'dagre-wrapper' },
    securityLevel: 'loose',
  })
  mermaidInitialized = true
}

/**
 * Sanitize common LLM mistakes in Mermaid syntax:
 * - Parentheses in node labels that Mermaid interprets as shape delimiters
 * - Unquoted labels with special characters
 * - Brackets/braces in labels
 */
function sanitizeMermaidSyntax(raw) {
  let cleaned = raw.trim()

  // Remove code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:mermaid)?\n?/, '').replace(/\n?```$/, '')
  }

  // Detect diagram type from first line
  const firstLine = cleaned.split('\n')[0].trim().toLowerCase()
  const isStateDiagram = firstLine.startsWith('statediagram')
  const isMindmap = firstLine.startsWith('mindmap')

  // Skip sanitization for mindmaps (different syntax rules)
  if (isMindmap) return cleaned

  const lines = cleaned.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Skip the diagram type declaration line
    if (i === 0 && /^(flowchart|graph|stateDiagram|sequenceDiagram|classDiagram|erDiagram|gantt|pie|mindmap)/i.test(line.trim())) {
      result.push(line)
      continue
    }

    // Skip comment lines, empty lines, style/class lines
    if (/^\s*(%%|$|style |classDef |class )/.test(line)) {
      result.push(line)
      continue
    }

    if (!isStateDiagram) {
      // For flowcharts: fix node definitions with unquoted labels containing special chars
      // Match patterns like: A[some text (with parens)] or A(text with special)
      // Replace problematic labels with quoted versions
      line = fixFlowchartLabels(line)
    } else {
      // For state diagrams: fix state descriptions with special chars
      line = fixStateDiagramLabels(line)
    }

    result.push(line)
  }

  return result.join('\n')
}

/**
 * Fix flowchart node labels that contain parentheses or other special chars.
 * Converts: A[Retry payment (up to 4 attempts)]
 * To:       A["Retry payment (up to 4 attempts)"]
 */
function fixFlowchartLabels(line) {
  // Fix labels inside square brackets: ID[label with (parens)]
  line = line.replace(
    /(\w+)\[([^\]]*[()][^\]]*)\]/g,
    function (match, id, label) {
      if (/^".*"$/.test(label.trim())) return match
      return id + '["' + label.replace(/"/g, "'") + '"]'
    }
  )
  // Fix labels inside curly braces: ID{label with (parens)}
  line = line.replace(
    /(\w+)\{([^}]*[()][^}]*)\}/g,
    function (match, id, label) {
      if (/^".*"$/.test(label.trim())) return match
      return id + '{"' + label.replace(/"/g, "'") + '"}'
    }
  )
  return line
}

/**
 * Fix state diagram labels with special characters.
 */
function fixStateDiagramLabels(line) {
  // Fix state descriptions: StateName : Description (with parens)
  // Mermaid state descriptions don't use quotes but parens in descriptions can cause issues
  // Replace parens in state descriptions with square brackets
  return line.replace(
    /^(\s*\w+\s*:\s*)(.*[()].*)$/,
    (match, prefix, desc) => {
      const safe = desc.replace(/\(/g, '[').replace(/\)/g, ']')
      return prefix + safe
    }
  )
}

let idCounter = 0

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [retried, setRetried] = useState(false)
  const idRef = useRef(`mermaid-${++idCounter}`)

  useEffect(() => {
    if (!chart || !chart.trim()) return

    initMermaid()

    let cancelled = false

    async function render() {
      try {
        const sanitized = sanitizeMermaidSyntax(chart)
        // Generate a unique ID for each render to avoid Mermaid cache conflicts
        const renderId = idRef.current + '-' + Date.now()
        const { svg: rendered } = await mermaid.render(renderId, sanitized)
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err) {
        // If sanitized version fails and we haven't retried with aggressive cleanup
        if (!retried) {
          try {
            const aggressive = aggressiveSanitize(chart)
            const retryId = idRef.current + '-retry-' + Date.now()
            const { svg: rendered } = await mermaid.render(retryId, aggressive)
            if (!cancelled) {
              setSvg(rendered)
              setError(null)
              setRetried(true)
            }
            return
          } catch {
            // fall through to error
          }
        }
        if (!cancelled) {
          setError(err && err.message ? err.message : String(err))
          setSvg('')
        }
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return (
      <div style={{
        padding: '12px 16px',
        borderRadius: 8,
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        <div style={{ marginBottom: 8, color: 'rgba(239, 68, 68, 0.8)', fontWeight: 600 }}>
          Diagram render error
        </div>
        {error}
        <details style={{ marginTop: 8, color: 'rgba(255,255,255,0.4)' }}>
          <summary style={{ cursor: 'pointer' }}>Show raw diagram code</summary>
          <pre style={{ marginTop: 6, fontSize: 11, whiteSpace: 'pre-wrap' }}>{chart}</pre>
        </details>
      </div>
    )
  }

  if (!svg) return null

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflow: 'auto',
        padding: '16px 8px',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/**
 * Aggressive sanitization: quote ALL labels in flowcharts,
 * replace all parentheses with brackets in state diagrams.
 */
function aggressiveSanitize(raw) {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:mermaid)?\n?/, '').replace(/\n?```$/, '')
  }

  const lines = cleaned.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (i === 0) {
      result.push(line)
      continue
    }

    // Replace ALL parentheses inside labels with square brackets
    line = line.replace(/\(([^)]*)\)/g, (match, inner) => {
      // Don't replace if it's a node shape delimiter (single char ID before it)
      // But do replace if it looks like text content
      if (/\s/.test(inner) || inner.length > 15) {
        return '[' + inner + ']'
      }
      return match
    })

    // Quote any flowchart labels that contain special chars
    line = line.replace(
      /(\w+)\[([^\]]*)\]/g,
      function (match, id, label) {
        if (/^".*"$/.test(label.trim())) return match
        if (/[(){}|#&<>]/.test(label)) {
          return id + '["' + label.replace(/"/g, "'") + '"]'
        }
        return match
      }
    )

    result.push(line)
  }

  return result.join('\n')
}
