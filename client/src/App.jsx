import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material'
import Fade from '@mui/material/Fade'
import Slide from '@mui/material/Slide'
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'
import { ThemeProvider, createTheme, styled } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'
import LinearProgress from '@mui/material/LinearProgress'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CloseIcon from '@mui/icons-material/Close'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import IconButton from '@mui/material/IconButton'
import MermaidDiagram from './MermaidDiagram'

const AnimatedConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
    overflow: 'hidden',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    backgroundImage: 'none',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    backgroundImage: 'none',
    backgroundColor: '#22c55e',
  },
  // The fill animation via a pseudo-element
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}::after`]: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
    borderRadius: 2,
    animation: 'connectorFill 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}::after`]: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    background: '#22c55e',
    borderRadius: 2,
  },
  '@keyframes connectorFill': {
    '0%': { width: '0%' },
    '100%': { width: '100%' },
  },
}))

function AnimatedStepIcon(props) {
  const { active, completed, icon } = props
  const bgColor = completed
    ? '#22c55e'
    : active
      ? '#a855f7'
      : 'rgba(255,255,255,0.10)'
  const textColor = completed || active ? '#fff' : 'rgba(255,255,255,0.50)'

  return (
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        color: textColor,
        fontWeight: 700,
        fontSize: '0.88rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: active ? 'scale(1.15)' : 'scale(1)',
        boxShadow: active
          ? '0 0 0 6px rgba(168, 85, 247, 0.18), 0 0 20px rgba(168, 85, 247, 0.25)'
          : completed
            ? '0 0 0 4px rgba(34, 197, 94, 0.15)'
            : 'none',
      }}
    >
      {completed ? '✓' : icon}
    </Box>
  )
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toCsv(suite) {
  const rows = []
  rows.push([
    'Test Id',
    'Summary',
    'Priority',
    'TestSteps',
    'ExpectedResults',
    'Story',
    'Test Type',
    'Component',
    'Release',
    'Status',
    'Creator'
  ])

  const priorityMap = {
    P0: 'Highest',
    P1: 'High',
    P2: 'Med',
    P3: 'Low'
  }

  const cases = suite && Array.isArray(suite.testCases) ? suite.testCases : []
  for (const tc of cases) {
    const steps = Array.isArray(tc.steps) ? tc.steps.map(String).join('\n') : ''
    const expected = Array.isArray(tc.expected) ? tc.expected.map(String).join('\n') : ''
    const story = Array.isArray(tc.requirementRefs) ? tc.requirementRefs.map(String).join('; ') : ''
    const pri = priorityMap[String(tc.priority)] || String(tc.priority || '')

    rows.push([
      tc.id,
      tc.title,
      pri,
      steps,
      expected,
      story,
      'Manual',
      '',
      '',
      '',
      ''
    ])
  }

  const esc = (v) => {
    const s = String(v ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

function joinLines(arr) {
  const a = Array.isArray(arr) ? arr : []
  return a.map((x, i) => `${i + 1}. ${String(x)}`).join('\n')
}

function listOrNone(arr) {
  const a = Array.isArray(arr) ? arr : []
  return a.length ? a : ['(none)']
}

function BulletList({ items, renderItem, sx }) {
  const list = Array.isArray(items) ? items : []
  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        pl: 2.5,
        pr: 0.5,
        width: '100%',
        color: 'rgba(255,255,255,0.72)',
        '& li': {
          marginBlock: '6px'
        },
        ...sx
      }}
    >
      {list.map((it, idx) => (
        <Box component="li" key={(it && it.id ? String(it.id) : String(it)) + ':' + idx}>
          {renderItem ? renderItem(it) : <Typography variant="body2">{String(it)}</Typography>}
        </Box>
      ))}
    </Box>
  )
}

function OrderedList({ items, sx }) {
  const list = Array.isArray(items) ? items : []
  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        pl: 2.75,
        color: 'rgba(255,255,255,0.72)',
        '& li': {
          marginBlock: '6px'
        },
        ...sx
      }}
    >
      {(list.length ? list : ['(none)']).map((it, idx) => (
        <Box component="li" key={String(it) + ':' + idx}>
          <Typography variant="body2">{String(it)}</Typography>
        </Box>
      ))}
    </Box>
  )
}

const STEPS = ['Requirements', 'Analyze', 'Results']

