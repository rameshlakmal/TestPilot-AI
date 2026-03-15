import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
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
  Tooltip,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import SearchIcon from '@mui/icons-material/Search'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { purple } from './theme'
import { download, toCsv, exportPdf, joinLines, BulletList, OrderedList, listOrNone } from './helpers'

const priorityColors = {
  P0: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Critical' },
  P1: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'High' },
  P2: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', label: 'Medium' },
  P3: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.25)', label: 'Low' },
}

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
  aioBaseUrl, setAioBaseUrl,
  aioToken, setAioToken,
  aioIncludeTags, setAioIncludeTags,
  aioServerConfigured,
  aioBusy, aioResult, aioStatus,
  pushToAio,
  // Diagrams
  setDiagramDialogOpen, setActiveDiagram, setDiagramZoom,
  // Nav
  goToStep,
  // Extra callbacks used inside the JSX
  cancelInFlight, setInfo, setError,
}) {
  const isDark = theme.palette.mode === 'dark'
  const purpleAccent = isDark ? purple[500] : purple[600]
  const purpleBgSubtle = isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.06)'
  const purpleBgFaint = isDark ? 'rgba(167, 139, 250, 0.03)' : 'rgba(124, 58, 237, 0.03)'
  const purpleBorder = isDark ? 'rgba(167, 139, 250, 0.20)' : 'rgba(124, 58, 237, 0.18)'
  const purpleBorderHover = isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(124, 58, 237, 0.22)'
  const subtleBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const alertMsgColor = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)'
  const alertInfoBorder = isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(124, 58, 237, 0.20)'
  const alertInfoBg = isDark ? 'rgba(167, 139, 250, 0.04)' : 'rgba(124, 58, 237, 0.04)'
  const alertSuccessBorder = isDark ? 'rgba(74, 222, 128, 0.25)' : 'rgba(22, 163, 74, 0.20)'
  const alertSuccessBg = isDark ? 'rgba(74, 222, 128, 0.04)' : 'rgba(22, 163, 74, 0.04)'
  const alertErrorBorder = isDark ? 'rgba(239, 68, 68, 0.30)' : 'rgba(220, 38, 38, 0.25)'
  const alertErrorBg = isDark ? 'rgba(239, 68, 68, 0.04)' : 'rgba(220, 38, 38, 0.04)'

  const [aioOpen, setAioOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [showAioToken, setShowAioToken] = useState(false)

  const displayedSkills = useMemo(() => {
    const list = Array.isArray(selectedSkills) ? selectedSkills.slice() : []
    list.sort((a, b) => {
      const as = a && Number.isFinite(a.score) ? a.score : 0
      const bs = b && Number.isFinite(b.score) ? b.score : 0
      return bs - as
    })
    return list
  }, [selectedSkills])

  // Summary stats
  const totalCases = suite && Array.isArray(suite.testCases) ? suite.testCases.length : 0
  const priorityCounts = useMemo(() => {
    const counts = { P0: 0, P1: 0, P2: 0, P3: 0 }
    if (suite && Array.isArray(suite.testCases)) {
      for (const tc of suite.testCases) {
        const p = String(tc.priority || 'P2')
        if (counts[p] !== undefined) counts[p]++
        else counts.P2++
      }
    }
    return counts
  }, [suite])

  const typeCounts = useMemo(() => {
    const counts = {}
    if (suite && Array.isArray(suite.testCases)) {
      for (const tc of suite.testCases) {
        const t = String(tc.type || 'functional')
        counts[t] = (counts[t] || 0) + 1
      }
    }
    return counts
  }, [suite])

  const insightsCount = useMemo(() => {
    let n = 0
    if (Array.isArray(suite && suite.missingInfoQuestions) && suite.missingInfoQuestions.length) n++
    if (Array.isArray(suite && suite.assumptions) && suite.assumptions.length) n++
    if (Array.isArray(suite && suite.risks) && suite.risks.length) n++
    if (displayedSkills.length) n++
    if (skillDiagrams.length) n++
    return n
  }, [suite, displayedSkills, skillDiagrams])

  // ─── Empty state ───
  if (!suite) {
    return (
      <Card sx={{ overflow: 'visible' }}>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: purpleBgSubtle,
              }}
            >
              <AssignmentIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>No results yet</Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', maxWidth: 320 }}>
              Go back to the Analyze step to generate test cases from your requirements.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => goToStep(1)}
              sx={{
                mt: 1,
                borderColor: 'divider',
                color: 'text.primary',
                textTransform: 'none',
                '&:hover': { borderColor: isDark ? 'rgba(167, 139, 250, 0.40)' : 'rgba(124, 58, 237, 0.30)', backgroundColor: purpleBgSubtle }
              }}
            >
              Go to Analyze
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  // ─── Results ───
  return (
    <Card sx={{ overflow: 'visible', borderColor: purpleBorder }}>
      <CardContent sx={{ p: '0 !important' }}>

        {/* ─── Header: Title + Stats + Exports ─── */}
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Stack spacing={2}>
            {/* Title row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  Test Results
                </Typography>
                <Chip
                  size="small"
                  label={`${totalCases} test case${totalCases !== 1 ? 's' : ''}`}
                  sx={{
                    height: 24,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    fontFamily: theme.typography.fontFamilyMonospace,
                    backgroundColor: isDark ? 'rgba(74, 222, 128, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                    color: isDark ? '#4ade80' : '#16a34a',
                  }}
                />
                {duplicateGroups.length > 0 && (
                  <Chip
                    size="small"
                    label={`${duplicateGroups.length} deduped`}
                    sx={{
                      height: 22,
                      fontSize: '0.70rem',
                      fontFamily: theme.typography.fontFamilyMonospace,
                      backgroundColor: 'rgba(217, 119, 6, 0.08)',
                      color: 'rgba(217, 119, 6, 0.85)',
                    }}
                  />
                )}
              </Stack>
              <Box sx={{ flex: 1 }} />
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Export as PDF">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                    onClick={() => exportPdf(suite)}
                    sx={{
                      borderColor: 'divider',
                      color: 'text.secondary',
                      textTransform: 'none',
                      fontSize: '0.80rem',
                      '&:hover': { borderColor: isDark ? 'rgba(167, 139, 250, 0.40)' : 'rgba(124, 58, 237, 0.30)', backgroundColor: purpleBgSubtle }
                    }}
                  >
                    PDF
                  </Button>
                </Tooltip>
                <Tooltip title="Export as CSV">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                    onClick={() => download('test-cases.csv', toCsv(suite), 'text/csv')}
                    sx={{
                      borderColor: 'divider',
                      color: 'text.secondary',
                      textTransform: 'none',
                      fontSize: '0.80rem',
                      '&:hover': { borderColor: isDark ? 'rgba(167, 139, 250, 0.40)' : 'rgba(124, 58, 237, 0.30)', backgroundColor: purpleBgSubtle }
                    }}
                  >
                    CSV
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Priority breakdown bar */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {['P0', 'P1', 'P2', 'P3'].map((p) => {
                const count = priorityCounts[p]
                if (!count) return null
                const conf = priorityColors[p]
                return (
                  <Chip
                    key={p}
                    size="small"
                    label={`${p} ${conf.label}: ${count}`}
                    sx={{
                      height: 22,
                      fontSize: '0.70rem',
                      fontFamily: theme.typography.fontFamilyMonospace,
                      backgroundColor: conf.bg,
                      color: conf.color,
                      border: '1px solid',
                      borderColor: conf.border,
                    }}
                  />
                )
              })}
              <Box sx={{ width: 4 }} />
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => (
                <Chip
                  key={type}
                  size="small"
                  label={`${type}: ${count}`}
                  sx={{
                    height: 22,
                    fontSize: '0.70rem',
                    fontFamily: theme.typography.fontFamilyMonospace,
                    backgroundColor: purpleBgSubtle,
                    color: isDark ? 'rgba(167, 139, 250, 0.80)' : 'rgba(124, 58, 237, 0.80)',
                  }}
                />
              ))}
            </Stack>

            {/* Meta chips — subtle */}
            {suiteMeta && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={suiteMeta.provider} sx={{ height: 20, fontSize: '0.64rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'divider', color: 'text.disabled' }} />
                <Chip size="small" variant="outlined" label={suiteMeta.model} sx={{ height: 20, fontSize: '0.64rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'divider', color: 'text.disabled' }} />
                {suiteMeta.mode && (
                  <Chip size="small" variant="outlined" label={suiteMeta.mode} sx={{ height: 20, fontSize: '0.64rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: suiteMeta.mode === 'per-skill' ? (isDark ? 'rgba(22, 163, 74, 0.20)' : 'rgba(22, 163, 74, 0.25)') : 'divider', color: suiteMeta.mode === 'per-skill' ? (isDark ? 'rgba(22, 163, 74, 0.60)' : 'rgba(22, 163, 74, 0.70)') : 'text.disabled' }} />
                )}
                {suiteMeta.repaired && (
                  <Chip size="small" variant="outlined" label="schema repaired" sx={{ height: 20, fontSize: '0.64rem', fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(217, 119, 6, 0.15)', color: 'rgba(217, 119, 6, 0.50)' }} />
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />

        {/* ─── Search / Filter Toolbar ─── */}
        <Box sx={{ px: 3, py: 1.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search title, id, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { fontSize: '0.85rem' },
              }}
              sx={{ minWidth: 200, flex: { xs: 1, md: 'unset' } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="">All types</MenuItem>
                {['functional', 'negative', 'boundary', 'security', 'accessibility', 'performance', 'usability', 'compatibility', 'resilience'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
                <MenuItem value="">All priorities</MenuItem>
                {['P0', 'P1', 'P2', 'P3'].map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                {Math.min((page - 1) * rowsPerPage + 1, filteredCases.length)}–{Math.min(page * rowsPerPage, filteredCases.length)} of {filteredCases.length}
                {filteredCases.length < totalCases ? ` (${totalCases})` : ''}
              </Typography>
              <Box sx={{ width: 8 }} />
              {[10, 50, 100].map((n) => (
                <Chip
                  key={n}
                  size="small"
                  label={n}
                  clickable
                  onClick={() => { setRowsPerPage(n); setPage(1) }}
                  sx={{
                    fontFamily: theme.typography.fontFamilyMonospace,
                    fontSize: '0.68rem',
                    height: 22,
                    backgroundColor: rowsPerPage === n ? (isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.10)') : subtleBg,
                    color: rowsPerPage === n ? purpleAccent : 'text.disabled',
                    borderColor: rowsPerPage === n ? (isDark ? 'rgba(167, 139, 250, 0.30)' : 'rgba(124, 58, 237, 0.25)') : 'transparent',
                    border: '1px solid',
                  }}
                />
              ))}
            </Stack>
          </Stack>

          {/* Selection row */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
              <Box component="span" sx={{ color: selectedCaseIds.size > 0 ? purpleAccent : 'text.disabled', fontWeight: selectedCaseIds.size > 0 ? 600 : 400 }}>
                {selectedCaseIds.size}
              </Box>{' '}
              selected
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => { if (suite && Array.isArray(suite.testCases)) setSelectedCaseIds(new Set(suite.testCases.map((tc) => String(tc.id)))) }}
              sx={{ fontSize: '0.68rem', color: 'text.disabled', textTransform: 'none', minWidth: 0, px: 0.5 }}
            >
              All
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedCaseIds(new Set())}
              sx={{ fontSize: '0.68rem', color: 'text.disabled', textTransform: 'none', minWidth: 0, px: 0.5 }}
            >
              None
            </Button>
          </Stack>
        </Box>

        {/* ─── Test Cases ─── */}
        <Box sx={{ px: 3, pb: 2 }}>
          {isSmDown ? (
            <Stack spacing={1}>
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
                    sx={{ mt: 0.75, color: 'text.disabled', '&.Mui-checked': { color: purpleAccent } }}
                  />
                  <Accordion
                    disableGutters
                    sx={{
                      flex: 1,
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.02)',
                      overflow: 'hidden',
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                      sx={{ px: 1.5, '& .MuiAccordionSummary-content': { my: 1 } }}
                    >
                      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip size="small" variant="outlined" label={String(tc.id || '')} sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.68rem', height: 20, borderColor: 'divider', color: 'text.secondary' }} />
                          <Chip size="small" label={String(tc.type || '')} sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.68rem', height: 20, backgroundColor: isDark ? 'rgba(167, 139, 250, 0.10)' : 'rgba(124, 58, 237, 0.08)', color: isDark ? 'rgba(167, 139, 250, 0.85)' : 'rgba(124, 58, 237, 0.85)' }} />
                          {tc.priority && (() => { const pc = priorityColors[tc.priority]; return pc ? <Chip size="small" label={tc.priority} sx={{ fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.68rem', height: 20, backgroundColor: pc.bg, color: pc.color }} /> : null })()}
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem', display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                          {String(tc.title || '')}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 1.5, pb: 1.5 }}>
                      <Stack spacing={1}>
                        {[
                          { label: 'PRECONDITIONS', items: tc.preconditions },
                          { label: 'STEPS', items: tc.steps },
                          { label: 'EXPECTED', items: tc.expected },
                        ].map((section) => (
                          <Box key={section.label}>
                            <Typography variant="caption" sx={{ color: isDark ? 'rgba(167, 139, 250, 0.85)' : 'rgba(124, 58, 237, 0.85)', fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.65rem', letterSpacing: '0.06em' }}>
                              {section.label}
                            </Typography>
                            <OrderedList items={section.items} sx={{ mt: 0.25 }} />
                          </Box>
                        ))}
                        {(Array.isArray(tc.coverageTags) && tc.coverageTags.length) || (Array.isArray(tc.requirementRefs) && tc.requirementRefs.length) ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {Array.isArray(tc.coverageTags) && tc.coverageTags.slice(0, 12).map((t) => (
                              <Chip key={String(t)} size="small" label={String(t)} sx={{ height: 20, fontSize: '0.64rem', backgroundColor: purpleBgSubtle, color: 'text.secondary' }} />
                            ))}
                            {Array.isArray(tc.requirementRefs) && tc.requirementRefs.slice(0, 6).map((r) => (
                              <Chip key={String(r)} size="small" variant="outlined" label={String(r)} sx={{ height: 20, fontSize: '0.64rem', borderColor: 'divider', color: 'text.secondary' }} />
                            ))}
                          </Stack>
                        ) : null}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'auto', background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.01)' }}>
              <Table size="small" sx={{ minWidth: 1100 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: isDark ? 'rgba(8, 8, 8, 0.96)' : 'rgba(245, 243, 255, 0.96)', borderBottomColor: 'divider' }}>
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
                        sx={{ color: 'text.disabled', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: purpleAccent } }}
                      />
                    </TableCell>
                    {['ID', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Expected', 'Tags', 'Req refs'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: isDark ? 'rgba(8, 8, 8, 0.96)' : 'rgba(245, 243, 255, 0.96)',
                          borderBottomColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontFamily: ['ID', 'Type', 'Priority'].includes(h) ? theme.typography.fontFamilyMonospace : undefined, fontSize: '0.70rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCases.map((tc) => {
                    const selected = selectedCaseIds.has(String(tc.id))
                    return (
                      <TableRow
                        key={String(tc.id)}
                        hover
                        sx={{
                          backgroundColor: selected ? purpleBgFaint : 'transparent',
                          '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selected}
                            onChange={(e) => {
                              const next = new Set(selectedCaseIds)
                              if (e.target.checked) next.add(String(tc.id))
                              else next.delete(String(tc.id))
                              setSelectedCaseIds(next)
                            }}
                            sx={{ color: 'text.disabled', '&.Mui-checked': { color: purpleAccent } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'text.secondary', fontSize: '0.80rem' }}>{String(tc.id || '')}</TableCell>
                        <TableCell sx={{ color: 'text.primary', fontSize: '0.82rem' }}>{String(tc.title || '')}</TableCell>
                        <TableCell sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: isDark ? 'rgba(167, 139, 250, 0.85)' : 'rgba(124, 58, 237, 0.85)', fontSize: '0.80rem' }}>{String(tc.type || '')}</TableCell>
                        <TableCell>
                          {tc.priority && (() => {
                            const pc = priorityColors[tc.priority]
                            return pc ? (
                              <Chip size="small" label={tc.priority} sx={{ height: 20, fontSize: '0.68rem', fontFamily: theme.typography.fontFamilyMonospace, fontWeight: 700, backgroundColor: pc.bg, color: pc.color, minWidth: 30 }} />
                            ) : (
                              <Typography variant="caption" sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'text.secondary' }}>{String(tc.priority)}</Typography>
                            )
                          })()}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'text.secondary', fontSize: '0.78rem' }}>{joinLines(tc.preconditions)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'text.secondary', fontSize: '0.78rem' }}>{joinLines(tc.steps)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-line', color: 'text.secondary', fontSize: '0.78rem' }}>{joinLines(tc.expected)}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>{Array.isArray(tc.coverageTags) ? tc.coverageTags.join(', ') : ''}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>{Array.isArray(tc.requirementRefs) ? tc.requirementRefs.join(', ') : ''}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ pt: 1.5 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, v) => setPage(v)}
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'text.secondary',
                    borderColor: 'divider',
                    '&.Mui-selected': { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.18)' : 'rgba(124, 58, 237, 0.12)', color: purpleAccent, borderColor: isDark ? 'rgba(167, 139, 250, 0.30)' : 'rgba(124, 58, 237, 0.25)' },
                    '&:hover': { backgroundColor: purpleBgSubtle },
                  },
                }}
              />
            </Stack>
          )}
        </Box>

        {/* ─── Collapsible: Insights (Skills, Risks, Assumptions, Missing Info, Diagrams) ─── */}
        <Box
          onClick={() => setInsightsOpen((o) => !o)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mx: 2.5,
            my: 1.5,
            px: 1.5,
            py: 1.25,
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: 2,
            border: '1px solid',
            borderColor: insightsOpen ? purpleBorder : 'divider',
            backgroundColor: insightsOpen ? purpleBgFaint : subtleBg,
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: purpleBgSubtle,
              borderColor: purpleBorderHover,
            },
          }}
        >
          <ExpandMoreIcon sx={{ color: 'text.disabled', fontSize: 20, transform: insightsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)' }} />
          <InfoOutlinedIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.secondary' }}>
            Insights & Details
          </Typography>
          {!insightsOpen && insightsCount > 0 && (
            <Chip size="small" label={`${insightsCount} sections`} sx={{ height: 20, fontSize: '0.64rem', backgroundColor: subtleBg, color: 'text.disabled' }} />
          )}
          <Box sx={{ flex: 1 }} />
        </Box>

        <Collapse in={insightsOpen} timeout={300}>
          <Box sx={{ px: 3, pb: 2 }}>
            <Stack spacing={0}>
              {[
                {
                  key: 'skills',
                  label: `Selected Skills (${displayedSkills.length})`,
                  content: (
                    <BulletList
                      items={listOrNone(displayedSkills)}
                      renderItem={(s) => {
                        if (typeof s === 'string') return <Typography variant="body2">{s}</Typography>
                        const score = Number.isFinite(s.score) ? s.score : null
                        const reason = s.reason && typeof s.reason === 'object' ? s.reason : null
                        const alwaysInclude = Boolean(reason && reason.alwaysInclude)
                        const matched = Array.isArray(reason && reason.matched) ? reason.matched : []
                        const boosts = Array.isArray(reason && reason.boosts) ? reason.boosts : []
                        const scoreLabel = score !== null ? `match score: ${score}` : ''
                        const why = alwaysInclude
                          ? ['baseline (always included)', scoreLabel].filter(Boolean).join(' | ')
                          : [scoreLabel, matched.length ? `matched: ${matched.join(', ')}` : '', boosts.length ? `boosts: ${boosts.map((b) => (b && b.tag ? `${b.hint}->${b.tag}` : String(b))).join(', ')}` : ''].filter(Boolean).join(' | ')
                        return (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              <Box component="span" sx={{ fontFamily: theme.typography.fontFamilyMonospace, color: 'text.secondary' }}>{String(s.id)}</Box>
                              {' — '}{String(s.title)}
                            </Typography>
                            {why && <Typography variant="caption" sx={{ display: 'block', mt: 0.2, color: 'text.disabled', fontFamily: theme.typography.fontFamilyMonospace, fontSize: '0.72rem' }}>{why}</Typography>}
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
                  sx={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                    '&:not(:last-child)': { borderBottom: 'none' },
                    '&:first-of-type': { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                    '&:last-of-type': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'text.disabled' }} />}
                    sx={{ px: 2, '& .MuiAccordionSummary-content': { my: 0.75 } }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>{card.label}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pb: 1.5 }}>
                    {card.content}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>

            {/* Diagrams */}
            {skillDiagrams.length > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, backgroundColor: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.08)' }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <AccountTreeIcon sx={{ color: purpleAccent, fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>
                    Technique Diagrams
                  </Typography>
                  <Chip size="small" label={`${skillDiagrams.length}`} sx={{ height: 18, fontSize: '0.62rem', fontFamily: theme.typography.fontFamilyMonospace, backgroundColor: isDark ? 'rgba(167, 139, 250, 0.10)' : 'rgba(124, 58, 237, 0.08)', color: purpleAccent }} />
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {skillDiagrams.map((d) => (
                    <Chip
                      key={d.skillId}
                      size="small"
                      clickable
                      icon={<AccountTreeIcon sx={{ fontSize: '14px !important', color: `${purpleAccent} !important` }} />}
                      label={d.skillTitle}
                      onClick={() => { setActiveDiagram(d); setDiagramZoom(1); setDiagramDialogOpen(true) }}
                      sx={{
                        height: 28,
                        fontSize: '0.76rem',
                        backgroundColor: purpleBgSubtle,
                        color: 'text.primary',
                        border: '1px solid',
                        borderColor: purpleBorder,
                        '&:hover': { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.14)' : 'rgba(124, 58, 237, 0.10)', borderColor: isDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.30)' },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* ─── Collapsible: Push to AIO ─── */}
        <Box
          onClick={() => setAioOpen((o) => !o)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mx: 2.5,
            mt: 0,
            mb: 2,
            px: 1.5,
            py: 1.25,
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: 2,
            border: '1px solid',
            borderColor: aioOpen ? purpleBorder : 'divider',
            backgroundColor: aioOpen ? purpleBgFaint : subtleBg,
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: purpleBgSubtle,
              borderColor: purpleBorderHover,
            },
          }}
        >
          <ExpandMoreIcon sx={{ color: 'text.disabled', fontSize: 20, transform: aioOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)' }} />
          <CloudUploadIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.secondary' }}>
            Push to AIO Tests
          </Typography>
          {aioServerConfigured && !aioOpen && (
            <Chip size="small" icon={<CheckCircleIcon sx={{ color: '#4ade80 !important', fontSize: 12 }} />} label="configured" sx={{ height: 20, fontSize: '0.62rem', backgroundColor: isDark ? 'rgba(74, 222, 128, 0.06)' : 'rgba(22, 163, 74, 0.06)', color: isDark ? 'rgba(74, 222, 128, 0.70)' : 'rgba(22, 163, 74, 0.70)', '& .MuiChip-icon': { ml: 0.5 } }} variant="outlined" />
          )}
          {aioStatus === 'success' && !aioOpen && (
            <Chip size="small" icon={<CheckCircleIcon sx={{ color: '#4ade80 !important', fontSize: 12 }} />} label="pushed" sx={{ height: 20, fontSize: '0.62rem', backgroundColor: isDark ? 'rgba(74, 222, 128, 0.06)' : 'rgba(22, 163, 74, 0.06)', color: isDark ? 'rgba(74, 222, 128, 0.70)' : 'rgba(22, 163, 74, 0.70)', '& .MuiChip-icon': { ml: 0.5 } }} variant="outlined" />
          )}
          <Box sx={{ flex: 1 }} />
        </Box>

        <Collapse in={aioOpen} timeout={300}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                  Create a folder (if needed) and push test cases to AIO.
                </Typography>
                <Box sx={{ flex: 1 }} />
                <FormControlLabel
                  control={<Switch checked={aioIncludeTags} onChange={(e) => setAioIncludeTags(e.target.checked)} size="small" sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: purpleAccent }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: purpleAccent } }} />}
                  label={<Typography variant="caption" sx={{ fontSize: '0.78rem' }}>Include tags</Typography>}
                  sx={{ mr: 0 }}
                />
              </Stack>

              {aioServerConfigured ? (
                <Alert
                  severity="success"
                  variant="outlined"
                  icon={<CheckCircleIcon sx={{ color: '#4ade80' }} />}
                  sx={{ borderColor: alertSuccessBorder, backgroundColor: alertSuccessBg, '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.80rem' } }}
                >
                  AIO is configured on the server. You can push test cases directly.
                </Alert>
              ) : (
                <>
                  <Alert
                    severity="info"
                    variant="outlined"
                    icon={<InfoOutlinedIcon sx={{ color: isDark ? 'rgba(167, 139, 250, 0.7)' : 'rgba(124, 58, 237, 0.7)' }} />}
                    sx={{ borderColor: alertInfoBorder, backgroundColor: alertInfoBg, '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.80rem' } }}
                  >
                    Enter your AIO base URL and API token to push test cases.
                  </Alert>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <TextField size="small" label="AIO Base URL" placeholder="https://tcms.aiojiraapps.com/aio-tcms" value={aioBaseUrl} onChange={(e) => setAioBaseUrl(e.target.value)} fullWidth InputProps={{ sx: { fontSize: '0.85rem' } }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        size="small" label="AIO API Token" placeholder="Your AIO API token" type={showAioToken ? 'text' : 'password'}
                        value={aioToken} onChange={(e) => setAioToken(e.target.value)} fullWidth
                        InputProps={{
                          sx: { fontSize: '0.85rem' },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowAioToken(!showAioToken)} edge="end" sx={{ color: 'text.disabled' }}>
                                {showAioToken ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField size="small" label="Jira project key/id" placeholder="e.g., AT" value={aioProject} onChange={(e) => setAioProject(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField size="small" label="Folder path (optional)" placeholder="Release 1.0 / Regression / Checkout" value={aioFolder} onChange={(e) => setAioFolder(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="contained"
                      disabled={aioBusy || (!aioServerConfigured && (!aioBaseUrl.trim() || !aioToken.trim()))}
                      onClick={pushToAio}
                      fullWidth
                      sx={{
                        backgroundColor: purple[600],
                        color: '#fff',
                        '&:hover': { backgroundColor: purple[700] },
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {aioBusy ? 'Pushing...' : 'Push to AIO'}
                    </Button>
                    {aioBusy && (
                      <Button variant="text" size="small" onClick={() => { cancelInFlight(); setInfo('Cancelling...') }} sx={{ color: 'text.secondary', textTransform: 'none', whiteSpace: 'nowrap' }}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>

              {aioStatus === 'success' && aioResult && (
                <Alert
                  severity="success" variant="outlined" icon={<CheckCircleIcon sx={{ color: '#4ade80' }} />}
                  action={
                    <IconButton size="small" onClick={async () => { try { await navigator.clipboard.writeText(aioResult); setInfo('Copied.') } catch { setError('Copy failed.') } }} sx={{ color: 'text.secondary' }}>
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  }
                  sx={{ borderColor: alertSuccessBorder, backgroundColor: alertSuccessBg, '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' } }}
                >
                  {aioResult}
                </Alert>
              )}

              {aioStatus === 'error' && aioResult && (
                <Alert
                  severity="error" variant="outlined"
                  sx={{ borderColor: alertErrorBorder, backgroundColor: alertErrorBg, '& .MuiAlert-message': { color: alertMsgColor, fontSize: '0.82rem' } }}
                >
                  {aioResult}
                </Alert>
              )}
            </Stack>
          </Box>
        </Collapse>

      </CardContent>
    </Card>
  )
}
