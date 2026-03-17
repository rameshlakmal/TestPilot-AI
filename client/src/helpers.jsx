import { Box, Typography } from '@mui/material'
import jsPDF from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
applyPlugin(jsPDF)

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

const priorityMap = { P0: 'Critical', P1: 'High', P2: 'Medium', P3: 'Low' }

export function exportPdf(suite) {
  const cases = suite && Array.isArray(suite.testCases) ? suite.testCases : []
  const title = (suite && suite.suiteTitle) || 'Test Suite'
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // ── Title ──
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageW / 2, 38, { align: 'center' })

  // ── Summary line ──
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  const counts = {}
  for (const tc of cases) {
    const p = String(tc.priority || 'P2')
    counts[p] = (counts[p] || 0) + 1
  }
  const summaryParts = [`${cases.length} test case${cases.length === 1 ? '' : 's'}`]
  for (const p of ['P0', 'P1', 'P2', 'P3']) {
    if (counts[p]) summaryParts.push(`${counts[p]} ${priorityMap[p] || p}`)
  }
  doc.text(summaryParts.join('  |  '), pageW / 2, 54, { align: 'center' })
  doc.setTextColor(0)

  // ── Priority badge colors ──
  const prioColors = {
    P0: [220, 38, 38],
    P1: [234, 88, 12],
    P2: [37, 99, 235],
    P3: [107, 114, 128],
  }

  // ── Table ──
  const rows = cases.map((tc) => {
    const steps = Array.isArray(tc.steps) ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : ''
    const expected = Array.isArray(tc.expected) ? tc.expected.map((e, i) => `${i + 1}. ${e}`).join('\n') : ''
    const pre = Array.isArray(tc.preconditions) ? tc.preconditions.join('\n') : ''
    const tags = Array.isArray(tc.coverageTags) ? tc.coverageTags.join(', ') : ''
    return [tc.id, tc.title, String(tc.priority || 'P2'), tc.type || '', pre, steps, expected, tags]
  })

  doc.autoTable({
    startY: 66,
    head: [['ID', 'Title', 'Priority', 'Type', 'Preconditions', 'Steps', 'Expected Result', 'Tags']],
    body: rows,
    styles: { fontSize: 7, cellPadding: 4, overflow: 'linebreak', lineWidth: 0.5, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [88, 28, 135], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 120 },
      2: { cellWidth: 42, halign: 'center' },
      3: { cellWidth: 52, halign: 'center' },
      4: { cellWidth: 80 },
      5: { cellWidth: 160 },
      6: { cellWidth: 140 },
      7: { cellWidth: 80, fontStyle: 'italic', fontSize: 6.5 },
    },
    didParseCell(data) {
      // Color-code priority cell
      if (data.section === 'body' && data.column.index === 2) {
        const p = String(data.cell.raw || '')
        const c = prioColors[p]
        if (c) {
          data.cell.styles.textColor = c
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    didDrawPage(data) {
      // Footer
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(7)
      doc.setTextColor(160)
      doc.text(
        `${title}  —  Page ${pageNum}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 14,
        { align: 'center' }
      )
      doc.setTextColor(0)
    },
    margin: { top: 38, bottom: 30, left: 28, right: 28 },
  })

  const slug = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 40).replace(/\s+/g, '_') || 'test-suite'
  doc.save(`${slug}.pdf`)
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
        color: 'text.primary',
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
        color: 'text.primary',
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
