import { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { purpleMain, purpleDeep, accentLime, diagramInfo } from './theme'
import { BulletList, OrderedList, listOrNone } from './helpers'
import MermaidDiagram from './MermaidDiagram'

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
  // Expand state
  expandedInfoCard, setExpandedInfoCard,
  // Callbacks for cancel / clear / re-analyze
  onCancel,
  onClearAnswers,
  onReAnalyze,
}) {
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
                    '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
                  }}
                >
                  Ask missing info
                </Button>
                {busy && !analysis && (
                  <Button variant="text" onClick={onCancel} sx={{ color: 'rgba(255,255,255,0.85)' }}>
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
                  onClick={onClearAnswers}
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
                  Let the AI analyze your requirement to extract testable elements and recommend techniques.
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
                    boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
                    '&:hover': { backgroundColor: purpleDeep }
                  }}
                >
                  Analyze & recommend techniques
                </Button>
                {busy && (
                  <Button variant="text" onClick={onCancel} sx={{ color: 'rgba(255,255,255,0.85)' }}>
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
        <Card sx={{ borderColor: 'rgba(167, 139, 250, 0.22)', boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.15), 0 18px 60px rgba(0,0,0,0.50)' }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Requirement Analysis</Typography>
                {analysisMeta ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    {jiraImportedCount > 0 && (
                      <Chip size="small" label={`${jiraImportedCount} Jira ${jiraImportedCount === 1 ? 'story' : 'stories'}`} sx={{ fontFamily: theme.typography.fontFamilyMonospace, backgroundColor: 'rgba(163, 230, 53, 0.10)', color: accentLime, borderColor: 'rgba(163, 230, 53, 0.30)', border: '1px solid' }} />
                    )}
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
                              backgroundColor: 'rgba(167, 139, 250, 0.12)',
                              color: 'rgba(167, 139, 250, 0.92)'
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
                            backgroundColor: checked ? 'rgba(167, 139, 250, 0.06)' : 'rgba(0,0,0,0.12)',
                            borderColor: checked ? 'rgba(167, 139, 250, 0.30)' : 'rgba(255,255,255,0.08)',
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
                      <Card sx={{ mt: 1.5, backgroundColor: 'rgba(0,0,0,0.12)', borderColor: 'rgba(167, 139, 250, 0.12)' }}>
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
                                sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.68rem', height: 20, borderColor: 'rgba(167, 139, 250, 0.30)', color: 'rgba(167, 139, 250, 0.85)' }}
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
                                    backgroundColor: checked ? 'rgba(167, 139, 250, 0.06)' : 'transparent',
                                    '&:hover': { backgroundColor: 'rgba(167, 139, 250, 0.08)' },
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
                                      backgroundColor: 'rgba(167, 139, 250, 0.08)',
                                      color: 'rgba(167, 139, 250, 0.60)',
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
                      onClick={onReAnalyze}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.14)',
                        color: 'rgba(255,255,255,0.85)',
                        '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
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
                        boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
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
