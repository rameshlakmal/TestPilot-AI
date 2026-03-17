import { createContext, useContext } from 'react'
import { createTheme } from '@mui/material/styles'

// ─── Shared palette tokens ───

export const purple = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a78bfa',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
}

export const green = {
  500: '#22c55e',
  600: '#16a34a',
}

// ─── Theme mode context ───

export const ColorModeContext = createContext({
  mode: 'dark',
  toggleColorMode: () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

// ─── Persistence ───

const THEME_STORAGE_KEY = 'testpilot-theme-mode'

export function loadThemeMode() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

export function saveThemeMode(mode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {}
}

// ─── Shared typography ───

const typography = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  fontFamilyMonospace: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 13.5,
  h5: { fontSize: '1.35rem', fontWeight: 600 },
  h6: { fontSize: '1.05rem', fontWeight: 600 },
  subtitle1: { fontSize: '0.95rem' },
  body2: { fontSize: '0.88rem' },
  caption: { fontSize: '0.72rem' },
}

// ─── Shared component overrides ───

function sharedComponents(mode) {
  const isDark = mode === 'dark'

  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'
  const hoverBorder = isDark ? `rgba(167, 139, 250, 0.45)` : `rgba(124, 58, 237, 0.35)`
  const focusRing = isDark ? 'rgba(167, 139, 250, 0.16)' : 'rgba(124, 58, 237, 0.12)'
  const focusBorder = isDark ? 'rgba(167, 139, 250, 0.70)' : 'rgba(124, 58, 237, 0.60)'
  const inputBg = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)'
  const labelColor = isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)'
  const labelFocus = isDark ? purple[500] : purple[600]
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)'
  const cardShadow = isDark
    ? '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 4px 24px rgba(124,58,237,0.07), inset 0 1px 0 rgba(255,255,255,1)'
  const stepLabelInactive = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)'
  const stepLabelActive = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.87)'
  const stepLabelCompleted = isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)'
  const selectMenuBg = isDark ? 'rgba(15,15,15,0.82)' : 'rgba(255,255,255,0.82)'
  const selectMenuBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
  const selectMenuShadow = isDark
    ? '0 0 0 1px rgba(167, 139, 250, 0.10), 0 24px 70px rgba(0,0,0,0.55)'
    : '0 0 0 1px rgba(124, 58, 237, 0.06), 0 12px 40px rgba(0,0,0,0.10)'

  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: labelColor,
          '&.Mui-focused': { color: labelFocus },
          '&.Mui-disabled': { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: labelColor,
          '&.Mui-focused': { color: isDark ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.75)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${cardBorder}`,
          backgroundImage: 'none',
          backgroundColor: cardBg,
          borderRadius: 20,
          boxShadow: cardShadow,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: inputBg,
          borderRadius: 14,
          transition: 'box-shadow 160ms ease, border-color 160ms ease',
          '& .MuiOutlinedInput-notchedOutline': { borderColor },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: hoverBorder },
          '&.Mui-focused': { boxShadow: `0 0 0 4px ${focusRing}` },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: focusBorder },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          disableScrollLock: true,
          PaperProps: {
            sx: {
              mt: 1,
              borderRadius: '10px',
              border: `1px solid ${selectMenuBorder}`,
              backgroundColor: selectMenuBg,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: selectMenuShadow,
            },
          },
        },
      },
    },
    MuiPopover: {
      defaultProps: { disableScrollLock: true },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 99,
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 99,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '16px !important',
          '&:before': { display: 'none' },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: stepLabelInactive,
          transition: 'all 0.3s ease',
          '&.Mui-active': { color: stepLabelActive, fontWeight: 700 },
          '&.Mui-completed': { color: stepLabelCompleted },
        },
      },
    },
  }
}

// ─── Theme builders ───

export function buildTheme(mode) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? purple[500] : purple[600] },
      secondary: { main: isDark ? purple[300] : purple[500] },
      background: {
        default: isDark ? '#0a0a0a' : '#faf8ff',
        paper: isDark ? '#111111' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      success: { main: isDark ? green[500] : green[600] },
    },
    shape: { borderRadius: 14 },
    typography,
    components: sharedComponents(mode),
  })
}

// ─── Legacy exports for gradual migration (child components still import these) ───

export const purpleMain = purple[500]
export const purpleDeep = purple[600]
export const accentLime = '#a3e635'
export const primaryBlack = '#000000'
export const bgBase = '#0a0a0a'
export const paperBase = '#111111'

// ─── Model options & diagram info (unchanged) ───

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
