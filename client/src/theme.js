// Neon Minimal theme constants
export const purpleMain = '#a78bfa'
export const purpleDeep = '#7c3aed'
export const accentLime = '#a3e635'
export const primaryBlack = '#000000'
export const bgBase = '#000000'
export const paperBase = '#0a0a0a'

export const modelOptions = {
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1 (Best)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o3-mini', label: 'o3-mini' },
    { value: 'o4-mini', label: 'o4-mini' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5 (Best)' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash (Best)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
}

export const defaultModel = (p) => (modelOptions[p] || [])[0]?.value || ''

export const diagramInfo = {
  'state-transition': { label: 'State Machine Diagram', type: 'stateDiagram-v2' },
  'decision-tables': { label: 'Decision Flow Diagram', type: 'flowchart TD' },
  'equivalence-partitioning': { label: 'Partition Range Diagram', type: 'flowchart LR' },
  'boundary-value-analysis': { label: 'Boundary Value Diagram', type: 'flowchart LR' },
  'pairwise-combinatorial': { label: 'Combination Matrix Diagram', type: 'flowchart TD' },
  'feature-decomposition': { label: 'Decomposition Mind Map', type: 'mindmap' },
  'functional-core': { label: 'Functional Flow Diagram', type: 'flowchart TD' },
  'error-guessing-heuristics': { label: 'Error Scenario Diagram', type: 'flowchart TD' },
  'risk-based-prioritization': { label: 'Risk Matrix Diagram', type: 'flowchart TD' },
  'requirements-to-tests-traceability': { label: 'Traceability Map', type: 'flowchart LR' },
  'non-functional-baseline': { label: 'NFR Coverage Diagram', type: 'flowchart TD' },
  'general-fallback': { label: 'General Test Flow', type: 'flowchart TD' },
}
