import React, { useEffect, useRef, useState } from 'react'
import {
  Alert, Autocomplete,
  Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Collapse, Divider,
  FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack,
  Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LinkIcon from '@mui/icons-material/Link'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditNoteIcon from '@mui/icons-material/EditNote'
import { purple, modelOptions, defaultModel } from './theme'

const API = import.meta.env.VITE_API_URL || ''

/** Detect provider from API key prefix */
function detectProvider(key) {
  const k = String(key || '')
  if (k.startsWith('sk-ant-')) return 'anthropic'
  if (k.startsWith('sk-')) return 'openai'
  if (k.startsWith('AIza')) return 'gemini'
  return null
}

const providerLabel = (p) =>
  p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : p === 'gemini' ? 'Gemini' : ''

export default function StepRequirements({
  theme,
  isSmDown,
  provider, setProvider,
  model, setModel,
  apiKey, setApiKey,
  apiKeyValidated, setApiKeyValidated,
  apiKeyModels, setApiKeyModels,
  serverProviders, serverProvidersLoaded,
  requirementText, setRequirementText,
  requirementFile, setRequirementFile,
  fileInputRef,
  dragOver, setDragOver,
  reqInputTab, setReqInputTab,
  jiraConfigured,
  jiraProjects, jiraProject, setJiraProject,
  jiraEpics, jiraSprints,
  jiraEpicFilter, setJiraEpicFilter,
  jiraSprintFilter, setJiraSprintFilter,
  jiraStatusFilter, setJiraStatusFilter,
  jiraSearch, setJiraSearch,
  jiraStories, setJiraStories,
  jiraSelectedKeys, setJiraSelectedKeys,
  jiraLoading,
  jiraBaseUrl, setJiraBaseUrl,
  jiraEmail, setJiraEmail,
  jiraToken, setJiraToken,
  checkJiraAndLoadProjects,
  fetchJiraStories,
  useSelectedJiraStories,
  acceptDroppedFile,
  cancelInFlight,
  setInfo, setError,
}) {
  const [showKey, setShowKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const [jiraConnecting, setJiraConnecting] = useState(false)
  const [showJiraToken, setShowJiraToken] = useState(false)
  const [jiraConnectStatus, setJiraConnectStatus] = useState(null)
  const [jiraConnectMessage, setJiraConnectMessage] = useState('')

  // Collapsible AI section
  const [aiSectionOpen, setAiSectionOpen] = useState(true)
  const hasAutoCollapsed = useRef(false)

  const isDark = theme.palette.mode === 'dark'

  const llmProviders = serverProviders && serverProviders.llm ? serverProviders.llm : {}
  const serverHasKey = serverProvidersLoaded && llmProviders[provider]
  const usingServerKey = serverHasKey && !apiKey.trim()
  const hasUserKey = Boolean(apiKey.trim())
  const jiraServerConfigured = serverProviders && serverProviders.jira
  const jiraUserConfigured = jiraBaseUrl.trim() && jiraEmail.trim() && jiraToken.trim()
  const showJiraTab = jiraConfigured

  // Auto-collapse AI section once server key is validated
  useEffect(() => {
    if (usingServerKey && apiKeyValidated && !hasAutoCollapsed.current) {
      setAiSectionOpen(false)
      hasAutoCollapsed.current = true
    }
  }, [usingServerKey, apiKeyValidated])

  const allProviders = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'gemini', label: 'Google Gemini' },
  ]
  const providerOptions = hasUserKey
    ? allProviders
    : allProviders.filter((p) => llmProviders[p.value])

  async function validateAndFetchModels(key, prov) {
    if (!key || !prov) return
    setValidating(true)
    setApiKeyValidated(false)
    setApiKeyModels([])
    try {
      const vRes = await fetch(`${API}/api/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: prov })
      })
      const vData = await vRes.json()
      if (!vData.valid) {
        setError(vData.error || 'Invalid API key')
        setApiKeyValidated(false)
        return
      }
      const mRes = await fetch(`${API}/api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: prov })
      })
      const mData = await mRes.json()
      const models = Array.isArray(mData.models) ? mData.models : []
      setApiKeyValidated(true)
      setApiKeyModels(models)
      const fallback = (modelOptions[prov] || [])[0]
      if (fallback && models.includes(fallback.value)) {
        setModel(fallback.value)
      } else if (models.length > 0) {
        setModel(models[0])
      }
      setInfo(`Key validated. ${models.length} model(s) available.`)
    } catch (err) {
      setError(err.message || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  function handleKeyChange(e) {
    const key = e.target.value
    setApiKey(key)
    setApiKeyValidated(false)
    setApiKeyModels([])
    const detected = detectProvider(key)
    if (detected && detected !== provider) {
      setProvider(detected)
      setModel(defaultModel(detected))
    }
    if (!key.trim()) {
      const serverProv = llmProviders.openai ? 'openai' : llmProviders.anthropic ? 'anthropic' : llmProviders.gemini ? 'gemini' : null
      if (serverProv) {
        setProvider(serverProv)
        setModel(defaultModel(serverProv))
        fetch(`${API}/api/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: serverProv })
        }).then((r) => r.json()).then((mData) => {
          const models = Array.isArray(mData.models) ? mData.models : []
          setApiKeyModels(models)
          setApiKeyValidated(true)
          const fallback = (modelOptions[serverProv] || [])[0]
          if (fallback && models.includes(fallback.value)) setModel(fallback.value)
          else if (models.length > 0) setModel(models[0])
        }).catch(() => {})
      }
    }
  }

  async function handleProviderChange(e) {
    const p = e.target.value
    setProvider(p)
    setModel(defaultModel(p))
    setApiKeyValidated(false)
    setApiKeyModels([])
    if (!apiKey.trim() && llmProviders[p]) {
      try {
        const mRes = await fetch(`${API}/api/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: p })
        })
        const mData = await mRes.json()
        const models = Array.isArray(mData.models) ? mData.models : []
        setApiKeyModels(models)
        setApiKeyValidated(true)
        const fallback = (modelOptions[p] || [])[0]
        if (fallback && models.includes(fallback.value)) setModel(fallback.value)
        else if (models.length > 0) setModel(models[0])
      } catch {}
    }
  }

  const modelItems = apiKeyModels.length > 0
    ? apiKeyModels.map((m) => {
        const hardcoded = (modelOptions[provider] || []).find((o) => o.value === m)
        return { value: m, label: hardcoded ? hardcoded.label : m }
      })
    : (modelOptions[provider] || [])

  // Word count for the textarea
  const wordCount = requirementText.trim() ? requirementText.trim().split(/\s+/).length : 0

  // Resolved model label for the collapsed summary chip
  const activeModelItem = modelItems.find((m) => m.value === model)
  const modelLabel = activeModelItem ? activeModelItem.label : model

  // AI section is "ready" when we have a validated key (server or user)
  const aiReady = apiKeyValidated || usingServerKey

  // Theme-aware color helpers
  const purpleAccent = isDark ? purple[500] : purple[600]
  const purpleBgSubtle = isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.06)'
  const purpleBgFaint = isDark ? 'rgba(167, 139, 250, 0.03)' : 'rgba(124, 58, 237, 0.03)'
  const purpleBorder = isDark ? 'rgba(167, 139, 250, 0.20)' : 'rgba(124, 58, 237, 0.18)'
  const purpleBorderHover = isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(124, 58, 237, 0.22)'
  const greenSuccess = '#4ade80'
  const alertMsgColor = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)'
  const alertInfoBorder = isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(124, 58, 237, 0.20)'
  const alertInfoBg = isDark ? 'rgba(167, 139, 250, 0.04)' : 'rgba(124, 58, 237, 0.04)'
  const alertSuccessBorder = isDark ? 'rgba(74, 222, 128, 0.25)' : 'rgba(22, 163, 74, 0.20)'
  const alertSuccessBg = isDark ? 'rgba(74, 222, 128, 0.04)' : 'rgba(22, 163, 74, 0.04)'
  const alertErrorBorder = isDark ? 'rgba(239, 68, 68, 0.30)' : 'rgba(220, 38, 38, 0.25)'
  const alertErrorBg = isDark ? 'rgba(239, 68, 68, 0.04)' : 'rgba(220, 38, 38, 0.04)'

  return (
    <Card
      sx={{
        overflow: 'visible',
        borderColor: purpleBorder,
      }}
    >
      <CardContent sx={{ p: '0 !important' }}>

        {/* ─── Section 1: Collapsible AI Provider ─── */}
        <Box
          onClick={() => setAiSectionOpen((o) => !o)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mx: 2.5,
            mt: 2.5,
            mb: aiSectionOpen ? 0 : 2.5,
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: 3,
            border: '1px solid',
            borderColor: aiSectionOpen ? purpleBorder : 'divider',
            backgroundColor: aiSectionOpen ? purpleBgFaint : 'transparent',
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: purpleBgSubtle,
              borderColor: purpleBorderHover,
            },
          }}
        >
          <ExpandMoreIcon
            sx={{
              color: 'text.secondary',
              fontSize: 20,
              transform: aiSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            AI Provider
          </Typography>

          {/* Status chips when collapsed */}
          {!aiSectionOpen && aiReady && (
            <Chip
              size="small"
              icon={<CheckCircleIcon sx={{ color: `${greenSuccess} !important`, fontSize: 14 }} />}
              label={`${providerLabel(provider)} · ${modelLabel}`}
              sx={{
                height: 26,
                fontSize: '0.76rem',
                fontFamily: theme.typography.fontFamilyMonospace,
                borderColor: alertSuccessBorder,
                backgroundColor: alertSuccessBg,
                color: 'text.secondary',
                '& .MuiChip-icon': { ml: 0.5 },
              }}
              variant="outlined"
            />
          )}
          {!aiSectionOpen && !aiReady && (
            <Chip
              size="small"
              label="Not configured"
              sx={{
                height: 26,
                fontSize: '0.76rem',
                borderColor: alertErrorBorder,
                backgroundColor: alertErrorBg,
                color: 'rgba(239, 68, 68, 0.8)',
              }}
              variant="outlined"
            />
          )}

          <Box sx={{ flex: 1 }} />
        </Box>

        <Collapse in={aiSectionOpen} timeout={300}>
          <Box sx={{ px: 3, pt: 2, pb: 3 }}>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: -0.5 }}>
                {providerOptions.length > 0 && !hasUserKey
                  ? 'Server-configured providers are ready to use. You can also enter your own API key to override.'
                  : 'Enter your API key — the provider is auto-detected from the key prefix.'}
              </Typography>

              {/* Server key indicator */}
              {usingServerKey && (
                <Alert
                  severity="success"
                  variant="outlined"
                  icon={<CheckCircleIcon sx={{ color: greenSuccess }} />}
                  sx={{
                    borderColor: alertSuccessBorder,
                    backgroundColor: alertSuccessBg,
                    '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' },
                  }}
                >
                  Server has an API key configured for <strong>{providerLabel(provider)}</strong>. You can use it as-is or enter your own key below to override.
                </Alert>
              )}

              {/* Trust banner */}
              {!usingServerKey && (
                <Alert
                  severity="info"
                  variant="outlined"
                  icon={<InfoOutlinedIcon sx={{ color: purpleAccent, opacity: 0.8 }} />}
                  sx={{
                    borderColor: alertInfoBorder,
                    backgroundColor: alertInfoBg,
                    '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' },
                  }}
                >
                  Your API key is sent directly to your chosen provider and is <strong>never stored</strong> on the server. It is kept only in your browser session and cleared when you close the tab.
                </Alert>
              )}

              <TextField
                label="API Key"
                placeholder={usingServerKey ? 'Using server-configured key (enter to override)' : 'sk-... or sk-ant-... or AIza...'}
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={handleKeyChange}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowKey(!showKey)} edge="end" sx={{ color: 'text.secondary' }}>
                        {showKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                      {apiKeyValidated && (
                        <Tooltip title="Key validated">
                          <CheckCircleIcon sx={{ color: greenSuccess, ml: 0.5, fontSize: 20 }} />
                        </Tooltip>
                      )}
                    </InputAdornment>
                  ),
                  sx: { fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.85rem' }
                }}
              />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={providerOptions.some((p) => p.value === provider) ? provider : ''}
                      label="Provider"
                      onChange={handleProviderChange}
                    >
                      {providerOptions.length === 0 && (
                        <MenuItem value="" disabled>No providers available</MenuItem>
                      )}
                      {providerOptions.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <span>{p.label}</span>
                            {!hasUserKey && llmProviders[p.value] && (
                              <CheckCircleIcon sx={{ color: greenSuccess, fontSize: 16, ml: 'auto' }} />
                            )}
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    size="small"
                    disabled={modelItems.length === 0}
                    options={modelItems}
                    getOptionLabel={(opt) => typeof opt === 'string' ? opt : (opt.label || opt.value)}
                    value={modelItems.find((m) => m.value === model) || null}
                    onChange={(_, newVal) => { if (newVal) setModel(newVal.value) }}
                    isOptionEqualToValue={(opt, val) => opt.value === val.value}
                    disableClearable
                    renderInput={(params) => <TextField {...params} label="Model" />}
                    ListboxProps={{
                      sx: {
                        maxHeight: 200,
                        '& .MuiAutocomplete-option': {
                          fontSize: '0.85rem',
                          py: 0.6,
                          minHeight: 'auto',
                        }
                      }
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: isDark ? 'rgba(15,15,15,0.98)' : 'rgba(255,255,255,0.98)',
                          boxShadow: isDark
                            ? '0 0 0 1px rgba(167, 139, 250, 0.10), 0 24px 70px rgba(0,0,0,0.55)'
                            : '0 0 0 1px rgba(124, 58, 237, 0.06), 0 12px 40px rgba(0,0,0,0.10)',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={(!apiKey.trim() && !usingServerKey) || validating}
                    onClick={() => validateAndFetchModels(apiKey.trim(), provider)}
                    startIcon={validating ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                      height: 40,
                      borderColor: apiKeyValidated ? alertSuccessBorder : purpleBorder,
                      color: apiKeyValidated ? greenSuccess : 'text.primary',
                      '&:hover': {
                        borderColor: apiKeyValidated ? 'rgba(74, 222, 128, 0.60)' : purpleAccent,
                        backgroundColor: apiKeyValidated ? alertSuccessBg : purpleBgSubtle,
                      },
                    }}
                  >
                    {validating ? 'Validating...' : apiKeyValidated ? 'Validated' : 'Validate Key'}
                  </Button>
                </Grid>
              </Grid>
            </Stack>
          </Box>
        </Collapse>

        <Divider />

        {/* ─── Section 2: Requirements ─── */}
        <Box sx={{ px: 3, pt: 3, pb: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Requirements
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Provide what you want to test — upload a file, write it out, or pull stories from Jira.
              </Typography>
            </Box>

            <Tabs
              value={reqInputTab}
              onChange={(_, v) => setReqInputTab(v)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                '& .MuiTabs-indicator': { backgroundColor: purpleAccent },
                '& .Mui-selected': { color: purpleAccent + ' !important' },
              }}
            >
              <Tab value="manual" label="Write or Upload" icon={<EditNoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ '& .MuiTab-iconWrapper': { mr: 0.5 } }} />
              <Tab value="jira" label="Import from Jira" icon={<LinkIcon sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ '& .MuiTab-iconWrapper': { mr: 0.5 } }} />
            </Tabs>

            {/* ─── Jira credentials (when not connected) ─── */}
            {reqInputTab === 'jira' && !jiraConfigured && (
              <Box sx={{ pl: 2, borderLeft: `2px solid ${purpleBorder}` }}>
                <Stack spacing={2}>
                  <Alert
                    severity="info"
                    variant="outlined"
                    icon={<InfoOutlinedIcon sx={{ color: purpleAccent, opacity: 0.8 }} />}
                    sx={{
                      borderColor: alertInfoBorder,
                      backgroundColor: alertInfoBg,
                      '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' },
                    }}
                  >
                    {jiraServerConfigured
                      ? 'Jira is configured on the server. Connecting...'
                      : <>Enter your Jira Cloud credentials to import user stories. Credentials are <strong>never stored</strong> — they are sent only as request headers.</>}
                  </Alert>

                  <TextField
                    size="small"
                    label="Jira Base URL"
                    placeholder="https://your-domain.atlassian.net"
                    value={jiraBaseUrl}
                    onChange={(e) => setJiraBaseUrl(e.target.value)}
                    fullWidth
                    InputProps={{ sx: { fontSize: '0.85rem' } }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        size="small"
                        label="Jira Email"
                        placeholder="you@company.com"
                        value={jiraEmail}
                        onChange={(e) => setJiraEmail(e.target.value)}
                        fullWidth
                        InputProps={{ sx: { fontSize: '0.85rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        size="small"
                        label="Jira API Token"
                        placeholder="Your Jira API token"
                        type={showJiraToken ? 'text' : 'password'}
                        value={jiraToken}
                        onChange={(e) => setJiraToken(e.target.value)}
                        fullWidth
                        InputProps={{
                          sx: { fontSize: '0.85rem' },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowJiraToken(!showJiraToken)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showJiraToken ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="outlined"
                    startIcon={jiraConnecting ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                    disabled={!jiraBaseUrl.trim() || !jiraEmail.trim() || !jiraToken.trim() || jiraConnecting}
                    onClick={async () => {
                      setJiraConnecting(true)
                      setJiraConnectStatus(null)
                      setJiraConnectMessage('')
                      try {
                        await checkJiraAndLoadProjects(true)
                        setJiraConnectStatus('success')
                        setJiraConnectMessage('Connected to Jira successfully.')
                        setInfo('Connected to Jira successfully.')
                      } catch (err) {
                        const msg = err.message || 'Failed to connect to Jira'
                        setJiraConnectStatus('error')
                        setJiraConnectMessage(msg)
                        setError(msg)
                      } finally {
                        setJiraConnecting(false)
                      }
                    }}
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: purpleBorder,
                      color: 'text.primary',
                      '&:hover': { borderColor: purpleAccent, backgroundColor: purpleBgSubtle },
                    }}
                  >
                    {jiraConnecting ? 'Connecting...' : 'Connect to Jira'}
                  </Button>

                  {jiraConnectStatus === 'success' && (
                    <Alert
                      severity="success"
                      variant="outlined"
                      icon={<CheckCircleIcon sx={{ color: greenSuccess }} />}
                      sx={{
                        borderColor: alertSuccessBorder,
                        backgroundColor: alertSuccessBg,
                        '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' },
                      }}
                    >
                      {jiraConnectMessage}
                    </Alert>
                  )}

                  {jiraConnectStatus === 'error' && (
                    <Alert
                      severity="error"
                      variant="outlined"
                      sx={{
                        borderColor: alertErrorBorder,
                        backgroundColor: alertErrorBg,
                        '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' },
                      }}
                    >
                      {jiraConnectMessage}
                    </Alert>
                  )}
                </Stack>
              </Box>
            )}

            {/* ─── Manual Input ─── */}
            {reqInputTab === 'manual' ? (
              <>
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

                {/* Unified input zone: drag-drop wraps the whole area */}
                <Box
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setDragOver(false)
                    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null
                    if (f) acceptDroppedFile(f)
                  }}
                  sx={{ position: 'relative' }}
                >
                  {/* Drag overlay */}
                  {dragOver && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: purpleBgSubtle,
                        borderRadius: 2,
                        border: `2px dashed ${purpleAccent}80`,
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <Stack alignItems="center" spacing={0.5}>
                        <CloudUploadIcon sx={{ color: purpleAccent, fontSize: 36 }} />
                        <Typography variant="body2" sx={{ color: purpleAccent, fontWeight: 600 }}>
                          Drop file here
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          .txt, .md, .pdf, .docx, .html
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  {/* Toolbar above textarea */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1, px: 0.5 }}
                  >
                    <Button
                      size="small"
                      startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      sx={{
                        textTransform: 'none',
                        color: requirementFile ? purpleAccent : 'text.secondary',
                        fontSize: '0.8rem',
                        fontWeight: requirementFile ? 600 : 400,
                        px: 1,
                        borderRadius: 1.5,
                        backgroundColor: requirementFile ? purpleBgSubtle : 'transparent',
                        '&:hover': { backgroundColor: purpleBgSubtle },
                      }}
                    >
                      {requirementFile ? requirementFile.name : 'Upload file'}
                    </Button>

                    {requirementFile && (
                      <Chip
                        size="small"
                        label={(() => {
                          const name = requirementFile.name || ''
                          const ext = name.includes('.') ? name.split('.').pop().toUpperCase() : '?'
                          return ext
                        })()}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontFamily: theme.typography.fontFamilyMonospace,
                          backgroundColor: purpleBgSubtle,
                          color: purpleAccent,
                        }}
                      />
                    )}

                    <Box sx={{ flex: 1 }} />

                    {/* Word count */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: wordCount > 0 ? 'text.secondary' : 'text.disabled',
                        fontFamily: theme.typography.fontFamilyMonospace,
                        fontSize: '0.72rem',
                        transition: 'color 200ms',
                      }}
                    >
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </Typography>

                    {/* Clear button — only when there's content */}
                    {(requirementFile || requirementText.trim()) && (
                      <Tooltip title="Clear all">
                        <IconButton
                          size="small"
                          onClick={() => {
                            cancelInFlight()
                            setRequirementFile(null)
                            setRequirementText('')
                            if (fileInputRef.current) fileInputRef.current.value = ''
                            setInfo('Cleared requirements.')
                          }}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: 'error.main', backgroundColor: alertErrorBg },
                          }}
                        >
                          <ClearAllIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  <TextField
                    label="Requirement text"
                    placeholder="Paste or type requirements here, or drag & drop a file..."
                    value={requirementText}
                    onChange={(e) => setRequirementText(e.target.value)}
                    multiline
                    minRows={isSmDown ? 6 : 8}
                    fullWidth
                  />
                </Box>
              </>
            ) : jiraConfigured ? (
              <Stack spacing={2}>
                {/* Connected indicator */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon sx={{ color: greenSuccess, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                    Connected to Jira
                  </Typography>
                  {jiraProject && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={jiraProject}
                      sx={{
                        height: 20,
                        fontSize: '0.70rem',
                        fontFamily: theme.typography.fontFamilyMonospace,
                        borderColor: alertSuccessBorder,
                        color: 'text.secondary',
                      }}
                    />
                  )}
                </Stack>

                <FormControl fullWidth size="small">
                  <InputLabel>Jira Project</InputLabel>
                  <Select
                    value={jiraProject}
                    label="Jira Project"
                    onChange={(e) => { setJiraProject(e.target.value); setJiraStories([]); setJiraSelectedKeys(new Set()) }}
                  >
                    {jiraProjects.map((p) => (
                      <MenuItem key={p.key} value={p.key}>{p.key} — {p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {jiraProject && (
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Epic</InputLabel>
                        <Select value={jiraEpicFilter} label="Epic" onChange={(e) => setJiraEpicFilter(e.target.value)}>
                          <MenuItem value="">All epics</MenuItem>
                          {jiraEpics.map((ep) => (
                            <MenuItem key={ep.key} value={ep.key}>{ep.key} — {ep.summary}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Sprint</InputLabel>
                        <Select value={jiraSprintFilter} label="Sprint" onChange={(e) => setJiraSprintFilter(e.target.value)}>
                          <MenuItem value="">All sprints</MenuItem>
                          {jiraSprints.map((sp) => (
                            <MenuItem key={sp.id} value={sp.name}>{sp.name}{sp.state === 'active' ? ' (active)' : ''}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select value={jiraStatusFilter} label="Status" onChange={(e) => setJiraStatusFilter(e.target.value)}>
                          <MenuItem value="">All statuses</MenuItem>
                          {['To Do', 'In Progress', 'In Review', 'Done'].map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        size="small"
                        label="Search"
                        placeholder="Search summary..."
                        value={jiraSearch}
                        onChange={(e) => setJiraSearch(e.target.value)}
                        fullWidth
                        onKeyDown={(e) => { if (e.key === 'Enter') fetchJiraStories() }}
                      />
                    </Grid>
                  </Grid>
                )}

                {jiraProject && (
                  <Button
                    variant="outlined"
                    onClick={fetchJiraStories}
                    disabled={jiraLoading}
                    startIcon={jiraLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: purpleBorder,
                      color: 'text.primary',
                      '&:hover': { borderColor: purpleAccent, backgroundColor: purpleBgSubtle },
                    }}
                  >
                    {jiraLoading ? 'Loading...' : 'Fetch Stories'}
                  </Button>
                )}

                {jiraStories.length > 0 && (
                  <Card sx={{ backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.02)' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            User Stories ({jiraStories.length})
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setJiraSelectedKeys(new Set(jiraStories.map((s) => s.key)))}
                            sx={{ fontSize: '0.72rem', color: 'text.secondary', textTransform: 'none', minWidth: 0 }}
                          >
                            Select all
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setJiraSelectedKeys(new Set())}
                            sx={{ fontSize: '0.72rem', color: 'text.secondary', textTransform: 'none', minWidth: 0 }}
                          >
                            Deselect all
                          </Button>
                        </Stack>

                        <Divider />

                        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                          {jiraStories.map((story) => (
                            <Stack
                              key={story.key}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{
                                py: 0.75,
                                px: 0.5,
                                borderRadius: 1,
                                '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={jiraSelectedKeys.has(story.key)}
                                onChange={(e) => {
                                  const next = new Set(jiraSelectedKeys)
                                  if (e.target.checked) next.add(story.key)
                                  else next.delete(story.key)
                                  setJiraSelectedKeys(next)
                                }}
                                sx={{ p: 0.5, color: 'text.disabled', '&.Mui-checked': { color: purpleAccent } }}
                              />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={story.key}
                                sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'divider', color: 'text.secondary', minWidth: 72, justifyContent: 'flex-start' }}
                              />
                              <Typography variant="body2" sx={{ flex: 1, color: 'text.primary', minWidth: 0 }} noWrap>
                                {story.summary}
                              </Typography>
                              <Chip
                                size="small"
                                label={story.status}
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 20,
                                  backgroundColor: story.status === 'Done' ? 'rgba(22,163,74,0.15)' : story.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                  color: story.status === 'Done' ? 'rgba(22,163,74,0.9)' : story.status === 'In Progress' ? 'rgba(59,130,246,0.9)' : 'text.secondary',
                                }}
                              />
                              {story.priority && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={story.priority}
                                  sx={{ fontSize: '0.68rem', height: 20, borderColor: 'divider', color: 'text.secondary' }}
                                />
                              )}
                            </Stack>
                          ))}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {jiraStories.length > 0 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {jiraSelectedKeys.size} {jiraSelectedKeys.size === 1 ? 'story' : 'stories'} selected
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="contained"
                      disabled={jiraLoading || jiraSelectedKeys.size === 0}
                      onClick={useSelectedJiraStories}
                      sx={{
                        backgroundColor: purple[600],
                        '&:hover': { backgroundColor: purple[700] },
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      Use Selected
                    </Button>
                  </Stack>
                )}
              </Stack>
            ) : null}
          </Stack>
        </Box>

      </CardContent>
    </Card>
  )
}
