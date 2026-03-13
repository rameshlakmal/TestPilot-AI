import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { purpleMain, purpleDeep, accentLime, diagramInfo } from './theme'

export default function StepAnalyze({
  theme,
  busy,
  hasAnyRequirements,
  // Preflight
  preflight, answersByQuestion, setAnswersByQuestion, preflightSkills,
  callPreflight,
  // Analysis
  analysis, analysisMeta,
  selectedTechniques, setSelectedTechniques,
  selectedDiagrams, setSelectedDiagrams,
  jiraImportedCount,
  callAnalyze,
  callGenerateFromAnalysis,
  // Callbacks passed from App.jsx
  cancelInFlight,
  setInfo,
  setAnalysis, setAnalysisMeta,
}) {
  const [clarifyOpen, setClarifyOpen] = useState(false)

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

  const techniqueRecs = useMemo(() => {
    return Array.isArray(analysis && analysis.techniqueRecommendations) ? analysis.techniqueRecommendations : []
  }, [analysis])

  const selectedCount = useMemo(() => {
    return Object.values(selectedTechniques).filter(Boolean).length
  }, [selectedTechniques])

  const estimatedTotal = useMemo(() => {
    let total = 0
    for (const rec of techniqueRecs) {
      if (selectedTechniques[rec.skillId]) total += (rec.estimatedScenarios || 0)
    }
    return total
  }, [techniqueRecs, selectedTechniques])

  // Group techniques by confidence for visual hierarchy
  const groupedTechniques = useMemo(() => {
    const high = []
    const medium = []
    const low = []
    for (const rec of techniqueRecs) {
      if (rec.confidence === 'high') high.push(rec)
      else if (rec.confidence === 'medium') medium.push(rec)
      else low.push(rec)
    }
    return { high, medium, low }
  }, [techniqueRecs])

  // Available diagrams from selected techniques
  const availableDiags = useMemo(() => {
    return Object.entries(selectedTechniques)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .filter((id) => diagramInfo[id])
  }, [selectedTechniques])

  const selectedDiagramCount = useMemo(() => {
    return availableDiags.filter((id) => selectedDiagrams[id]).length
  }, [availableDiags, selectedDiagrams])

  function handleReAnalyze() {
    setAnalysis(null)
    setAnalysisMeta(null)
    setSelectedTechniques({})
    setSelectedDiagrams({})
  }

  function handleClearAnswers() {
    setAnswersByQuestion({})
    setInfo('Cleared answers.')
  }

  const confidenceConfig = {
    high: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.20)', label: 'High confidence' },
    medium: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.20)', label: 'Medium confidence' },
    low: { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.08)', label: 'Low confidence' },
  }

  // ─── Pre-analysis state (no analysis yet) ───
  if (!analysis) {
    return (
      <Card sx={{ overflow: 'visible' }}>
        <CardContent sx={{ p: '0 !important' }}>

          {/* Clarify section — collapsible, optional */}
          <Box
            onClick={() => setClarifyOpen((o) => !o)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mx: 2,
              mt: 2,
              mb: clarifyOpen ? 0 : 2,
              px: 1.5,
              py: 1.25,
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: 2,
              border: '1px solid',
              borderColor: clarifyOpen ? 'rgba(167, 139, 250, 0.20)' : 'rgba(255,255,255,0.08)',
              backgroundColor: clarifyOpen ? 'rgba(167, 139, 250, 0.03)' : 'rgba(255,255,255,0.02)',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: 'rgba(167, 139, 250, 0.06)',
                borderColor: 'rgba(167, 139, 250, 0.25)',
              },
            }}
          >
            <ExpandMoreIcon
              sx={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 20,
                transform: clarifyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
              }}
            />
            <HelpOutlineIcon sx={{ color: 'rgba(255,255,255,0.40)', fontSize: 18 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Clarify Requirements
            </Typography>
            <Chip
              size="small"
              label="Optional"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.40)',
                fontWeight: 500,
              }}
            />
            {missingQuestions.length > 0 && (
              <Chip
                size="small"
                label={`${answeredCount}/${missingQuestions.length} answered`}
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontFamily: theme.typography.fontFamilyMonospace,
                  backgroundColor: answeredCount === missingQuestions.length ? 'rgba(74, 222, 128, 0.08)' : 'rgba(167, 139, 250, 0.08)',
                  color: answeredCount === missingQuestions.length ? '#4ade80' : purpleMain,
                }}
              />
            )}
            <Box sx={{ flex: 1 }} />
          </Box>

          <Collapse in={clarifyOpen} timeout={300}>
            <Box sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.82rem' }}>
                  Let the AI identify ambiguities in your requirements before analysis. You can skip this step and go straight to Analyze below.
                </Typography>

                {!preflight && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={busy && !analysis ? null : <HelpOutlineIcon />}
                      disabled={busy || !hasAnyRequirements}
                      onClick={(e) => { e.stopPropagation(); callPreflight() }}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.14)',
                        color: 'rgba(255,255,255,0.85)',
                        textTransform: 'none',
                        '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
                      }}
                    >
                      {busy && !analysis ? 'Analyzing...' : 'Find missing info'}
                    </Button>
                    {busy && !analysis && (
                      <Button variant="text" size="small" onClick={cancelInFlight} sx={{ color: 'rgba(255,255,255,0.60)', textTransform: 'none' }}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                )}

                {/* Questions inline */}
                {missingQuestions.length > 0 && (
                  <Stack spacing={1.5}>
                    {missingQuestions.map((q, idx) => {
                      const key = String(q)
                      const answered = Boolean(String(answersByQuestion[key] || '').trim())
                      return (
                        <Box
                          key={key}
                          sx={{
                            pl: 2,
                            borderLeft: `2px solid ${answered ? 'rgba(74, 222, 128, 0.30)' : 'rgba(167, 139, 250, 0.20)'}`,
                            transition: 'border-color 200ms',
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 0.75 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: theme.typography.fontFamilyMonospace,
                                fontSize: '0.68rem',
                                color: 'rgba(255,255,255,0.35)',
                                mt: 0.1,
                                flexShrink: 0,
                              }}
                            >
                              Q{idx + 1}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.80)', fontSize: '0.85rem' }}>
                              {key}
                            </Typography>
                          </Stack>
                          <TextField
                            placeholder="Your answer (optional)"
                            value={answersByQuestion[key] || ''}
                            onChange={(e) => setAnswersByQuestion((prev) => ({ ...prev, [key]: e.target.value }))}
                            multiline
                            minRows={1}
                            maxRows={4}
                            fullWidth
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.85rem',
                              },
                            }}
                          />
                        </Box>
                      )
                    })}

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${answeredCount}/${missingQuestions.length} answered`}
                        sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
                      />
                      <Box sx={{ flex: 1 }} />
                      {answeredCount > 0 && (
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<ClearAllIcon sx={{ fontSize: 14 }} />}
                          onClick={handleClearAnswers}
                          sx={{ color: 'rgba(255,255,255,0.50)', textTransform: 'none', fontSize: '0.78rem' }}
                        >
                          Clear answers
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Collapse>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Analyze CTA — the main action */}
          <Box sx={{ px: 2.5, py: 3 }}>
            <Stack spacing={2.5} alignItems="center">
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: busy
                      ? `linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(124, 58, 237, 0.15))`
                      : `linear-gradient(135deg, rgba(167, 139, 250, 0.10), rgba(124, 58, 237, 0.10))`,
                    transition: 'all 300ms',
                  }}
                >
                  <ScienceIcon sx={{ color: purpleMain, fontSize: 26 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Analyze & Recommend Techniques
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.50)', textAlign: 'center', maxWidth: 420, fontSize: '0.84rem' }}>
                  The AI will extract testable elements from your requirements and recommend the best testing techniques.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={busy ? null : <ScienceIcon />}
                  disabled={busy || !hasAnyRequirements}
                  onClick={callAnalyze}
                  sx={{
                    px: 3.5,
                    py: 1,
                    backgroundImage: 'none',
                    backgroundColor: purpleMain,
                    color: 'rgba(255,255,255,0.96)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 12px 40px rgba(0,0,0,0.35)',
                    '&:hover': { backgroundColor: purpleDeep, boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.50), 0 16px 50px rgba(0,0,0,0.45)' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(167, 139, 250, 0.15)', color: 'rgba(255,255,255,0.30)' },
                  }}
                >
                  {busy ? 'Analyzing...' : 'Analyze requirements'}
                </Button>
                {busy && (
                  <Button variant="text" size="small" onClick={cancelInFlight} sx={{ color: 'rgba(255,255,255,0.60)', textTransform: 'none' }}>
                    Cancel
                  </Button>
                )}
              </Stack>

              {busy && (
                <LinearProgress
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    borderRadius: 2,
                    height: 3,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { backgroundColor: purpleMain },
                  }}
                />
              )}

              {!hasAnyRequirements && (
                <Typography variant="caption" sx={{ color: 'rgba(239, 68, 68, 0.7)', fontSize: '0.78rem' }}>
                  Go back to step 1 and add requirements first.
                </Typography>
              )}
            </Stack>
          </Box>

        </CardContent>
      </Card>
    )
  }

  // ─── Post-analysis state (analysis exists) ───

  function TechniqueRow({ rec }) {
    const checked = Boolean(selectedTechniques[rec.skillId])
    const conf = confidenceConfig[rec.confidence] || confidenceConfig.low
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={() => setSelectedTechniques((prev) => ({ ...prev, [rec.skillId]: !prev[rec.skillId] }))}
        sx={{
          py: 1,
          px: 1.5,
          borderRadius: 2,
          cursor: 'pointer',
          backgroundColor: checked ? 'rgba(167, 139, 250, 0.05)' : 'transparent',
          border: '1px solid',
          borderColor: checked ? 'rgba(167, 139, 250, 0.20)' : 'rgba(255,255,255,0.04)',
          transition: 'all 120ms ease',
          '&:hover': { backgroundColor: 'rgba(167, 139, 250, 0.06)', borderColor: 'rgba(167, 139, 250, 0.15)' },
        }}
      >
        <Checkbox
          checked={checked}
          size="small"
          sx={{ p: 0, color: 'rgba(255,255,255,0.30)', '&.Mui-checked': { color: purpleMain } }}
          onChange={() => setSelectedTechniques((prev) => ({ ...prev, [rec.skillId]: !prev[rec.skillId] }))}
          onClick={(e) => e.stopPropagation()}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 600, color: checked ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.72)' }}>
              {rec.skillId}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.40)', fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.70rem' }}>
              ~{rec.estimatedScenarios} scenarios
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.50)', display: 'block', mt: 0.15, lineHeight: 1.4 }}>
            {rec.rationale}
          </Typography>
        </Box>
      </Stack>
    )
  }

  function ConfidenceGroup({ level, recs }) {
    if (!recs.length) return null
    const conf = confidenceConfig[level]
    return (
      <Box>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: conf.color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: conf.color, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {conf.label}
          </Typography>
          <Chip size="small" label={recs.length} sx={{ height: 18, fontSize: '0.64rem', fontFamily: theme.typography.fontFamilyMonospace, backgroundColor: conf.bg, color: conf.color, minWidth: 0 }} />
        </Stack>
        <Stack spacing={0.75}>
          {recs.map((rec) => <TechniqueRow key={rec.skillId} rec={rec} />)}
        </Stack>
      </Box>
    )
  }

  return (
    <Card
      sx={{
        overflow: 'visible',
        borderColor: 'rgba(167, 139, 250, 0.18)',
      }}
    >
      <CardContent sx={{ p: '0 !important' }}>

        {/* ─── Analysis header ─── */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 18 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Requirement Analysis
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {analysisMeta && (
                <Chip size="small" variant="outlined" label={`${analysisMeta.provider}`} sx={{ height: 22, fontSize: '0.70rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.10)' }} />
              )}
              {analysis.complexity && (
                <Chip size="small" variant="outlined" label={`${analysis.complexity} complexity`} sx={{ height: 22, fontSize: '0.70rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.10)' }} />
              )}
              {jiraImportedCount > 0 && (
                <Chip size="small" label={`${jiraImportedCount} Jira ${jiraImportedCount === 1 ? 'story' : 'stories'}`} sx={{ height: 22, fontSize: '0.70rem', fontFamily: theme.typography.fontFamilyMonospace, backgroundColor: 'rgba(163, 230, 53, 0.10)', color: accentLime, borderColor: 'rgba(163, 230, 53, 0.30)', border: '1px solid' }} />
              )}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Re-analyze requirements">
              <IconButton
                size="small"
                onClick={handleReAnalyze}
                sx={{ color: 'rgba(255,255,255,0.40)', '&:hover': { color: purpleMain, backgroundColor: 'rgba(167, 139, 250, 0.08)' } }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* ─── Summary + Elements — compact two-column layout ─── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Grid container spacing={2}>
            {/* Summary */}
            <Grid item xs={12} md={Array.isArray(analysis.extractedElements) && analysis.extractedElements.length > 0 ? 6 : 12}>
              <Box sx={{ height: '100%' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.40)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                  Summary
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                  {analysis.summary || '(no summary)'}
                </Typography>
              </Box>
            </Grid>

            {/* Extracted Elements */}
            {Array.isArray(analysis.extractedElements) && analysis.extractedElements.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.40)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                    Testable Elements ({analysis.extractedElements.length})
                  </Typography>
                  <Stack spacing={0.5}>
                    {analysis.extractedElements.map((el, idx) => (
                      <Stack key={idx} direction="row" spacing={0.75} alignItems="baseline">
                        <Chip
                          size="small"
                          label={el.type}
                          sx={{
                            fontFamily: theme.typography.fontFamilyMonospace,
                            fontSize: '0.64rem',
                            height: 18,
                            backgroundColor: 'rgba(167, 139, 250, 0.10)',
                            color: 'rgba(167, 139, 250, 0.85)',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.82)', fontSize: '0.82rem' }}>
                          {el.name}
                        </Typography>
                        {el.description && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem' }}>
                            — {el.description}
                          </Typography>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* ─── Techniques selection ─── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Recommended Techniques
              </Typography>
              <Chip
                size="small"
                label={`${selectedCount} of ${techniqueRecs.length} selected`}
                sx={{
                  height: 22,
                  fontSize: '0.70rem',
                  fontFamily: theme.typography.fontFamilyMonospace,
                  backgroundColor: selectedCount > 0 ? 'rgba(167, 139, 250, 0.10)' : 'rgba(255,255,255,0.04)',
                  color: selectedCount > 0 ? purpleMain : 'rgba(255,255,255,0.45)',
                }}
              />
              {estimatedTotal > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.72rem' }}>
                  ~{estimatedTotal} scenarios
                </Typography>
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'none', minWidth: 0, px: 1 }}
                onClick={() => {
                  const allOn = techniqueRecs.every((r) => selectedTechniques[r.skillId])
                  const next = {}
                  for (const r of techniqueRecs) next[r.skillId] = !allOn
                  setSelectedTechniques((prev) => ({ ...prev, ...next }))
                }}
              >
                {techniqueRecs.every((r) => selectedTechniques[r.skillId]) ? 'Deselect all' : 'Select all'}
              </Button>
            </Stack>

            {/* Grouped by confidence */}
            <Stack spacing={2}>
              <ConfidenceGroup level="high" recs={groupedTechniques.high} />
              <ConfidenceGroup level="medium" recs={groupedTechniques.medium} />
              <ConfidenceGroup level="low" recs={groupedTechniques.low} />
            </Stack>

            {/* Diagrams — inline toggle */}
            {availableDiags.length > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0,0,0,0.12)',
                  border: '1px solid rgba(167, 139, 250, 0.08)',
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <AccountTreeIcon sx={{ color: purpleMain, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.76rem', color: 'rgba(255,255,255,0.70)' }}>
                    Diagrams
                  </Typography>
                  <Chip
                    size="small"
                    label="optional"
                    sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}
                  />
                  {selectedDiagramCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${selectedDiagramCount} selected`}
                      sx={{ height: 18, fontSize: '0.62rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(167, 139, 250, 0.25)', color: 'rgba(167, 139, 250, 0.70)' }}
                    />
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    variant="text"
                    sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.40)', textTransform: 'none', minWidth: 0, px: 0.5 }}
                    onClick={() => {
                      const allOn = availableDiags.every((id) => selectedDiagrams[id])
                      const next = {}
                      for (const id of availableDiags) next[id] = !allOn
                      setSelectedDiagrams((prev) => ({ ...prev, ...next }))
                    }}
                  >
                    {availableDiags.every((id) => selectedDiagrams[id]) ? 'None' : 'All'}
                  </Button>
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {availableDiags.map((id) => {
                    const info = diagramInfo[id]
                    const checked = Boolean(selectedDiagrams[id])
                    return (
                      <Chip
                        key={id}
                        size="small"
                        label={info.label}
                        clickable
                        onClick={() => setSelectedDiagrams((prev) => ({ ...prev, [id]: !prev[id] }))}
                        icon={<AccountTreeIcon sx={{ fontSize: '14px !important', color: checked ? `${purpleMain} !important` : 'rgba(255,255,255,0.25) !important' }} />}
                        sx={{
                          height: 26,
                          fontSize: '0.74rem',
                          backgroundColor: checked ? 'rgba(167, 139, 250, 0.10)' : 'rgba(255,255,255,0.03)',
                          color: checked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.50)',
                          borderColor: checked ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255,255,255,0.06)',
                          border: '1px solid',
                          '&:hover': { backgroundColor: 'rgba(167, 139, 250, 0.12)' },
                        }}
                      />
                    )
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* ─── Generate action bar ─── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.02) 0%, rgba(167, 139, 250, 0.06) 100%)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              {selectedCount > 0 && estimatedTotal > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                  {selectedCount} technique{selectedCount !== 1 ? 's' : ''} &middot; ~{estimatedTotal} scenarios
                </Typography>
              )}
              {selectedCount === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(239, 68, 68, 0.7)', fontSize: '0.78rem' }}>
                  Select at least one technique to generate
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                onClick={handleReAnalyze}
                sx={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.70)',
                  textTransform: 'none',
                  '&:hover': { borderColor: 'rgba(167, 139, 250, 0.35)', backgroundColor: 'rgba(167, 139, 250, 0.06)' }
                }}
              >
                Re-analyze
              </Button>
              <Button
                variant="contained"
                startIcon={busy ? null : <PlayArrowIcon />}
                disabled={busy || selectedCount === 0}
                onClick={callGenerateFromAnalysis}
                sx={{
                  px: 3,
                  backgroundImage: 'none',
                  backgroundColor: purpleMain,
                  color: 'rgba(255,255,255,0.96)',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 12px 40px rgba(0,0,0,0.35)',
                  '&:hover': { backgroundColor: purpleDeep },
                  '&.Mui-disabled': { backgroundColor: 'rgba(167, 139, 250, 0.15)', color: 'rgba(255,255,255,0.30)' },
                }}
              >
                {busy ? 'Generating...' : 'Generate test scenarios'}
              </Button>
            </Stack>
          </Stack>
          {busy && (
            <LinearProgress
              sx={{
                mt: 1.5,
                borderRadius: 2,
                height: 3,
                backgroundColor: 'rgba(255,255,255,0.06)',
                '& .MuiLinearProgress-bar': { backgroundColor: purpleMain },
              }}
            />
          )}
        </Box>

      </CardContent>
    </Card>
  )
}