export default function App() {
  const appLogo = '📝'
  const purpleMain = '#a855f7'
  const purpleDeep = '#7c3aed'
  const primaryBlack = '#000000'
  const bgBase = '#0b0b0b'
  const paperBase = '#101010'

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: { main: primaryBlack },
          secondary: { main: purpleMain },
          background: {
            default: bgBase,
            paper: paperBase
          }
        },
        shape: { borderRadius: 10 },
        typography: {
          fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
          fontFamilyMonospace: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          fontSize: 13.5,
          h5: { fontSize: '1.35rem' },
          h6: { fontSize: '1.05rem' },
          subtitle1: { fontSize: '0.95rem' },
          body2: { fontSize: '0.88rem' },
          caption: { fontSize: '0.72rem' }
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              '*': { boxSizing: 'border-box' }
            }
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none'
              }
            }
          },
          MuiFormLabel: {
            styleOverrides: {
              root: {
                color: 'rgba(255,255,255,0.70)',
                '&.Mui-focused': {
                  color: purpleMain
                },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.35)'
                }
              }
            }
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: 'rgba(255,255,255,0.70)',
                '&.Mui-focused': {
                  color: 'rgba(255,255,255,0.86)'
                }
              }
            }
          },
          MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
              root: {
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))',
                backgroundColor: 'rgba(16,16,16,0.66)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 22px 70px rgba(0,0,0,0.55)'
              }
            }
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 12,
                transition: 'box-shadow 160ms ease, border-color 160ms ease',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.14)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(168, 85, 247, 0.45)'
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.16)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(168, 85, 247, 0.70)'
                }
              }
            }
          },
          MuiSelect: {
            defaultProps: {
              MenuProps: {
                disableScrollLock: true,
                PaperProps: {
                  sx: {
                    mt: 1,
                    border: '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(11,11,11,0.98)',
                    boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.10), 0 24px 70px rgba(0,0,0,0.55)'
                  }
                }
              }
            }
          },
          MuiPopover: {
            defaultProps: {
              disableScrollLock: true
            }
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none'
              }
            }
          },
          MuiStepLabel: {
            styleOverrides: {
              label: {
                color: 'rgba(255,255,255,0.50)',
                transition: 'all 0.3s ease',
                '&.Mui-active': {
                  color: 'rgba(255,255,255,0.92)',
                  fontWeight: 700
                },
                '&.Mui-completed': {
                  color: 'rgba(255,255,255,0.70)'
                }
              }
            }
          }
        }
      }),
    []
  )

  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))

  // Wizard step
  const [activeStep, setActiveStep] = useState(0)
  const [slideDirection, setSlideDirection] = useState('left')
  const [slideIn, setSlideIn] = useState(true)
  const stepContainerRef = useRef(null)

  function goToStep(next) {
    if (next === activeStep) return
    const dir = next > activeStep ? 'left' : 'right'
    setSlideIn(false)
    setSlideDirection(dir)
    setTimeout(() => {
      setActiveStep(next)
      setSlideDirection(dir === 'left' ? 'right' : 'left')
      setTimeout(() => {
        setSlideDirection(dir)
        setSlideIn(true)
      }, 30)
    }, 250)
  }

  const [provider, setProvider] = useState('openai')
  const depth = 'deep'
  const [model, setModel] = useState('gpt-4.1')

  const modelOptions = {
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
  const defaultModel = (p) => (modelOptions[p] || [])[0]?.value || ''
  const [requirementText, setRequirementText] = useState('')
  const [requirementFile, setRequirementFile] = useState(null)

  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [statusSeverity, setStatusSeverity] = useState('info')

  const [preflight, setPreflight] = useState(null)
  const [preflightSkills, setPreflightSkills] = useState([])
  const [answersByQuestion, setAnswersByQuestion] = useState({})

  const [suiteMeta, setSuiteMeta] = useState(null)
  const [suite, setSuite] = useState(null)
  const [selectedSkills, setSelectedSkills] = useState([])

  const [analysis, setAnalysis] = useState(null)
  const [analysisMeta, setAnalysisMeta] = useState(null)
  const [selectedTechniques, setSelectedTechniques] = useState({})
  const [selectedDiagrams, setSelectedDiagrams] = useState({})
  const [duplicateGroups, setDuplicateGroups] = useState([])
  const [skillDiagrams, setSkillDiagrams] = useState([])
  const [diagramDialogOpen, setDiagramDialogOpen] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState(null)

  const diagramInfo = {
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

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const [aioProject, setAioProject] = useState('')
  const [aioFolder, setAioFolder] = useState('')
  const [aioToken, setAioToken] = useState('')
  const [aioIncludeTags, setAioIncludeTags] = useState(false)
  const [aioBusy, setAioBusy] = useState(false)
  const [aioResult, setAioResult] = useState('')

  const hasAnyRequirements = Boolean(requirementFile) || requirementText.trim().length > 0

  const preflightAbortRef = useRef(null)
  const analyzeAbortRef = useRef(null)
  const generateAbortRef = useRef(null)
  const aioAbortRef = useRef(null)

  function cancelInFlight() {
    try {
      preflightAbortRef.current && preflightAbortRef.current.abort()
    } catch {
      // ignore
    }
    try {
      analyzeAbortRef.current && analyzeAbortRef.current.abort()
    } catch {
      // ignore
    }
    try {
      generateAbortRef.current && generateAbortRef.current.abort()
    } catch {
      // ignore
    }
    try {
      aioAbortRef.current && aioAbortRef.current.abort()
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const key = 'ai-test-generator:v1'
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const saved = JSON.parse(raw)

      if (saved && typeof saved.provider === 'string') setProvider(saved.provider)
      const p = (saved && saved.provider) || 'openai'
      const validModels = (modelOptions[p] || []).map((m) => m.value)
      if (saved && typeof saved.model === 'string' && validModels.includes(saved.model)) {
        setModel(saved.model)
      } else {
        setModel(validModels[0] || '')
      }
      if (saved && typeof saved.requirementText === 'string') setRequirementText(saved.requirementText)
      if (saved && saved.answersByQuestion && typeof saved.answersByQuestion === 'object') setAnswersByQuestion(saved.answersByQuestion)

      if (saved && typeof saved.aioProject === 'string') setAioProject(saved.aioProject)
      if (saved && typeof saved.aioFolder === 'string') setAioFolder(saved.aioFolder)
      if (saved && typeof saved.aioIncludeTags === 'boolean') setAioIncludeTags(saved.aioIncludeTags)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const key = 'ai-test-generator:v1'
    const payload = {
      provider,
      model,
      requirementText,
      answersByQuestion,
      aioProject,
      aioFolder,
      aioIncludeTags
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [provider, model, requirementText, answersByQuestion, aioProject, aioFolder, aioIncludeTags])

  useEffect(() => {
    return () => cancelInFlight()
  }, [])

  function setInfo(msg) {
    setStatus(String(msg || ''))
    setStatusSeverity('info')
  }
  function setError(msg) {
    setStatus(String(msg || ''))
    setStatusSeverity('error')
  }
  function setSuccess(msg) {
    setStatus(String(msg || ''))
    setStatusSeverity('success')
  }

  function acceptDroppedFile(file) {
    if (!file) return
    setRequirementFile(file)
    setSuccess(`Selected: ${file.name}`)
  }

  function buildClarifications() {
    const qs = preflight && Array.isArray(preflight.missingInfoQuestions) ? preflight.missingInfoQuestions : []
    const lines = []
    for (const q of qs) {
      const key = String(q)
      const a = String(answersByQuestion[key] || '').trim()
      if (!key || !a) continue
      lines.push(`Q: ${key}`)
      lines.push(`A: ${a}`)
      lines.push('')
    }
    return lines.join('\n').trim()
  }

  async function callPreflight() {
    if (!hasAnyRequirements) {
      setError('Add requirements first (file or text).')
      return
    }

    setBusy(true)
    setInfo('Analyzing requirements and preparing questions...')
    setPreflight(null)
    setPreflightSkills([])
    setAnswersByQuestion({})
    setSuite(null)
    setSelectedSkills([])
    setSuiteMeta(null)
    setAioResult('')

    try {
      try {
        preflightAbortRef.current && preflightAbortRef.current.abort()
      } catch {
        // ignore
      }
      const controller = new AbortController()
      preflightAbortRef.current = controller

      const fd = new FormData()
      fd.set('provider', provider)
      fd.set('model', model)
      fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)

      const res = await fetch('/api/preflight', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)

      setPreflight(data.preflight || null)
      setPreflightSkills(Array.isArray(data.selectedSkills) ? data.selectedSkills : [])
      const count = data.preflight && Array.isArray(data.preflight.missingInfoQuestions) ? data.preflight.missingInfoQuestions.length : 0
      setSuccess(`Preflight done. ${count} question(s) to answer.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) {
        setInfo('Cancelled.')
      } else {
        setError(err && err.message ? err.message : String(err))
      }
    } finally {
      preflightAbortRef.current = null
      setBusy(false)
    }
  }

  async function callAnalyze() {
    if (!hasAnyRequirements) {
      setError('Add requirements first (file or text).')
      return
    }

    setBusy(true)
    setInfo('Analyzing requirement to recommend test techniques...')
    setAnalysis(null)
    setAnalysisMeta(null)
    setSelectedTechniques({})
    setSuite(null)
    setSuiteMeta(null)
    setSelectedSkills([])
    setDuplicateGroups([])
    setAioResult('')

    try {
      try {
        analyzeAbortRef.current && analyzeAbortRef.current.abort()
      } catch {
        // ignore
      }
      const controller = new AbortController()
      analyzeAbortRef.current = controller

      const fd = new FormData()
      fd.set('provider', provider)
      fd.set('model', model)
      fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)

      const analysisResult = data.analysis || {}
      setAnalysis(analysisResult)
      setAnalysisMeta({ provider: data.provider, model: data.model, repaired: Boolean(data.repaired) })

      const recs = Array.isArray(analysisResult.techniqueRecommendations) ? analysisResult.techniqueRecommendations : []
      const initialSelection = {}
      for (const r of recs) {
        initialSelection[r.skillId] = r.confidence === 'high' || r.confidence === 'medium'
      }
      setSelectedTechniques(initialSelection)

      const count = recs.length
      setSuccess(`Analysis done. ${count} technique(s) recommended. Review and generate.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) {
        setInfo('Cancelled.')
      } else {
        setError(err && err.message ? err.message : String(err))
      }
    } finally {
      analyzeAbortRef.current = null
      setBusy(false)
    }
  }

  async function callGenerateFromAnalysis() {
    const skillIds = Object.entries(selectedTechniques)
      .filter(([, v]) => v)
      .map(([k]) => k)

    if (skillIds.length === 0) {
      setError('Select at least one technique.')
      return
    }

    setBusy(true)
    setInfo(`Generating test scenarios using ${skillIds.length} technique(s) in parallel...`)
    setSuite(null)
    setSuiteMeta(null)
    setSelectedSkills([])
    setDuplicateGroups([])
    setSkillDiagrams([])
    setAioResult('')

    try {
      try {
        generateAbortRef.current && generateAbortRef.current.abort()
      } catch {
        // ignore
      }
      const controller = new AbortController()
      generateAbortRef.current = controller

      const fd = new FormData()
      fd.set('provider', provider)
      fd.set('model', model)
      fd.set('depth', depth)
      fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)
      fd.set('selectedSkills', JSON.stringify(skillIds))

      const diagramSkillIds = Object.entries(selectedDiagrams)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (diagramSkillIds.length > 0) {
        fd.set('diagramSkills', JSON.stringify(diagramSkillIds))
      }

      if (analysis && Array.isArray(analysis.extractedElements)) {
        fd.set('analysisContext', JSON.stringify(analysis.extractedElements))
      }

      const clarifications = buildClarifications()
      if (clarifications) fd.set('clarifications', clarifications)

      const res = await fetch('/api/generate-tests', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)

      setSuite(data.suite || null)
      setSelectedSkills(Array.isArray(data.selectedSkills) ? data.selectedSkills : [])
      setSuiteMeta({
        provider: data.provider,
        model: data.model,
        depth: data.depth,
        repaired: Boolean(data.repaired),
        mode: data.mode || 'per-skill'
      })
      setDuplicateGroups(Array.isArray(data.duplicateGroups) ? data.duplicateGroups : [])
      setSkillDiagrams(Array.isArray(data.skillDiagrams) ? data.skillDiagrams : [])

      const count = data.suite && Array.isArray(data.suite.testCases) ? data.suite.testCases.length : 0
      const dupCount = Array.isArray(data.duplicateGroups) ? data.duplicateGroups.length : 0
      const errors = Array.isArray(data.skillErrors) ? data.skillErrors : []
      let msg = `Done. Generated ${count} test cases via ${skillIds.length} technique(s).`
      if (dupCount > 0) msg += ` ${dupCount} duplicate(s) removed.`
      if (errors.length > 0) msg += ` ${errors.length} skill(s) had errors.`
      setSuccess(msg)

      // Auto-advance to results
      goToStep(2)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) {
        setInfo('Cancelled.')
      } else {
        setError(err && err.message ? err.message : String(err))
      }
    } finally {
      generateAbortRef.current = null
      setBusy(false)
    }
  }

  async function callGenerate() {
    if (!hasAnyRequirements) {
      setError('Add requirements first (file or text).')
      return
    }

    setBusy(true)
    setInfo('Generating...')
    setSuite(null)
    setSuiteMeta(null)
    setSelectedSkills([])
    setSkillDiagrams([])
    setAioResult('')

    try {
      try {
        generateAbortRef.current && generateAbortRef.current.abort()
      } catch {
        // ignore
      }
      const controller = new AbortController()
      generateAbortRef.current = controller

      const fd = new FormData()
      fd.set('provider', provider)
      fd.set('model', model)
      fd.set('depth', depth)
      fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)

      const clarifications = buildClarifications()
      if (clarifications) fd.set('clarifications', clarifications)

      const res = await fetch('/api/generate-tests', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)

      setSuite(data.suite || null)
      setSelectedSkills(Array.isArray(data.selectedSkills) ? data.selectedSkills : [])
      setSuiteMeta({
        provider: data.provider,
        model: data.model,
        depth: data.depth,
        repaired: Boolean(data.repaired)
      })
      const count = data.suite && Array.isArray(data.suite.testCases) ? data.suite.testCases.length : 0
      setSuccess(`Done. Generated ${count} test cases.`)

      // Auto-advance to results
      goToStep(2)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) {
        setInfo('Cancelled.')
      } else {
        setError(err && err.message ? err.message : String(err))
      }
    } finally {
      generateAbortRef.current = null
      setBusy(false)
    }
  }

  const filteredCases = useMemo(() => {
    const cases = suite && Array.isArray(suite.testCases) ? suite.testCases : []
    const q = search.trim().toLowerCase()
    let out = cases.slice()
    if (filterType) out = out.filter((t) => String(t.type || '') === filterType)
    if (filterPriority) out = out.filter((t) => String(t.priority || '') === filterPriority)
    if (q) {
      out = out.filter((t) => {
        const hay = [
          t.id,
          t.title,
          Array.isArray(t.coverageTags) ? t.coverageTags.join(' ') : '',
          Array.isArray(t.requirementRefs) ? t.requirementRefs.join(' ') : ''
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    return out
  }, [suite, search, filterType, filterPriority])

  const displayedSkills = useMemo(() => {
    const list = Array.isArray(selectedSkills) ? selectedSkills.slice() : []
    list.sort((a, b) => {
      const as = a && Number.isFinite(a.score) ? a.score : 0
      const bs = b && Number.isFinite(b.score) ? b.score : 0
      return bs - as
    })
    return list
  }, [selectedSkills])

  async function pushToAio() {
    if (!suite) {
      setError('Generate test cases first.')
      return
    }
    const jiraProjectId = aioProject.trim()
    if (!jiraProjectId) {
      setError('Enter Jira project key/id for AIO push.')
      return
    }

    setAioBusy(true)
    setAioResult('Pushing...')
    try {
      try {
        aioAbortRef.current && aioAbortRef.current.abort()
      } catch {
        // ignore
      }
      const controller = new AbortController()
      aioAbortRef.current = controller

      const payload = {
        jiraProjectId,
        folderPath: aioFolder.trim(),
        aioToken: aioToken.trim(),
        includeCoverageTags: Boolean(aioIncludeTags),
        suite
      }

      const res = await fetch('/api/aio/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)

      const created = Array.isArray(data.created) ? data.created : []
      const lines = []
      lines.push(`ok: true`)
      lines.push(`project: ${data.jiraProjectId}`)
      if (data.folder && data.folder.ID) lines.push(`folder: ${data.folder.ID} (${data.folder.name || ''})`)
      lines.push(`created: ${data.createdCount}`)
      for (const c of created.slice(0, 20)) lines.push(`- ${c.id}: ${c.aioCaseKey || c.aioCaseId || '(created)'}`)
      if (created.length > 20) lines.push(`...and ${created.length - 20} more`)
      setAioResult(lines.join('\n'))
      setSuccess('AIO push done.')
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) {
        setAioResult('Cancelled.')
        setInfo('Cancelled.')
      } else {
        setAioResult(`error: ${err && err.message ? err.message : String(err)}`)
        setError('AIO push failed.')
      }
    } finally {
      aioAbortRef.current = null
      setAioBusy(false)
    }
  }

  const missingQuestions = useMemo(() => {
    if (!preflight || !Array.isArray(preflight.missingInfoQuestions)) return []
    return preflight.missingInfoQuestions
  }, [preflight])
  const answeredCount = useMemo(() => {
    let n = 0
    for (const q of missingQuestions) {
      const a = String(answersByQuestion[String(q)] || '').trim()
      if (a) n++
    }
    return n
  }, [missingQuestions, answersByQuestion])

  function handleStartOver() {
    cancelInFlight()
    setPreflight(null)
    setPreflightSkills([])
    setAnswersByQuestion({})
    setAnalysis(null)
    setAnalysisMeta(null)
    setSelectedTechniques({})
    setSelectedDiagrams({})
    setSuite(null)
    setSuiteMeta(null)
    setSelectedSkills([])
    setDuplicateGroups([])
    setSkillDiagrams([])
    setAioResult('')
    setStatus('')
    setSearch('')
    setFilterType('')
    setFilterPriority('')
    goToStep(0)
  }

  // Determine which steps are completed
  const stepCompleted = {
    0: hasAnyRequirements && Boolean(provider && model),
    1: Boolean(analysis) || Boolean(suite),
    2: Boolean(suite)
  }

  // Navigation helpers
  const canGoNext = () => {
    if (activeStep === 0) return hasAnyRequirements && Boolean(provider && model)
    if (activeStep === 1) return Boolean(analysis) || Boolean(suite)
    return false
  }

  // ─── RENDER STEP CONTENT ───

  function renderStepRequirements() {
    return (
      <Stack spacing={2.5}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Provider & Model</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                  Choose the AI provider and model for analysis and generation.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select value={provider} label="Provider" onChange={(e) => { setProvider(e.target.value); setModel(defaultModel(e.target.value)) }}>
                      <MenuItem value="openai">OpenAI</MenuItem>
                      <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                      <MenuItem value="gemini">Google Gemini</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Model</InputLabel>
                    <Select value={model} label="Model" onChange={(e) => setModel(e.target.value)}>
                      {(modelOptions[provider] || []).map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Requirements</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                  Upload a file or paste your requirement text. Both can be combined.
                </Typography>
              </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx,.html,.htm,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/html"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                if (f) acceptDroppedFile(f)
              }}
            />

            <Box
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current && fileInputRef.current.click()
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOver(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOver(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOver(false)
                const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null
                if (f) acceptDroppedFile(f)
              }}
              sx={{
                borderRadius: 3,
                border: `1px dashed ${dragOver ? 'rgba(168, 85, 247, 0.70)' : 'rgba(255,255,255,0.18)'}`,
                background: dragOver ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.14)',
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1.6, sm: 2.25 },
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 140ms ease, box-shadow 140ms ease',
                boxShadow: dragOver ? '0 0 0 4px rgba(168, 85, 247, 0.16)' : 'none'
              }}
            >
              <Stack spacing={0.5} alignItems="center">
                <CloudUploadIcon sx={{ color: purpleMain }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
                  Drag & drop a file, or click to upload
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)' }}>
                  Supported: .txt, .md, .pdf, .docx, .html
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', textAlign: 'center' }} noWrap={!isSmDown}>
                  {requirementFile ? requirementFile.name : 'No file selected'}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Button
                variant="text"
                size="small"
                startIcon={<ClearAllIcon />}
                disabled={!requirementFile && requirementText.trim().length === 0}
                onClick={() => {
                  cancelInFlight()
                  setRequirementFile(null)
                  setRequirementText('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                  setInfo('Cleared requirements.')
                }}
                sx={{
                  color: 'rgba(255,255,255,0.90)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' }
                }}
              >
                Clear
              </Button>
            </Stack>

            <TextField
              label="Requirement text"
              placeholder="Paste requirements here..."
              value={requirementText}
              onChange={(e) => setRequirementText(e.target.value)}
              multiline
              minRows={isSmDown ? 6 : 8}
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>
      </Stack>
    )
  }

  function renderStepAnalyze() {
    return (
      <Stack spacing={2.5}>
        {/* Clarify section */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Clarify Requirements (Optional)</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                  Let the AI identify ambiguities first, or skip straight to analysis below.
                </Typography>
              </Box>

              {!preflight ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    disabled={busy || !hasAnyRequirements}
                    onClick={callPreflight}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.92)',
                      '&:hover': { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.08)' }
                    }}
                  >
                    Ask missing info
                  </Button>
                  {busy && !analysis && (
                    <Button variant="text" onClick={() => { cancelInFlight(); setInfo('Cancelling...') }} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              ) : null}

            </Stack>
          </CardContent>
        </Card>

        {missingQuestions.length > 0 ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Answer Questions</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                    The AI identified {missingQuestions.length} question(s). Answer them to improve test generation quality.
                  </Typography>
                </Box>

                <Stack spacing={1.5}>
                  {missingQuestions.map((q) => {
                    const key = String(q)
                    return (
                      <Card key={key} sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                        <CardContent>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(255,255,255,0.76)' }}
                          >
                            {key}
                          </Typography>
                          <TextField
                            label="Your answer"
                            value={answersByQuestion[key] || ''}
                            onChange={(e) => setAnswersByQuestion((prev) => ({ ...prev, [key]: e.target.value }))}
                            multiline
                            minRows={2}
                            fullWidth
                            sx={{ mt: 1.5 }}
                          />
                        </CardContent>
                      </Card>
                    )
                  })}
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${answeredCount}/${missingQuestions.length} answered`}
                    sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.70)' }}
                  />
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ClearAllIcon />}
                    onClick={() => { setAnswersByQuestion({}); setInfo('Answers cleared.') }}
                    sx={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    Clear answers
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {/* Analyze & Generate section */}
        {!analysis ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Analyze & Generate</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                    Let the AI analyze your requirement to extract testable elements and recommend techniques, or generate directly.
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<ScienceIcon />}
                    disabled={busy || !hasAnyRequirements}
                    onClick={callAnalyze}
                    sx={{
                      backgroundImage: 'none',
                      backgroundColor: purpleMain,
                      color: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
                      '&:hover': { backgroundColor: purpleDeep }
                    }}
                  >
                    Analyze & recommend techniques
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={busy || !hasAnyRequirements}
                    onClick={callGenerate}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.92)',
                      '&:hover': {
                        borderColor: 'rgba(168, 85, 247, 0.45)',
                        backgroundColor: 'rgba(168, 85, 247, 0.08)'
                      }
                    }}
                  >
                    Generate directly (legacy)
                  </Button>
                  {busy && (
                    <Button variant="text" onClick={() => { cancelInFlight(); setInfo('Cancelling...') }} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      Cancel
                    </Button>
                  )}
                </Stack>

                {busy ? <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { backgroundColor: purpleMain } }} /> : null}
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {analysis ? (
          <Card sx={{ borderColor: 'rgba(168, 85, 247, 0.22)', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.15), 0 18px 60px rgba(0,0,0,0.50)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Requirement Analysis</Typography>
                  {analysisMeta ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      <Chip size="small" variant="outlined" label={`provider: ${analysisMeta.provider}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace }} />
                      <Chip size="small" variant="outlined" label={`complexity: ${analysis.complexity || '?'}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace }} />
                    </Stack>
                  ) : null}
                </Box>

                <Card sx={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Summary</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.5 }}>
                      {analysis.summary || '(no summary)'}
                    </Typography>
                  </CardContent>
                </Card>

                {Array.isArray(analysis.extractedElements) && analysis.extractedElements.length > 0 ? (
                  <Card sx={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Extracted Testable Elements</Typography>
                      <Stack spacing={0.75} sx={{ mt: 1 }}>
                        {analysis.extractedElements.map((el, idx) => (
                          <Stack key={idx} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              label={el.type}
                              sx={{
                                fontFamily: theme.typography.fontFamilyMonospace,
                                fontSize: '0.72rem',
                                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                color: 'rgba(168, 85, 247, 0.92)'
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.86)' }}>
                              {el.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.60)' }}>
                              {el.description}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

                <Card sx={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recommended Techniques</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.60)', mb: 1.5 }}>
                      Toggle techniques on/off, then generate. High/medium confidence are pre-selected.
                    </Typography>
                    <Stack spacing={1}>
                      {(Array.isArray(analysis.techniqueRecommendations) ? analysis.techniqueRecommendations : []).map((rec) => {
                        const checked = Boolean(selectedTechniques[rec.skillId])
                        const confidenceColor =
                          rec.confidence === 'high' ? '#16a34a' :
                          rec.confidence === 'medium' ? '#d97706' : 'rgba(255,255,255,0.45)'
                        return (
                          <Card
                            key={rec.skillId}
                            sx={{
                              backgroundColor: checked ? 'rgba(168, 85, 247, 0.06)' : 'rgba(0,0,0,0.12)',
                              borderColor: checked ? 'rgba(168, 85, 247, 0.30)' : 'rgba(255,255,255,0.08)',
                              cursor: 'pointer',
                              transition: 'all 120ms ease'
                            }}
                            onClick={() => setSelectedTechniques((prev) => ({ ...prev, [rec.skillId]: !prev[rec.skillId] }))}
                          >
                            <CardContent sx={{ py: 1.25, px: 2, '&:last-child': { pb: 1.25 } }}>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Checkbox
                                  checked={checked}
                                  size="small"
                                  sx={{ p: 0, color: 'rgba(255,255,255,0.40)', '&.Mui-checked': { color: purpleMain } }}
                                  onChange={() => setSelectedTechniques((prev) => ({ ...prev, [rec.skillId]: !prev[rec.skillId] }))}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                                      {rec.skillId}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={rec.confidence}
                                      sx={{
                                        fontFamily: theme.typography.fontFamilyMonospace,
                                        fontSize: '0.68rem',
                                        height: 20,
                                        backgroundColor: `${confidenceColor}22`,
                                        color: confidenceColor,
                                        fontWeight: 700
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.50)', fontFamily: theme.typography.fontFamilyMonospace }}>
                                      ~{rec.estimatedScenarios} scenarios
                                    </Typography>
                                  </Stack>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)', display: 'block', mt: 0.25 }}>
                                    {rec.rationale}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </Stack>

                    {/* Available Diagrams (optional) */}
                    {(() => {
                      const activeSkillIds = Object.entries(selectedTechniques).filter(([, v]) => v).map(([k]) => k)
                      const availableDiags = activeSkillIds.filter((id) => diagramInfo[id])
                      if (availableDiags.length === 0) return null
                      const selectedCount = availableDiags.filter((id) => selectedDiagrams[id]).length
                      return (
                        <Card sx={{ mt: 1.5, backgroundColor: 'rgba(0,0,0,0.12)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <AccountTreeIcon sx={{ color: purpleMain, fontSize: 18 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                                Available Diagrams
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                (optional)
                              </Typography>
                              {selectedCount > 0 && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${selectedCount} selected`}
                                  sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.68rem', height: 20, borderColor: 'rgba(168, 85, 247, 0.30)', color: 'rgba(168, 85, 247, 0.85)' }}
                                />
                              )}
                              <Box sx={{ flex: 1 }} />
                              <Button
                                size="small"
                                variant="text"
                                sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.50)', textTransform: 'none', minWidth: 'auto', px: 1 }}
                                onClick={() => {
                                  const allSelected = availableDiags.every((id) => selectedDiagrams[id])
                                  const next = {}
                                  for (const id of availableDiags) next[id] = !allSelected
                                  setSelectedDiagrams((prev) => ({ ...prev, ...next }))
                                }}
                              >
                                {availableDiags.every((id) => selectedDiagrams[id]) ? 'Deselect all' : 'Select all'}
                              </Button>
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.50)', display: 'block', mb: 1 }}>
                              Select diagrams to visualize how each technique applies to your requirement.
                            </Typography>
                            <Stack spacing={0.5}>
                              {availableDiags.map((id) => {
                                const info = diagramInfo[id]
                                const checked = Boolean(selectedDiagrams[id])
                                return (
                                  <Stack
                                    key={id}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{
                                      py: 0.5,
                                      px: 1,
                                      borderRadius: 1.5,
                                      cursor: 'pointer',
                                      backgroundColor: checked ? 'rgba(168, 85, 247, 0.06)' : 'transparent',
                                      '&:hover': { backgroundColor: 'rgba(168, 85, 247, 0.08)' },
                                      transition: 'background-color 120ms ease'
                                    }}
                                    onClick={() => setSelectedDiagrams((prev) => ({ ...prev, [id]: !prev[id] }))}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      size="small"
                                      sx={{ p: 0, color: 'rgba(255,255,255,0.30)', '&.Mui-checked': { color: purpleMain } }}
                                      onChange={() => setSelectedDiagrams((prev) => ({ ...prev, [id]: !prev[id] }))}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <AccountTreeIcon sx={{ color: checked ? purpleMain : 'rgba(255,255,255,0.25)', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: checked ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.60)' }}>
                                      {info.label}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={id}
                                      sx={{
                                        fontFamily: theme.typography.fontFamilyMonospace,
                                        fontSize: '0.64rem',
                                        height: 18,
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: 'rgba(255,255,255,0.40)',
                                      }}
                                    />
                                    <Chip
                                      size="small"
                                      label={info.type}
                                      sx={{
                                        fontFamily: theme.typography.fontFamilyMonospace,
                                        fontSize: '0.64rem',
                                        height: 18,
                                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                                        color: 'rgba(168, 85, 247, 0.60)',
                                      }}
                                    />
                                  </Stack>
                                )
                              })}
                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    })()}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mt: 2 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${Object.values(selectedTechniques).filter(Boolean).length} technique(s) selected`}
                        sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.70)' }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => { setAnalysis(null); setAnalysisMeta(null); setSelectedTechniques({}); setSelectedDiagrams({}) }}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.14)',
                          color: 'rgba(255,255,255,0.85)',
                          '&:hover': { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.08)' }
                        }}
                      >
                        Re-analyze
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        disabled={busy || Object.values(selectedTechniques).filter(Boolean).length === 0}
                        onClick={callGenerateFromAnalysis}
                        sx={{
                          backgroundImage: 'none',
                          backgroundColor: purpleMain,
                          color: 'rgba(255,255,255,0.96)',
                          boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
                          '&:hover': { backgroundColor: purpleDeep }
                        }}
                      >
                        Generate test scenarios
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {busy ? <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { backgroundColor: purpleMain } }} /> : null}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    )
  }

  function renderStepResults() {
    if (!suite) {
      return (
        <Card>
          <CardContent>
            <Stack spacing={1.5} alignItems="center" sx={{ py: 4 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.60)' }}>No results yet</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                Go back to the Analyze step to generate test cases.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => goToStep(1)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.85)',
                  '&:hover': { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.08)' }
                }}
              >
                Go to Analyze
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card
        sx={{
          borderColor: 'rgba(168, 85, 247, 0.28)',
          boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.22), 0 22px 80px rgba(0,0,0,0.65)'
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {suiteMeta ? (
                  <>
                    <Chip size="small" variant="outlined" label={`provider: ${suiteMeta.provider}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace }} />
                    <Chip size="small" variant="outlined" label={`model: ${suiteMeta.model}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace }} />
                    <Chip size="small" variant="outlined" label={`depth: ${suiteMeta.depth}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace }} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`schema repair: ${suiteMeta.repaired ? 'yes' : 'no'}`}
                      sx={{ fontFamily: theme.typography.fontFamilyMonospace }}
                    />
                    {suiteMeta.mode ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`mode: ${suiteMeta.mode}`}
                        sx={{
                          fontFamily: theme.typography.fontFamilyMonospace,
                          borderColor: suiteMeta.mode === 'per-skill' ? 'rgba(22, 163, 74, 0.40)' : 'rgba(255,255,255,0.14)',
                          color: suiteMeta.mode === 'per-skill' ? 'rgba(22, 163, 74, 0.92)' : undefined
                        }}
                      />
                    ) : null}
                    {duplicateGroups.length > 0 ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${duplicateGroups.length} duplicate(s) removed`}
                        sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(217, 119, 6, 0.40)', color: 'rgba(217, 119, 6, 0.92)' }}
                      />
                    ) : null}
                  </>
                ) : null}
              </Stack>
              <Box sx={{ flex: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => download('test-suite.json', JSON.stringify(suite, null, 2), 'application/json')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.92)',
                    '&:hover': {
                      borderColor: 'rgba(168, 85, 247, 0.55)',
                      backgroundColor: 'rgba(168, 85, 247, 0.08)'
                    }
                  }}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => download('test-cases.csv', toCsv(suite), 'text/csv')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.92)',
                    '&:hover': {
                      borderColor: 'rgba(168, 85, 247, 0.55)',
                      backgroundColor: 'rgba(168, 85, 247, 0.08)'
                    }
                  }}
                >
                  Export CSV
                </Button>
              </Stack>
            </Stack>

            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
              {suite.suiteTitle || 'Test suite'}
            </Typography>

            <Card sx={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Push to AIO Tests
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                        Create a folder (if needed) and create test cases in AIO.
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <FormControlLabel
                      control={<Switch checked={aioIncludeTags} onChange={(e) => setAioIncludeTags(e.target.checked)} />}
                      label="Include coverage tags"
                    />
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        label="Jira project key/id"
                        placeholder="e.g., AT"
                        value={aioProject}
                        onChange={(e) => setAioProject(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        size="small"
                        label="Folder path (optional)"
                        placeholder="Release 1.0 / Regression / Checkout"
                        value={aioFolder}
                        onChange={(e) => setAioFolder(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        size="small"
                        label="AIO API token (optional if server configured)"
                        type="password"
                        value={aioToken}
                        onChange={(e) => setAioToken(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button variant="contained" disabled={aioBusy} onClick={pushToAio}>
                      Create folder & push
                    </Button>
                    {aioBusy ? (
                      <Button
                        variant="text"
                        onClick={() => {
                          cancelInFlight()
                          setInfo('Cancelling...')
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    <Box sx={{ flex: 1 }} />
                    {aioResult ? (
                      <Button
                        variant="text"
                        startIcon={<ContentCopyIcon />}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(aioResult)
                            setInfo('Copied AIO result.')
                          } catch {
                            setError('Copy failed.')
                          }
                        }}
                      >
                        Copy result
                      </Button>
                    ) : null}
                  </Stack>

                  {aioResult ? (
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(0,0,0,0.25)',
                        fontFamily: theme.typography.fontFamilyMonospace,
                        fontSize: 12,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {aioResult}
                    </Box>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2
              }}
            >
              <Card sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'left' }}>
                    Selected skills
                  </Typography>
                  <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.08)' }} />
                  <BulletList
                    items={listOrNone(displayedSkills)}
                    renderItem={(s) => {
                      if (typeof s === 'string') {
                        return <Typography variant="body2">{s}</Typography>
                      }

                      const score = Number.isFinite(s.score) ? s.score : null
                      const reason = s.reason && typeof s.reason === 'object' ? s.reason : null
                      const alwaysInclude = Boolean(reason && reason.alwaysInclude)
                      const matched = Array.isArray(reason && reason.matched) ? reason.matched : []
                      const boosts = Array.isArray(reason && reason.boosts) ? reason.boosts : []

                      const scoreLabel = score !== null ? `match score: ${score}` : ''
                      const why = alwaysInclude
                        ? ['baseline (always included)', scoreLabel].filter(Boolean).join(' | ')
                        : [
                            scoreLabel,
                            matched.length ? `matched: ${matched.join(', ')}` : '',
                            boosts.length ? `boosts: ${boosts.map((b) => (b && b.tag ? `${b.hint}->${b.tag}` : String(b))).join(', ')}` : ''
                          ]
                            .filter(Boolean)
                            .join(' | ')
                      return (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
                            <Box component="span" sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(255,255,255,0.66)' }}>
                              {String(s.id)}
                            </Box>
                            {' — '}
                            {String(s.title)}
                          </Typography>
                          {why ? (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 0.35,
                                color: 'rgba(255,255,255,0.55)',
                                fontFamily: theme.typography.fontFamilyMonospace
                              }}
                            >
                              {why}
                            </Typography>
                          ) : null}
                        </Box>
                      )
                    }}
                  />
                </CardContent>
              </Card>

              <Card sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'left' }}>
                    Missing info questions
                  </Typography>
                  <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.08)' }} />
                  <BulletList items={listOrNone(suite.missingInfoQuestions)} />
                </CardContent>
              </Card>

              <Card sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'left' }}>
                    Assumptions
                  </Typography>
                  <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.08)' }} />
                  <BulletList items={listOrNone(suite.assumptions)} />
                </CardContent>
              </Card>

              <Card sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'left' }}>
                    Risks
                  </Typography>
                  <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.08)' }} />
                  <BulletList items={listOrNone(suite.risks)} />
                </CardContent>
              </Card>
            </Box>

            {/* Mermaid Diagram Buttons */}
            {skillDiagrams.length > 0 && (
              <Card sx={{ backgroundColor: 'rgba(0,0,0,0.20)' }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccountTreeIcon sx={{ color: purpleMain, fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Technique Diagrams
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${skillDiagrams.length} diagram(s)`}
                        sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.60)' }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {skillDiagrams.map((d) => (
                        <Button
                          key={d.skillId}
                          variant="outlined"
                          startIcon={<AccountTreeIcon />}
                          onClick={() => { setActiveDiagram(d); setDiagramDialogOpen(true) }}
                          sx={{
                            borderColor: 'rgba(168, 85, 247, 0.25)',
                            color: 'rgba(255,255,255,0.85)',
                            backgroundColor: 'rgba(168, 85, 247, 0.06)',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: 'rgba(168, 85, 247, 0.50)',
                              backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            }
                          }}
                        >
                          {d.skillTitle}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                  Test cases
                </Typography>
                <TextField
                  size="small"
                  label="Search"
                  placeholder="Search title/id/tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Type</InputLabel>
                  <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                    <MenuItem value="">All types</MenuItem>
                    {[
                      'functional',
                      'negative',
                      'boundary',
                      'security',
                      'accessibility',
                      'performance',
                      'usability',
                      'compatibility',
                      'resilience'
                    ].map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
                    <MenuItem value="">All priorities</MenuItem>
                    {['P0', 'P1', 'P2', 'P3'].map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.60)' }}>
                Showing {filteredCases.length} of {Array.isArray(suite.testCases) ? suite.testCases.length : 0}
              </Typography>
            </Box>

            {isSmDown ? (
              <Stack spacing={1.25}>
                {filteredCases.map((tc) => (
                  <Accordion
                    key={String(tc.id)}
                    disableGutters
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.10)',
                      backgroundColor: 'rgba(0,0,0,0.22)',
                      overflow: 'hidden',
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.80)' }} />}
                      sx={{
                        px: 1.5,
                        '& .MuiAccordionSummary-content': { my: 1.25 }
                      }}
                    >
                      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={String(tc.id || '')}
                            sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.78)' }}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={String(tc.type || '')}
                            sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(168, 85, 247, 0.40)', color: 'rgba(168, 85, 247, 0.92)' }}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={String(tc.priority || '')}
                            sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.72)' }}
                          />
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.92)',
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2
                          }}
                        >
                          {String(tc.title || '')}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 1.5, pb: 1.5 }}>
                      <Stack spacing={1.1}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                            PRECONDITIONS
                          </Typography>
                          <OrderedList items={tc.preconditions} sx={{ mt: 0.5 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                            STEPS
                          </Typography>
                          <OrderedList items={tc.steps} sx={{ mt: 0.5 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                            EXPECTED
                          </Typography>
                          <OrderedList items={tc.expected} sx={{ mt: 0.5 }} />
                        </Box>
                        {(Array.isArray(tc.coverageTags) && tc.coverageTags.length) || (Array.isArray(tc.requirementRefs) && tc.requirementRefs.length) ? (
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {Array.isArray(tc.coverageTags)
                              ? tc.coverageTags.slice(0, 12).map((t) => (
                                  <Chip key={String(t)} size="small" label={String(t)} sx={{ backgroundColor: 'rgba(168, 85, 247, 0.10)', color: 'rgba(255,255,255,0.78)' }} />
                                ))
                              : null}
                            {Array.isArray(tc.requirementRefs)
                              ? tc.requirementRefs.slice(0, 6).map((r) => (
                                  <Chip key={String(r)} size="small" variant="outlined" label={String(r)} sx={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.70)' }} />
                                ))
                              : null}
                          </Stack>
                        ) : null}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            ) : (
              <TableContainer sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.10)', overflow: 'auto', background: 'rgba(0,0,0,0.18)' }}>
                <Table size="small" sx={{ minWidth: 1100 }} stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['ID', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Expected', 'Tags', 'Req refs'].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            fontWeight: 700,
                            backgroundColor: 'rgba(8, 8, 8, 0.96)',
                            borderBottomColor: 'rgba(255,255,255,0.10)'
                          }}
                        >
                          <Typography variant="caption" sx={{ fontFamily: ['ID', 'Type', 'Priority'].includes(h) ? theme.typography.fontFamilyMonospace : undefined }}>
                            {h}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCases.map((tc) => (
                      <TableRow key={String(tc.id)} hover>
                        <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(255,255,255,0.78)' }}>{String(tc.id || '')}</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.86)' }}>{String(tc.title || '')}</TableCell>
                        <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(168, 85, 247, 0.92)' }}>{String(tc.type || '')}</TableCell>
                        <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(255,255,255,0.70)' }}>{String(tc.priority || '')}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.70)' }}>{joinLines(tc.preconditions)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.70)' }}>{joinLines(tc.steps)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.70)' }}>{joinLines(tc.expected)}</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.70)' }}>{Array.isArray(tc.coverageTags) ? tc.coverageTags.join(', ') : ''}</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.70)' }}>{Array.isArray(tc.requirementRefs) ? tc.requirementRefs.join(', ') : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  // ─── MAIN RENDER ───

  const stepContent = [
    renderStepRequirements,
    renderStepAnalyze,
    renderStepResults
  ]

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Box sx={{ minHeight: '100dvh', backgroundColor: bgBase }}>
        <AppBar
          position="sticky"
          color="transparent"
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundImage: 'none',
            backgroundColor: 'rgba(11,11,11,0.78)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.20), 0 18px 60px rgba(0,0,0,0.40)',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
                  {appLogo}
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.60)' }}>
                  skills-driven test design
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1.1 }} noWrap>
                  AI Test Case Generator
                </Typography>
              </Box>
            </Box>

            <Button
              component="a"
              href="/api/skills"
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              size="small"
              sx={{
                borderColor: 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.86)',
                boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.18)',
                '&:hover': {
                  borderColor: 'rgba(168, 85, 247, 0.45)',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)'
                }
              }}
            >
              Loaded skills
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 4, md: 6 } }}>
          <Box sx={{ maxWidth: 1100, mx: 'auto', px: { md: 3, lg: 6 } }}>

            {/* Stepper */}
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isSmDown}
              orientation={isSmDown ? 'vertical' : 'horizontal'}
              connector={<AnimatedConnector />}
              sx={{ mb: 4 }}
            >
              {STEPS.map((label, index) => (
                <Step
                  key={label}
                  completed={stepCompleted[index] && index < activeStep}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!busy) goToStep(index)
                  }}
                >
                  <StepLabel StepIconComponent={AnimatedStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Status alert */}
            {status.trim().length > 0 ? (
              <Alert severity={statusSeverity} variant="outlined" sx={{ mb: 2.5 }}>
                {status}
              </Alert>
            ) : null}

            {/* Step content with animation */}
            <Box ref={stepContainerRef} sx={{ overflow: 'hidden', position: 'relative' }}>
              <Slide
                direction={slideDirection}
                in={slideIn}
                container={stepContainerRef.current}
                timeout={250}
                easing={{ enter: 'cubic-bezier(0.25, 0.1, 0.25, 1)', exit: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                mountOnEnter
                unmountOnExit
              >
                <Fade in={slideIn} timeout={200}>
                  <Box>
                    {stepContent[activeStep]()}
                  </Box>
                </Fade>
              </Slide>
            </Box>

            {/* Navigation buttons */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Stack direction="row" spacing={1}>
                {activeStep > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    disabled={busy}
                    onClick={() => goToStep(Math.max(0, activeStep - 1))}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.85)',
                      '&:hover': { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.08)' }
                    }}
                  >
                    Back
                  </Button>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                {activeStep === 2 && suite && (
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleStartOver}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.85)',
                      '&:hover': { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.08)' }
                    }}
                  >
                    Start Over
                  </Button>
                )}
                {activeStep < 2 && (
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    disabled={busy || !canGoNext()}
                    onClick={() => goToStep(Math.min(2, activeStep + 1))}
                    sx={{
                      backgroundImage: 'none',
                      backgroundColor: purpleMain,
                      color: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
                      '&:hover': { backgroundColor: purpleDeep }
                    }}
                  >
                    {activeStep === 1 ? 'Skip to Results' : 'Next'}
                  </Button>
                )}
              </Stack>
            </Stack>

          </Box>
        </Container>
      </Box>

      {/* Diagram Viewer Dialog */}
      <Dialog
        open={diagramDialogOpen}
        onClose={() => { setDiagramDialogOpen(false); setActiveDiagram(null) }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 3,
            backgroundImage: 'none',
          }
        }}
      >
        {activeDiagram && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
              <AccountTreeIcon sx={{ color: purpleMain, fontSize: 22 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {activeDiagram.skillTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontFamily: theme.typography.fontFamilyMonospace }}>
                  {activeDiagram.skillId}
                </Typography>
              </Box>
              <IconButton
                onClick={() => { setDiagramDialogOpen(false); setActiveDiagram(null) }}
                sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.50)' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Box
                sx={{
                  borderRadius: 3,
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                  backgroundColor: 'rgba(0, 0, 0, 0.30)',
                  overflow: 'auto',
                  minHeight: 200,
                }}
              >
                <MermaidDiagram chart={activeDiagram.diagram} />
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </ThemeProvider>
  )
}
