import React from 'react'
import {
  Box, Button, Card, CardContent, Checkbox, Chip, Divider,
  FormControl, Grid, InputLabel, MenuItem, Select, Stack,
  Tab, Tabs, TextField, Typography,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import { purpleMain, modelOptions, defaultModel } from './theme'

export default function StepRequirements({
  theme,
  isSmDown,
  provider, setProvider,
  model, setModel,
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
  fetchJiraStories,
  useSelectedJiraStories,
  acceptDroppedFile,
  cancelInFlight,
  setInfo,
}) {
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
                Upload a file, paste text, or import user stories from Jira.
              </Typography>
            </Box>

            <Tabs
              value={reqInputTab}
              onChange={(_, v) => setReqInputTab(v)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                '& .MuiTabs-indicator': { backgroundColor: purpleMain },
                '& .Mui-selected': { color: purpleMain + ' !important' },
              }}
            >
              <Tab value="manual" label="Manual Input" />
              {jiraConfigured && <Tab value="jira" label="Import from Jira" />}
            </Tabs>

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
                    border: `1px dashed ${dragOver ? 'rgba(167, 139, 250, 0.70)' : 'rgba(255,255,255,0.18)'}`,
                    background: dragOver ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.14)',
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1.6, sm: 2.25 },
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 140ms ease, box-shadow 140ms ease',
                    boxShadow: dragOver ? '0 0 0 4px rgba(167, 139, 250, 0.16)' : 'none'
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
              </>
            ) : (
              <Stack spacing={2}>
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
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: 'rgba(167, 139, 250, 0.35)',
                      color: 'rgba(255,255,255,0.85)',
                      '&:hover': { borderColor: purpleMain, backgroundColor: 'rgba(167, 139, 250, 0.08)' },
                    }}
                  >
                    {jiraLoading ? 'Loading...' : 'Fetch Stories'}
                  </Button>
                )}

                {jiraStories.length > 0 && (
                  <Card sx={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
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
                            sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.50)', textTransform: 'none', minWidth: 0 }}
                          >
                            Select all
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setJiraSelectedKeys(new Set())}
                            sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.50)', textTransform: 'none', minWidth: 0 }}
                          >
                            Deselect all
                          </Button>
                        </Stack>

                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

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
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
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
                                sx={{ p: 0.5, color: 'rgba(255,255,255,0.30)', '&.Mui-checked': { color: purpleMain } }}
                              />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={story.key}
                                sx={{ fontFamily: theme.typography.fontFamilyMonospace, borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.70)', minWidth: 72, justifyContent: 'flex-start' }}
                              />
                              <Typography variant="body2" sx={{ flex: 1, color: 'rgba(255,255,255,0.85)', minWidth: 0 }} noWrap>
                                {story.summary}
                              </Typography>
                              <Chip
                                size="small"
                                label={story.status}
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 20,
                                  backgroundColor: story.status === 'Done' ? 'rgba(22,163,74,0.15)' : story.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                                  color: story.status === 'Done' ? 'rgba(22,163,74,0.9)' : story.status === 'In Progress' ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.55)',
                                }}
                              />
                              {story.priority && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={story.priority}
                                  sx={{ fontSize: '0.68rem', height: 20, borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }}
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
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.60)' }}>
                      {jiraSelectedKeys.size} {jiraSelectedKeys.size === 1 ? 'story' : 'stories'} selected
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="contained"
                      disabled={jiraLoading || jiraSelectedKeys.size === 0}
                      onClick={useSelectedJiraStories}
                      sx={{
                        backgroundColor: purpleMain,
                        '&:hover': { backgroundColor: 'rgba(167, 139, 250, 0.85)' },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Use Selected
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
        </Stack>
      </CardContent>
    </Card>
    </Stack>
  )
}
