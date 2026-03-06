import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { purpleMain, purpleDeep } from './theme'
import { download, toCsv, joinLines, BulletList, OrderedList, listOrNone } from './helpers'
import MermaidDiagram from './MermaidDiagram'

export default function StepResults({
  theme, isSmDown,
  suite, suiteMeta, selectedSkills,
  duplicateGroups,
  skillDiagrams,
  // Filters
  search, setSearch,
  filterType, setFilterType,
  filterPriority, setFilterPriority,
  // Pagination
  filteredCases, paginatedCases,
  page, setPage, totalPages,
  rowsPerPage, setRowsPerPage,
  // Case selection
  selectedCaseIds, setSelectedCaseIds,
  // AIO
  aioProject, setAioProject,
  aioFolder, setAioFolder,
  aioToken, setAioToken,
  aioIncludeTags, setAioIncludeTags,
  aioBusy, aioResult,
  pushToAio,
  // Diagrams
  setDiagramDialogOpen, setActiveDiagram, setDiagramZoom,
  // Nav
  goToStep,
  // Extra callbacks used inside the JSX
  cancelInFlight, setInfo, setError,
}) {
  const [expandedInfoCard, setExpandedInfoCard] = useState('skills')

  const displayedSkills = useMemo(() => {
    const list = Array.isArray(selectedSkills) ? selectedSkills.slice() : []
    list.sort((a, b) => {
      const as = a && Number.isFinite(a.score) ? a.score : 0
      const bs = b && Number.isFinite(b.score) ? b.score : 0
      return bs - as
    })
    return list
  }, [selectedSkills])

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
                '&:hover': { borderColor: 'rgba(167, 139, 250, 0.45)', backgroundColor: 'rgba(167, 139, 250, 0.08)' }
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
        borderColor: 'rgba(167, 139, 250, 0.28)',
        boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.22), 0 22px 80px rgba(0,0,0,0.65)'
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
                    borderColor: 'rgba(167, 139, 250, 0.55)',
                    backgroundColor: 'rgba(167, 139, 250, 0.08)'
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
                    borderColor: 'rgba(167, 139, 250, 0.55)',
                    backgroundColor: 'rgba(167, 139, 250, 0.08)'
                  }
                }}
              >
                Export CSV
              </Button>
            </Stack>
          </Stack>

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
                    control={<Switch checked={aioIncludeTags} onChange={(e) => setAioIncludeTags(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: purpleMain }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: purpleMain } }} />}
                    label="Include coverage tags"
                  />
                </Stack>

                <Grid container spacing={1.5} alignItems="center">
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      size="small"
                      label="Folder path (optional)"
                      placeholder="Release 1.0 / Regression / Checkout"
                      value={aioFolder}
                      onChange={(e) => setAioFolder(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      variant="contained"
                      disabled={aioBusy}
                      onClick={pushToAio}
                      fullWidth
                      sx={{
                        backgroundColor: purpleMain,
                        '&:hover': { backgroundColor: 'rgba(167, 139, 250, 0.85)' },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Push to AIO
                    </Button>
                  </Grid>
                </Grid>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
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

          <Stack spacing={0}>
            {[
              {
                key: 'skills',
                label: 'Selected Skills',
                content: (
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
                              sx={{ display: 'block', mt: 0.35, color: 'rgba(255,255,255,0.55)', fontFamily: theme.typography.fontFamilyMonospace }}
                            >
                              {why}
                            </Typography>
                          ) : null}
                        </Box>
                      )
                    }}
                  />
                )
              },
              { key: 'missing', label: 'Missing Info Questions', content: <BulletList items={listOrNone(suite.missingInfoQuestions)} /> },
              { key: 'assumptions', label: 'Assumptions', content: <BulletList items={listOrNone(suite.assumptions)} /> },
              { key: 'risks', label: 'Risks', content: <BulletList items={listOrNone(suite.risks)} /> }
            ].map((card) => (
              <Accordion
                key={card.key}
                disableGutters
                expanded={expandedInfoCard === card.key}
                onChange={(_, isExpanded) => setExpandedInfoCard(isExpanded ? card.key : false)}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.20)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  '&:not(:last-child)': { borderBottom: 'none' },
                  '&:first-of-type': { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                  '&:last-of-type': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.60)' }} />}
                  sx={{ px: 2, '& .MuiAccordionSummary-content': { my: 1 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{card.label}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2 }}>
                  {card.content}
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>

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
                        onClick={() => { setActiveDiagram(d); setDiagramZoom(1); setDiagramDialogOpen(true) }}
                        sx={{
                          borderColor: 'rgba(167, 139, 250, 0.25)',
                          color: 'rgba(255,255,255,0.85)',
                          backgroundColor: 'rgba(167, 139, 250, 0.06)',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: 'rgba(167, 139, 250, 0.50)',
                            backgroundColor: 'rgba(167, 139, 250, 0.12)',
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
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.60)' }}>
                Showing {Math.min((page - 1) * rowsPerPage + 1, filteredCases.length)}-{Math.min(page * rowsPerPage, filteredCases.length)} of {filteredCases.length}
                {filteredCases.length < (Array.isArray(suite.testCases) ? suite.testCases.length : 0)
                  ? ` (${Array.isArray(suite.testCases) ? suite.testCases.length : 0} total)`
                  : ''}
                {' · '}
                <Box component="span" sx={{ color: purpleMain }}>{selectedCaseIds.size} selected</Box>
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  if (suite && Array.isArray(suite.testCases)) {
                    setSelectedCaseIds(new Set(suite.testCases.map((tc) => String(tc.id))))
                  }
                }}
                sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.50)', textTransform: 'none', minWidth: 0, px: 0.5 }}
              >
                Select all
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setSelectedCaseIds(new Set())}
                sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.50)', textTransform: 'none', minWidth: 0, px: 0.5 }}
              >
                Deselect all
              </Button>
              <Box sx={{ flex: 1 }} />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>Per page:</Typography>
                {[10, 50, 100].map((n) => (
                  <Chip
                    key={n}
                    size="small"
                    label={n}
                    clickable
                    onClick={() => { setRowsPerPage(n); setPage(1) }}
                    sx={{
                      fontFamily: theme.typography.fontFamilyMonospace,
                      fontSize: '0.72rem',
                      height: 24,
                      backgroundColor: rowsPerPage === n ? 'rgba(167, 139, 250, 0.18)' : 'rgba(255,255,255,0.04)',
                      color: rowsPerPage === n ? purpleMain : 'rgba(255,255,255,0.55)',
                      borderColor: rowsPerPage === n ? 'rgba(167, 139, 250, 0.35)' : 'transparent',
                      border: '1px solid',
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>

          {isSmDown ? (
            <Stack spacing={1.25}>
              {paginatedCases.map((tc) => (
                <Stack key={String(tc.id)} direction="row" spacing={0} alignItems="flex-start">
                  <Checkbox
                    size="small"
                    checked={selectedCaseIds.has(String(tc.id))}
                    onChange={(e) => {
                      const next = new Set(selectedCaseIds)
                      if (e.target.checked) next.add(String(tc.id))
                      else next.delete(String(tc.id))
                      setSelectedCaseIds(next)
                    }}
                    sx={{ mt: 0.75, color: 'rgba(255,255,255,0.30)', '&.Mui-checked': { color: purpleMain } }}
                  />
                  <Accordion
                    disableGutters
                    sx={{
                      flex: 1,
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
                          sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(167, 139, 250, 0.40)', color: 'rgba(167, 139, 250, 0.92)' }}
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
                        <Typography variant="caption" sx={{ color: 'rgba(167, 139, 250, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                          PRECONDITIONS
                        </Typography>
                        <OrderedList items={tc.preconditions} sx={{ mt: 0.5 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(167, 139, 250, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                          STEPS
                        </Typography>
                        <OrderedList items={tc.steps} sx={{ mt: 0.5 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(167, 139, 250, 0.92)', fontFamily: theme.typography.fontFamilyMonospace, letterSpacing: '0.06em' }}>
                          EXPECTED
                        </Typography>
                        <OrderedList items={tc.expected} sx={{ mt: 0.5 }} />
                      </Box>
                      {(Array.isArray(tc.coverageTags) && tc.coverageTags.length) || (Array.isArray(tc.requirementRefs) && tc.requirementRefs.length) ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {Array.isArray(tc.coverageTags)
                            ? tc.coverageTags.slice(0, 12).map((t) => (
                                <Chip key={String(t)} size="small" label={String(t)} sx={{ backgroundColor: 'rgba(167, 139, 250, 0.10)', color: 'rgba(255,255,255,0.78)' }} />
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
                </Stack>
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.10)', overflow: 'auto', background: 'rgba(0,0,0,0.18)' }}>
              <Table size="small" sx={{ minWidth: 1100 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: 'rgba(8, 8, 8, 0.96)', borderBottomColor: 'rgba(255,255,255,0.10)' }}>
                      <Checkbox
                        size="small"
                        checked={paginatedCases.length > 0 && paginatedCases.every((tc) => selectedCaseIds.has(String(tc.id)))}
                        indeterminate={paginatedCases.some((tc) => selectedCaseIds.has(String(tc.id))) && !paginatedCases.every((tc) => selectedCaseIds.has(String(tc.id)))}
                        onChange={(e) => {
                          const next = new Set(selectedCaseIds)
                          paginatedCases.forEach((tc) => {
                            if (e.target.checked) next.add(String(tc.id))
                            else next.delete(String(tc.id))
                          })
                          setSelectedCaseIds(next)
                        }}
                        sx={{ color: 'rgba(255,255,255,0.30)', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: purpleMain } }}
                      />
                    </TableCell>
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
                  {paginatedCases.map((tc) => (
                    <TableRow key={String(tc.id)} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedCaseIds.has(String(tc.id))}
                          onChange={(e) => {
                            const next = new Set(selectedCaseIds)
                            if (e.target.checked) next.add(String(tc.id))
                            else next.delete(String(tc.id))
                            setSelectedCaseIds(next)
                          }}
                          sx={{ color: 'rgba(255,255,255,0.30)', '&.Mui-checked': { color: purpleMain } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(255,255,255,0.78)' }}>{String(tc.id || '')}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.86)' }}>{String(tc.title || '')}</TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'rgba(167, 139, 250, 0.92)' }}>{String(tc.type || '')}</TableCell>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, v) => setPage(v)}
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'rgba(255,255,255,0.60)',
                    borderColor: 'rgba(255,255,255,0.10)',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(167, 139, 250, 0.20)',
                      color: purpleMain,
                      borderColor: 'rgba(167, 139, 250, 0.35)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(167, 139, 250, 0.10)',
                    },
                  },
                }}
              />
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
