import { Box, Typography } from '@mui/material'

export function download(filename, content, mime) {
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

export function toCsv(suite) {
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

export function joinLines(arr) {
  const a = Array.isArray(arr) ? arr : []
  return a.map((x, i) => `${i + 1}. ${String(x)}`).join('\n')
}

export function listOrNone(arr) {
  const a = Array.isArray(arr) ? arr : []
  return a.length ? a : ['(none)']
}

export function BulletList({ items, renderItem, sx }) {
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

export function OrderedList({ items, sx }) {
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
