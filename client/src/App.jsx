import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Fade,
  IconButton,
  Slide,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'

import { purple, buildTheme, ColorModeContext, loadThemeMode, saveThemeMode, modelOptions, defaultModel } from './theme'

const API = import.meta.env.VITE_API_URL || ''
import StepRequirements from './StepRequirements'
import StepAnalyze from './StepAnalyze'
import StepResults from './StepResults'
import DiagramDialog from './DiagramDialog'

// ─── API key helpers ───

const KEY_STORAGE = 'ai-test-gen:apikey'

function loadApiKey() {
  try {
    const raw = sessionStorage.getItem(KEY_STORAGE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveApiKey(data) {
  try { sessionStorage.setItem(KEY_STORAGE, JSON.stringify(data)) } catch {}
}

/** Detect provider from API key prefix */
function detectProvider(key) {
  const k = String(key || '')
  if (k.startsWith('sk-ant-')) return 'anthropic'
  if (k.startsWith('sk-')) return 'openai'
  if (k.startsWith('AIza')) return 'gemini'
  return null
}

/** Fetch wrapper that attaches the API key header */
function createApiFetch(getApiKey) {
  return async function apiFetch(url, opts = {}) {
    const apiKey = getApiKey()
    const headers = { ...(opts.headers || {}) }
    if (apiKey) headers['X-LLM-API-Key'] = apiKey
    return fetch(url, { ...opts, headers })
  }
}

const STEPS = ['Requirements', 'Analyze', 'Results']

export default function App() {
  const appLogo = '/test-cases.png'

  // ─── Theme mode ───
  const [themeMode, setThemeMode] = useState(loadThemeMode)
  const colorModeValue = useMemo(() => ({
    mode: themeMode,
    toggleColorMode: () => {
      setThemeMode((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark'
        saveThemeMode(next)
        document.body.setAttribute('data-theme', next)
        return next
      })
    },
  }), [themeMode])

  // Set data-theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode)
  }, [])

  // ─── API key state ───
  const savedKey = loadApiKey()
  const [apiKey, setApiKey] = useState(savedKey ? savedKey.apiKey || '' : '')
  const [apiKeyValidated, setApiKeyValidated] = useState(false)
  const [apiKeyModels, setApiKeyModels] = useState([])
  const apiKeyRef = useRef(apiKey)
  useEffect(() => { apiKeyRef.current = apiKey }, [apiKey])

  // Server-configured providers (detected on mount)
  const [serverProviders, setServerProviders] = useState({ llm: {}, jira: false })
  const [serverProvidersLoaded, setServerProvidersLoaded] = useState(false)

  // Jira credentials (when not server-configured)
  const [jiraBaseUrl, setJiraBaseUrl] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')

  // Persist API key to sessionStorage
  useEffect(() => {
    if (apiKey) saveApiKey({ apiKey })
  }, [apiKey])

  const apiFetch = useCallback(
    createApiFetch(() => apiKeyRef.current),
    []
  )

  /** Build headers for Jira API calls (merges user-provided Jira credentials) */
  function jiraHeaders() {
    const h = {}
    if (apiKeyRef.current) h['X-LLM-API-Key'] = apiKeyRef.current
    if (jiraBaseUrl.trim()) h['X-Jira-Base-URL'] = jiraBaseUrl.trim()
    if (jiraEmail.trim()) h['X-Jira-Email'] = jiraEmail.trim()
    if (jiraToken.trim()) h['X-Jira-Token'] = jiraToken.trim()
    return h
  }

  // Detect server-configured providers on mount
  useEffect(() => {
    fetch(`${API}/api/providers`).then((r) => r.json()).then((data) => {
      setServerProviders(data)
      setServerProvidersLoaded(true)

      // If server has an LLM key, auto-select that provider and fetch models
      const llm = data.llm || {}
      const serverProvider = llm.openai ? 'openai' : llm.anthropic ? 'anthropic' : llm.gemini ? 'gemini' : null
      if (serverProvider && !apiKey) {
        setProvider(serverProvider)
        // Fetch models using server key (no apiKey needed)
        fetch(`${API}/api/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: serverProvider })
        }).then((r) => r.json()).then((mData) => {
          const models = Array.isArray(mData.models) ? mData.models : []
          setApiKeyModels(models)
          setApiKeyValidated(true)
          if (models.length > 0) {
            const fallback = (modelOptions[serverProvider] || [])[0]
            setModel(fallback && models.includes(fallback.value) ? fallback.value : models[0])
          }
        }).catch(() => {})
      }
    }).catch(() => { setServerProvidersLoaded(true) })
  }, [])

  const theme = useMemo(() => buildTheme(themeMode), [themeMode])
  const isDark = themeMode === 'dark'

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
  const [aioBaseUrl, setAioBaseUrl] = useState('')
  const [aioToken, setAioToken] = useState('')
  const [aioIncludeTags, setAioIncludeTags] = useState(false)
  const [aioBusy, setAioBusy] = useState(false)
  const [aioResult, setAioResult] = useState('')
  const [aioStatus, setAioStatus] = useState(null) // 'success' | 'error' | null
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set())

  // Initialize checkboxes when suite changes
  useEffect(() => {
    if (suite && Array.isArray(suite.testCases)) {
      setSelectedCaseIds(new Set(suite.testCases.map((tc) => String(tc.id))))
    }
  }, [suite])

  // Check Jira config: server-configured on mount, or user-provided on connect
  // When throwOnFail is true (user clicked Connect), throw on failure so the UI can show an error.
  async function checkJiraAndLoadProjects(throwOnFail) {
    const h = jiraHeaders()
    const res = await fetch(`${API}/api/jira/status`, { headers: h })
    const d = await res.json()
    if (d && d.configured) {
      setJiraConfigured(true)
      try {
        const pRes = await fetch(`${API}/api/jira/projects`, { headers: h })
        const p = await pRes.json()
        if (Array.isArray(p.projects)) setJiraProjects(p.projects)
      } catch {}
    } else {
      setJiraConfigured(false)
      if (throwOnFail) throw new Error(d.error || 'Jira connection failed — check your credentials')
    }
  }

  // Check on mount (server .env config)
  useEffect(() => { checkJiraAndLoadProjects() }, [])

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

    const h = jiraHeaders()
    fetch(`${API}/api/jira/epics?project=${encodeURIComponent(jiraProject)}`, { headers: h }).then((r) => r.json()).then((d) => {
      if (Array.isArray(d.epics)) setJiraEpics(d.epics)
    }).catch(() => {})
    fetch(`${API}/api/jira/sprints?project=${encodeURIComponent(jiraProject)}`, { headers: h }).then((r) => r.json()).then((d) => {
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
    fetch(`${API}/api/jira/stories?${params}`, { headers: jiraHeaders() }).then((r) => r.json()).then((d) => {
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
      const res = await fetch(`${API}/api/jira/story-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...jiraHeaders() },
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
      const res = await apiFetch(`${API}/api/preflight`, { method: 'POST', body: fd, signal: controller.signal })
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
      const res = await apiFetch(`${API}/api/analyze`, { method: 'POST', body: fd, signal: controller.signal })
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
      const res = await apiFetch(`${API}/api/generate-tests`, { method: 'POST', body: fd, signal: controller.signal })
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
    setAioBusy(true); setAioResult(''); setAioStatus(null); setInfo('Pushing to AIO...')
    try {
      try { aioAbortRef.current && aioAbortRef.current.abort() } catch {}
      const controller = new AbortController()
      aioAbortRef.current = controller
      const body = {
        jiraProjectId: aioProject.trim(),
        suite: { ...suite, testCases: casesToPush },
        folderPath: aioFolder.trim() || undefined,
        aioBaseUrl: aioBaseUrl.trim() || undefined,
        aioToken: aioToken.trim() || undefined,
        includeCoverageTags: aioIncludeTags
      }
      const res = await apiFetch(`${API}/api/push-to-aio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data && data.error) || `Request failed: ${res.status}`)
      const pushed = data.created || 0
      setAioResult(`Pushed ${pushed} test case(s) to AIO project ${aioProject}.${data.folderId ? ` Folder ID: ${data.folderId}` : ''}`)
      setAioStatus('success')
      setSuccess(`AIO push complete. ${pushed} test case(s) created.`)
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('aborted'))) { setInfo('Cancelled.') }
      else { setError(err && err.message ? err.message : String(err)); setAioResult(`Error: ${err.message}`); setAioStatus('error') }
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

  const llmProviders = serverProviders && serverProviders.llm ? serverProviders.llm : {}
  const hasApiKey = Boolean(apiKey.trim()) || Boolean(llmProviders[provider])

  const stepCompleted = {
    0: hasAnyRequirements && Boolean(provider && model) && hasApiKey,
    1: Boolean(analysis) || Boolean(suite),
    2: Boolean(suite)
  }

  const canGoNext = () => {
    if (activeStep === 0) return hasAnyRequirements && Boolean(provider && model) && hasApiKey
    if (activeStep === 1) return Boolean(analysis) || Boolean(suite)
    return false
  }

  const stepContent = [
    () => (
      <StepRequirements
        theme={theme} isSmDown={isSmDown}
        provider={provider} setProvider={setProvider}
        model={model} setModel={setModel}
        apiKey={apiKey} setApiKey={setApiKey}
        apiKeyValidated={apiKeyValidated} setApiKeyValidated={setApiKeyValidated}
        apiKeyModels={apiKeyModels} setApiKeyModels={setApiKeyModels}
        requirementText={requirementText} setRequirementText={setRequirementText}
        requirementFile={requirementFile} setRequirementFile={setRequirementFile}
        fileInputRef={fileInputRef}
        dragOver={dragOver} setDragOver={setDragOver}
        reqInputTab={reqInputTab} setReqInputTab={setReqInputTab}
        serverProviders={serverProviders} serverProvidersLoaded={serverProvidersLoaded}
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
        jiraBaseUrl={jiraBaseUrl} setJiraBaseUrl={setJiraBaseUrl}
        jiraEmail={jiraEmail} setJiraEmail={setJiraEmail}
        jiraToken={jiraToken} setJiraToken={setJiraToken}
        checkJiraAndLoadProjects={checkJiraAndLoadProjects}
        fetchJiraStories={fetchJiraStories}
        useSelectedJiraStories={useSelectedJiraStories}
        acceptDroppedFile={acceptDroppedFile}
        cancelInFlight={cancelInFlight}
        setInfo={setInfo} setError={setError}
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
        aioBaseUrl={aioBaseUrl} setAioBaseUrl={setAioBaseUrl}
        aioToken={aioToken} setAioToken={setAioToken}
        aioIncludeTags={aioIncludeTags} setAioIncludeTags={setAioIncludeTags}
        aioServerConfigured={serverProviders && serverProviders.aio}
        aioBusy={aioBusy} aioResult={aioResult} aioStatus={aioStatus}
        pushToAio={pushToAio}
        setDiagramDialogOpen={setDiagramDialogOpen} setActiveDiagram={setActiveDiagram} setDiagramZoom={setDiagramZoom}
        goToStep={goToStep}
      />
    ),
  ]

  return (
    <ColorModeContext.Provider value={colorModeValue}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100dvh',
        backgroundColor: 'background.default',
        background: isDark
          ? `radial-gradient(ellipse at 15% 15%, rgba(124,58,237,0.14) 0%, transparent 45%),
             radial-gradient(ellipse at 85% 75%, rgba(167,139,250,0.09) 0%, transparent 45%),
             radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.07) 0%, transparent 40%),
             #0a0a0a`
          : `radial-gradient(ellipse at 15% 15%, rgba(124,58,237,0.08) 0%, transparent 45%),
             radial-gradient(ellipse at 85% 75%, rgba(167,139,250,0.06) 0%, transparent 45%),
             radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.04) 0%, transparent 40%),
             #faf8ff`,
      }}>

        {/* ─── Floating Glassmorphism Header ─── */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 12,
            left: 16,
            right: 16,
            width: 'auto',
            borderRadius: 4,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(10,10,10,0.72)' : 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            willChange: 'transform',
            boxShadow: isDark
              ? '0 4px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 4px 30px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box
                component="img"
                src={appLogo}
                alt="TestPilot AI"
                sx={{
                  width: 34, height: 34, borderRadius: 2,
                  objectFit: 'contain',
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <Typography variant="h6" sx={{ lineHeight: 1.1, color: 'text.primary', fontWeight: 700 }} noWrap>
                  TestPilot AI
                </Typography>
                <Box sx={{
                  px: 1.2,
                  py: 0.25,
                  borderRadius: 99,
                  backgroundColor: isDark ? 'rgba(167, 139, 250, 0.12)' : 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(167, 139, 250, 0.20)' : 'rgba(124, 58, 237, 0.15)',
                  display: { xs: 'none', sm: 'block' },
                }}>
                  <Typography sx={{
                    fontFamily: theme.typography.fontFamilyMonospace,
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isDark ? purple[400] : purple[600],
                    fontWeight: 600,
                    lineHeight: 1.6,
                  }}>
                    intelligent test design
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component="a"
                href={`${API}/api/skills`}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 99,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                  color: 'text.primary',
                  fontSize: '0.8rem',
                  px: 2,
                  '&:hover': { borderColor: purple[500], backgroundColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.06)' },
                }}
              >
                Loaded skills
              </Button>

              <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                  onClick={colorModeValue.toggleColorMode}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                    borderRadius: 99,
                    width: 36,
                    height: 36,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: purple[500],
                      borderColor: purple[500],
                      backgroundColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.06)',
                    },
                  }}
                >
                  {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* ─── Main Content ─── */}
        <Container maxWidth={false} sx={{ pt: 10, pb: 3, px: { xs: 2, sm: 4, md: 8 } }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

            {/* ─── Segmented Progress Stepper ─── */}
            <Box sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              willChange: 'transform',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              boxShadow: isDark
                ? '0 2px 12px rgba(0,0,0,0.30)'
                : '0 2px 12px rgba(124,58,237,0.06)',
              mb: 4,
            }}>
              {STEPS.map((label, index) => (
                <Box
                  key={label}
                  onClick={() => { if (!busy) goToStep(index) }}
                  sx={{
                    flex: 1,
                    py: 1,
                    px: 2,
                    borderRadius: 2.5,
                    cursor: busy ? 'default' : 'pointer',
                    textAlign: 'center',
                    backgroundColor: index <= activeStep
                      ? (index === activeStep
                        ? `linear-gradient(135deg, ${purple[500]}, ${purple[700]})`
                        : purple[500])
                      : 'transparent',
                    background: index === activeStep
                      ? `linear-gradient(135deg, ${purple[500]}, ${purple[700]})`
                      : index < activeStep
                        ? purple[600]
                        : 'transparent',
                    color: index <= activeStep ? '#fff' : 'text.secondary',
                    fontWeight: index === activeStep ? 700 : 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none',
                    '&:hover': !busy ? {
                      backgroundColor: index <= activeStep
                        ? undefined
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    } : {},
                  }}
                >
                  {index + 1}. {label}
                </Box>
              ))}
            </Box>

            {/* ─── Status Alert ─── */}
            {status.trim().length > 0 ? (
              <Alert
                severity={statusSeverity}
                variant="outlined"
                sx={{
                  mb: 2.5,
                  borderRadius: 3,
                  '& .MuiAlert-icon': { fontSize: 20 },
                }}
              >
                {status}
              </Alert>
            ) : null}

            {/* ─── Step Content with Slide Animation ─── */}
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

            {/* ─── Navigation Buttons ─── */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Stack direction="row" spacing={1}>
                {activeStep > 0 && (
                  <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    disabled={busy}
                    onClick={() => goToStep(Math.max(0, activeStep - 1))}
                    sx={{
                      borderRadius: 99,
                      color: 'text.secondary',
                      px: 2.5,
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: 'text.primary',
                      },
                    }}
                  >
                    Back
                  </Button>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                {activeStep === 2 && suite && (
                  <Button
                    variant="text"
                    startIcon={<RestartAltIcon />}
                    onClick={handleStartOver}
                    sx={{
                      borderRadius: 99,
                      color: 'text.secondary',
                      px: 2.5,
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
                        color: '#ef4444',
                      },
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
                      borderRadius: 99,
                      backgroundImage: `linear-gradient(135deg, ${purple[500]}, ${purple[700]})`,
                      backgroundColor: purple[600],
                      color: '#fff',
                      px: 3,
                      boxShadow: `0 0 0 1px ${purple[500]}33, 0 8px 24px ${isDark ? 'rgba(0,0,0,0.45)' : 'rgba(124,58,237,0.20)'}`,
                      '&:hover': {
                        backgroundImage: `linear-gradient(135deg, ${purple[600]}, ${purple[800]})`,
                        boxShadow: `0 0 0 1px ${purple[500]}55, 0 12px 32px ${isDark ? 'rgba(0,0,0,0.55)' : 'rgba(124,58,237,0.30)'}`,
                      },
                      '&.Mui-disabled': {
                        backgroundImage: 'none',
                      },
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
    </ColorModeContext.Provider>
  )
}
