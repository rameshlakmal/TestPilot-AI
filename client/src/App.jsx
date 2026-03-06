import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Fade,
  Slide,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material'
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'
import { ThemeProvider, createTheme, styled } from '@mui/material/styles'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

import { purpleMain, purpleDeep, bgBase, paperBase, primaryBlack, modelOptions, defaultModel } from './theme'
import StepRequirements from './StepRequirements'
import StepAnalyze from './StepAnalyze'
import StepResults from './StepResults'
import DiagramDialog from './DiagramDialog'

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
    backgroundColor: '#7c3aed',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}::after`]: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    background: `linear-gradient(90deg, ${purpleMain}, ${purpleDeep})`,
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
    background: '#7c3aed',
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
    ? '#7c3aed'
    : active
      ? purpleMain
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
          ? `0 0 0 6px rgba(167, 139, 250, 0.18), 0 0 20px rgba(167, 139, 250, 0.25)`
          : completed
            ? '0 0 0 4px rgba(124, 58, 237, 0.20)'
            : 'none',
      }}
    >
      {completed ? '✓' : icon}
    </Box>
  )
}

const STEPS = ['Requirements', 'Analyze', 'Results']

export default function App() {
  const appLogo = '📝'

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
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundImage: 'none',
                backgroundColor: '#161616',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.70)'
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
                  borderColor: 'rgba(167, 139, 250, 0.45)'
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 0 4px rgba(167, 139, 250, 0.16)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(167, 139, 250, 0.70)'
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
                    backgroundColor: 'rgba(0,0,0,0.98)',
                    boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.10), 0 24px 70px rgba(0,0,0,0.55)'
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

  // Stepper
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

  // Provider & model
  const [provider, setProvider] = useState('openai')
  const depth = 'deep'
  const [model, setModel] = useState('gpt-4.1')

  // Requirements
  const [requirementText, setRequirementText] = useState('')
  const [requirementFile, setRequirementFile] = useState(null)

  // Jira
  const [reqInputTab, setReqInputTab] = useState('manual')
  const [jiraConfigured, setJiraConfigured] = useState(false)
  const [jiraProjects, setJiraProjects] = useState([])
  const [jiraProject, setJiraProject] = useState('')
  const [jiraEpics, setJiraEpics] = useState([])
  const [jiraSprints, setJiraSprints] = useState([])
  const [jiraEpicFilter, setJiraEpicFilter] = useState('')
  const [jiraSprintFilter, setJiraSprintFilter] = useState('')
  const [jiraStatusFilter, setJiraStatusFilter] = useState('')
  const [jiraSearch, setJiraSearch] = useState('')
  const [jiraStories, setJiraStories] = useState([])
  const [jiraSelectedKeys, setJiraSelectedKeys] = useState(new Set())
  const [jiraImportedCount, setJiraImportedCount] = useState(0)
  const [jiraImportedStories, setJiraImportedStories] = useState([])
  const [jiraLoading, setJiraLoading] = useState(false)

  // Status
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [statusSeverity, setStatusSeverity] = useState('info')

  // Preflight
  const [preflight, setPreflight] = useState(null)
  const [preflightSkills, setPreflightSkills] = useState([])
  const [answersByQuestion, setAnswersByQuestion] = useState({})

  // Suite
  const [suiteMeta, setSuiteMeta] = useState(null)
  const [suite, setSuite] = useState(null)
  const [selectedSkills, setSelectedSkills] = useState([])

  // Analysis
  const [analysis, setAnalysis] = useState(null)
  const [analysisMeta, setAnalysisMeta] = useState(null)
  const [selectedTechniques, setSelectedTechniques] = useState({})
  const [selectedDiagrams, setSelectedDiagrams] = useState({})
  const [duplicateGroups, setDuplicateGroups] = useState([])
  const [skillDiagrams, setSkillDiagrams] = useState([])
  const [diagramDialogOpen, setDiagramDialogOpen] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState(null)

  // Results filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [diagramZoom, setDiagramZoom] = useState(1)
  const [expandedInfoCard, setExpandedInfoCard] = useState('skills')

  // AIO
  const [aioProject, setAioProject] = useState('')
  const [aioFolder, setAioFolder] = useState('')
  const [aioToken, setAioToken] = useState('')
  const [aioIncludeTags, setAioIncludeTags] = useState(false)
  const [aioBusy, setAioBusy] = useState(false)
  const [aioResult, setAioResult] = useState('')
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set())

  // Initialize checkboxes when suite changes
  useEffect(() => {
    if (suite && Array.isArray(suite.testCases)) {
      setSelectedCaseIds(new Set(suite.testCases.map((tc) => String(tc.id))))
    }
  }, [suite])

  // Check Jira configuration on mount
  useEffect(() => {
    fetch('/api/jira/status').then((r) => r.json()).then((d) => {
      if (d && d.configured) {
        setJiraConfigured(true)
        fetch('/api/jira/projects').then((r) => r.json()).then((p) => {
          if (Array.isArray(p.projects)) setJiraProjects(p.projects)
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Load epics + sprints when a Jira project is selected
  useEffect(() => {
    if (!jiraProject) {
      setJiraEpics([])
      setJiraSprints([])
      return
    }
    setJiraEpicFilter('')
    setJiraSprintFilter('')
    setJiraStatusFilter('')

    fetch(`/api/jira/epics?project=${encodeURIComponent(jiraProject)}`).then((r) => r.json()).then((d) => {
      if (Array.isArray(d.epics)) setJiraEpics(d.epics)
    }).catch(() => {})
    fetch(`/api/jira/sprints?project=${encodeURIComponent(jiraProject)}`).then((r) => r.json()).then((d) => {
      if (Array.isArray(d.sprints)) setJiraSprints(d.sprints)
    }).catch(() => {})
  }, [jiraProject])

  function fetchJiraStories() {
    if (!jiraProject) return
    setJiraLoading(true)
    const params = new URLSearchParams({ project: jiraProject })
    if (jiraEpicFilter) params.set('epic', jiraEpicFilter)
    if (jiraSprintFilter) params.set('sprint', jiraSprintFilter)
    if (jiraStatusFilter) params.set('status', jiraStatusFilter)
    if (jiraSearch.trim()) params.set('search', jiraSearch.trim())
    fetch(`/api/jira/stories?${params}`).then((r) => r.json()).then((d) => {
      if (Array.isArray(d.stories)) {
        setJiraStories(d.stories)
        setJiraSelectedKeys(new Set())
      }
    }).catch((err) => setError(err.message)).finally(() => setJiraLoading(false))
  }

  async function useSelectedJiraStories() {
    const keys = Array.from(jiraSelectedKeys)
    if (!keys.length) { setError('Select at least one story.'); return }
    setJiraLoading(true)
    try {
      const res = await fetch('/api/jira/story-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch stories')
      const stories = Array.isArray(data.stories) ? data.stories : []
      setJiraImportedStories(stories)
      setRequirementText(data.formatted || '')
      setJiraImportedCount(keys.length)
      setInfo(`Imported ${keys.length} user ${keys.length === 1 ? 'story' : 'stories'} from Jira.`)
      goToStep(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setJiraLoading(false)
    }
  }

  // Re-sync requirementText when Jira checkboxes change after import
  useEffect(() => {
    if (!jiraImportedStories.length) return
    const selected = jiraImportedStories.filter((s) => jiraSelectedKeys.has(s.key))
    const text = selected
      .map((s) => {
        const lines = [`USER STORY: ${s.key} — ${s.summary}`]
        if (s.description && s.description.trim()) {
          lines.push('Description:')
          lines.push(s.description.trim())
        }
        return lines.join('\n')
      })
      .join('\n\n---\n\n')
    setRequirementText(text)
    setJiraImportedCount(selected.length)
  }, [jiraSelectedKeys, jiraImportedStories])

  const hasAnyRequirements = Boolean(requirementFile) || requirementText.trim().length > 0

  const preflightAbortRef = useRef(null)
  const analyzeAbortRef = useRef(null)
  const generateAbortRef = useRef(null)
  const aioAbortRef = useRef(null)

  function cancelInFlight() {
    try { preflightAbortRef.current && preflightAbortRef.current.abort() } catch {}
    try { analyzeAbortRef.current && analyzeAbortRef.current.abort() } catch {}
    try { generateAbortRef.current && generateAbortRef.current.abort() } catch {}
    try { aioAbortRef.current && aioAbortRef.current.abort() } catch {}
  }

  // Persist settings
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
    } catch {}
  }, [])

  useEffect(() => {
    const key = 'ai-test-generator:v1'
    const payload = { provider, model, requirementText, answersByQuestion, aioProject, aioFolder, aioIncludeTags }
    try { localStorage.setItem(key, JSON.stringify(payload)) } catch {}
  }, [provider, model, requirementText, answersByQuestion, aioProject, aioFolder, aioIncludeTags])

  useEffect(() => {
    return () => cancelInFlight()
  }, [])

  function setInfo(msg) { setStatus(String(msg || '')); setStatusSeverity('info') }
  function setError(msg) { setStatus(String(msg || '')); setStatusSeverity('error') }
  function setSuccess(msg) { setStatus(String(msg || '')); setStatusSeverity('success') }

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
    if (!hasAnyRequirements) { setError('Add requirements first (file or text).'); return }
    setBusy(true)
    setInfo('Analyzing requirements and preparing questions...')
    setPreflight(null); setPreflightSkills([]); setAnswersByQuestion({})
    setSuite(null); setSelectedSkills([]); setSuiteMeta(null); setAioResult('')
    try {
      try { preflightAbortRef.current && preflightAbortRef.current.abort() } catch {}
      const controller = new AbortController()
      preflightAbortRef.current = controller
      const fd = new FormData()
      fd.set('provider', provider); fd.set('model', model); fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)
      const res = await fetch('/api/preflight', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)
      setPreflight(data.preflight || null)
      setPreflightSkills(Array.isArray(data.selectedSkills) ? data.selectedSkills : [])
      const count = data.preflight && Array.isArray(data.preflight.missingInfoQuestions) ? data.preflight.missingInfoQuestions.length : 0
      setSuccess(`Preflight done. ${count} question(s) to answer.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) { setInfo('Cancelled.') }
      else { setError(err && err.message ? err.message : String(err)) }
    } finally { preflightAbortRef.current = null; setBusy(false) }
  }

  async function callAnalyze() {
    if (!hasAnyRequirements) { setError('Add requirements first (file or text).'); return }
    setBusy(true)
    setInfo('Analyzing requirement to recommend test techniques...')
    setAnalysis(null); setAnalysisMeta(null); setSelectedTechniques({})
    setSuite(null); setSuiteMeta(null); setSelectedSkills([]); setDuplicateGroups([]); setAioResult('')
    try {
      try { analyzeAbortRef.current && analyzeAbortRef.current.abort() } catch {}
      const controller = new AbortController()
      analyzeAbortRef.current = controller
      const fd = new FormData()
      fd.set('provider', provider); fd.set('model', model); fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)
      const analysisResult = data.analysis || {}
      setAnalysis(analysisResult)
      setAnalysisMeta({ provider: data.provider, model: data.model, repaired: Boolean(data.repaired) })
      const recs = Array.isArray(analysisResult.techniqueRecommendations) ? analysisResult.techniqueRecommendations : []
      const initialSelection = {}
      for (const r of recs) { initialSelection[r.skillId] = r.confidence === 'high' || r.confidence === 'medium' }
      setSelectedTechniques(initialSelection)
      setSuccess(`Analysis done. ${recs.length} technique(s) recommended. Review and generate.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) { setInfo('Cancelled.') }
      else { setError(err && err.message ? err.message : String(err)) }
    } finally { analyzeAbortRef.current = null; setBusy(false) }
  }

  async function callGenerateFromAnalysis() {
    const skillIds = Object.entries(selectedTechniques).filter(([, v]) => v).map(([k]) => k)
    if (skillIds.length === 0) { setError('Select at least one technique.'); return }
    setBusy(true)
    setInfo(`Generating test scenarios using ${skillIds.length} technique(s) in parallel...`)
    setSuite(null); setSuiteMeta(null); setSelectedSkills([]); setDuplicateGroups([]); setSkillDiagrams([]); setAioResult('')
    try {
      try { generateAbortRef.current && generateAbortRef.current.abort() } catch {}
      const controller = new AbortController()
      generateAbortRef.current = controller
      const fd = new FormData()
      fd.set('provider', provider); fd.set('model', model); fd.set('depth', depth); fd.set('requirementText', requirementText)
      if (requirementFile) fd.set('requirementFile', requirementFile)
      fd.set('selectedSkills', JSON.stringify(skillIds))
      const diagramSkillIds = Object.entries(selectedDiagrams).filter(([, v]) => v).map(([k]) => k)
      if (diagramSkillIds.length > 0) fd.set('diagramSkills', JSON.stringify(diagramSkillIds))
      if (analysis && Array.isArray(analysis.extractedElements)) fd.set('analysisContext', JSON.stringify(analysis.extractedElements))
      const clarifications = buildClarifications()
      if (clarifications) fd.set('clarifications', clarifications)
      const res = await fetch('/api/generate-tests', { method: 'POST', body: fd, signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)
      setSuite(data.suite || null)
      setSelectedSkills(Array.isArray(data.selectedSkills) ? data.selectedSkills : [])
      setSuiteMeta({ provider: data.provider, model: data.model, depth: data.depth, repaired: Boolean(data.repaired), mode: data.mode || 'per-skill' })
      setDuplicateGroups(Array.isArray(data.duplicateGroups) ? data.duplicateGroups : [])
      setSkillDiagrams(Array.isArray(data.skillDiagrams) ? data.skillDiagrams : [])
      const count = data.suite && Array.isArray(data.suite.testCases) ? data.suite.testCases.length : 0
      const dupCount = Array.isArray(data.duplicateGroups) ? data.duplicateGroups.length : 0
      const errors = Array.isArray(data.skillErrors) ? data.skillErrors : []
      let msg = `Done. Generated ${count} test cases via ${skillIds.length} technique(s).`
      if (dupCount > 0) msg += ` ${dupCount} duplicate(s) removed.`
      if (errors.length > 0) msg += ` ${errors.length} skill(s) had errors.`
      setSuccess(msg)
      goToStep(2)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) { setInfo('Cancelled.') }
      else { setError(err && err.message ? err.message : String(err)) }
    } finally { generateAbortRef.current = null; setBusy(false) }
  }

  async function pushToAio() {
    if (!suite || !Array.isArray(suite.testCases) || suite.testCases.length === 0) {
      setError('No test suite to push.'); return
    }
    if (!aioProject.trim()) { setError('Enter a Jira Project ID.'); return }
    const casesToPush = suite.testCases.filter((tc) => selectedCaseIds.has(String(tc.id)))
    if (casesToPush.length === 0) { setError('No test cases selected. Check at least one test case to push.'); return }
    setAioBusy(true); setAioResult(''); setInfo('Pushing to AIO...')
    try {
      try { aioAbortRef.current && aioAbortRef.current.abort() } catch {}
      const controller = new AbortController()
      aioAbortRef.current = controller
      const body = {
        jiraProjectId: aioProject.trim(),
        suite: { ...suite, testCases: casesToPush },
        folderPath: aioFolder.trim() || undefined,
        aioToken: aioToken.trim() || undefined,
        includeCoverageTags: aioIncludeTags
      }
      const res = await fetch('/api/push-to-aio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)
      const pushed = data.created || 0
      setAioResult(`Pushed ${pushed} test case(s) to AIO project ${aioProject}.${data.folderId ? ` Folder ID: ${data.folderId}` : ''}`)
      setSuccess(`AIO push complete. ${pushed} test case(s) created.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) { setInfo('Cancelled.') }
      else { setError(err && err.message ? err.message : String(err)); setAioResult(`Error: ${err.message}`) }
    } finally { aioAbortRef.current = null; setAioBusy(false) }
  }

  // Filtered + paginated cases
  const filteredCases = useMemo(() => {
    const cases = suite && Array.isArray(suite.testCases) ? suite.testCases : []
    const q = search.trim().toLowerCase()
    let out = cases.slice()
    if (filterType) out = out.filter((t) => String(t.type || '') === filterType)
    if (filterPriority) out = out.filter((t) => String(t.priority || '') === filterPriority)
    if (q) {
      out = out.filter((t) => {
        const hay = [t.id, t.title, Array.isArray(t.coverageTags) ? t.coverageTags.join(' ') : '', Array.isArray(t.requirementRefs) ? t.requirementRefs.join(' ') : ''].join(' ').toLowerCase()
        return hay.includes(q)
      })
    }
    return out
  }, [suite, search, filterType, filterPriority])

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / rowsPerPage))
  const paginatedCases = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredCases.slice(start, start + rowsPerPage)
  }, [filteredCases, page, rowsPerPage])

  useEffect(() => { setPage(1) }, [search, filterType, filterPriority, suite])

  function handleStartOver() {
    cancelInFlight()
    setPreflight(null); setPreflightSkills([]); setAnswersByQuestion({})
    setAnalysis(null); setAnalysisMeta(null); setSelectedTechniques({}); setSelectedDiagrams({})
    setSuite(null); setSuiteMeta(null); setSelectedSkills([]); setDuplicateGroups([]); setSkillDiagrams([])
    setAioResult(''); setStatus(''); setSearch(''); setFilterType(''); setFilterPriority('')
    goToStep(0)
  }

  const stepCompleted = {
    0: hasAnyRequirements && Boolean(provider && model),
    1: Boolean(analysis) || Boolean(suite),
    2: Boolean(suite)
  }

  const canGoNext = () => {
    if (activeStep === 0) return hasAnyRequirements && Boolean(provider && model)
    if (activeStep === 1) return Boolean(analysis) || Boolean(suite)
    return false
  }

  const stepContent = [
    () => (
      <StepRequirements
        theme={theme} isSmDown={isSmDown}
        provider={provider} setProvider={setProvider}
        model={model} setModel={setModel}
        requirementText={requirementText} setRequirementText={setRequirementText}
        requirementFile={requirementFile} setRequirementFile={setRequirementFile}
        fileInputRef={fileInputRef}
        dragOver={dragOver} setDragOver={setDragOver}
        reqInputTab={reqInputTab} setReqInputTab={setReqInputTab}
        jiraConfigured={jiraConfigured}
        jiraProjects={jiraProjects} jiraProject={jiraProject} setJiraProject={setJiraProject}
        jiraEpics={jiraEpics} jiraSprints={jiraSprints}
        jiraEpicFilter={jiraEpicFilter} setJiraEpicFilter={setJiraEpicFilter}
        jiraSprintFilter={jiraSprintFilter} setJiraSprintFilter={setJiraSprintFilter}
        jiraStatusFilter={jiraStatusFilter} setJiraStatusFilter={setJiraStatusFilter}
        jiraSearch={jiraSearch} setJiraSearch={setJiraSearch}
        jiraStories={jiraStories} setJiraStories={setJiraStories}
        jiraSelectedKeys={jiraSelectedKeys} setJiraSelectedKeys={setJiraSelectedKeys}
        jiraLoading={jiraLoading}
        fetchJiraStories={fetchJiraStories}
        useSelectedJiraStories={useSelectedJiraStories}
        acceptDroppedFile={acceptDroppedFile}
        cancelInFlight={cancelInFlight}
        setInfo={setInfo}
      />
    ),
    () => (
      <StepAnalyze
        theme={theme}
        busy={busy}
        hasAnyRequirements={hasAnyRequirements}
        preflight={preflight} answersByQuestion={answersByQuestion} setAnswersByQuestion={setAnswersByQuestion}
        preflightSkills={preflightSkills}
        callPreflight={callPreflight}
        analysis={analysis} analysisMeta={analysisMeta}
        selectedTechniques={selectedTechniques} setSelectedTechniques={setSelectedTechniques}
        selectedDiagrams={selectedDiagrams} setSelectedDiagrams={setSelectedDiagrams}
        jiraImportedCount={jiraImportedCount}
        callAnalyze={callAnalyze}
        callGenerateFromAnalysis={callGenerateFromAnalysis}
        cancelInFlight={cancelInFlight}
        setInfo={setInfo}
        setAnalysis={setAnalysis} setAnalysisMeta={setAnalysisMeta}
      />
    ),
    () => (
      <StepResults
        theme={theme} isSmDown={isSmDown}
        suite={suite} suiteMeta={suiteMeta} selectedSkills={selectedSkills}
        duplicateGroups={duplicateGroups}
        skillDiagrams={skillDiagrams}
        search={search} setSearch={setSearch}
        filterType={filterType} setFilterType={setFilterType}
        filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        filteredCases={filteredCases} paginatedCases={paginatedCases}
        page={page} setPage={setPage} totalPages={totalPages}
        rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
        selectedCaseIds={selectedCaseIds} setSelectedCaseIds={setSelectedCaseIds}
        aioProject={aioProject} setAioProject={setAioProject}
        aioFolder={aioFolder} setAioFolder={setAioFolder}
        aioToken={aioToken} setAioToken={setAioToken}
        aioIncludeTags={aioIncludeTags} setAioIncludeTags={setAioIncludeTags}
        aioBusy={aioBusy} aioResult={aioResult}
        pushToAio={pushToAio}
        setDiagramDialogOpen={setDiagramDialogOpen} setActiveDiagram={setActiveDiagram} setDiagramZoom={setDiagramZoom}
        goToStep={goToStep}
      />
    ),
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
            backgroundColor: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.20), 0 18px 60px rgba(0,0,0,0.40)',
                  display: 'grid', placeItems: 'center'
                }}
              >
                <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }} aria-hidden>{appLogo}</Box>
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
                boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.18)',
                '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
              }}
            >
              Loaded skills
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 4, md: 6 } }}>
          <Box sx={{ maxWidth: 1600, mx: 'auto', px: { md: 3, lg: 3 } }}>

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
                  onClick={() => { if (!busy) goToStep(index) }}
                >
                  <StepLabel StepIconComponent={AnimatedStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {status.trim().length > 0 ? (
              <Alert severity={statusSeverity} variant="outlined" sx={{ mb: 2.5 }}>
                {status}
              </Alert>
            ) : null}

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
                      '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
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
                      '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
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
                      boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
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

      <DiagramDialog
        theme={theme}
        open={diagramDialogOpen}
        onClose={() => { setDiagramDialogOpen(false); setActiveDiagram(null) }}
        activeDiagram={activeDiagram}
        diagramZoom={diagramZoom}
        setDiagramZoom={setDiagramZoom}
      />
    </ThemeProvider>
  )
}
