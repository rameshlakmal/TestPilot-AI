import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon2 from '@mui/icons-material/FitScreen'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import MermaidDiagram from './MermaidDiagram'
import { purple } from './theme'

export default function DiagramDialog({
  theme,
  open, onClose,
  activeDiagram,
  diagramZoom, setDiagramZoom,
}) {
  const isDark = theme.palette.mode === 'dark'
  const purpleAccent = isDark ? purple[500] : purple[600]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
          border: '1px solid',
          borderColor: isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(124, 58, 237, 0.18)',
          borderRadius: 3,
          backgroundImage: 'none',
        }
      }}
    >
      {activeDiagram && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
            <AccountTreeIcon sx={{ color: purpleAccent, fontSize: 22 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {activeDiagram.skillTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: theme.typography.fontFamilyMonospace }}>
                {activeDiagram.skillId}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pb: 3 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 1.5 }}>
              <IconButton
                size="small"
                onClick={() => setDiagramZoom((z) => Math.max(0.25, z - 0.25))}
                disabled={diagramZoom <= 0.25}
                sx={{ color: 'text.secondary' }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Chip
                size="small"
                label={`${Math.round(diagramZoom * 100)}%`}
                sx={{
                  fontFamily: theme.typography.fontFamilyMonospace,
                  fontSize: '0.72rem',
                  height: 24,
                  minWidth: 52,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: 'text.secondary',
                }}
              />
              <IconButton
                size="small"
                onClick={() => setDiagramZoom((z) => Math.min(3, z + 0.25))}
                disabled={diagramZoom >= 3}
                sx={{ color: 'text.secondary' }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDiagramZoom(1)}
                sx={{ color: 'text.disabled', ml: 0.5 }}
                title="Reset zoom"
              >
                <RestartAltIcon2 fontSize="small" />
              </IconButton>
            </Stack>
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.10)',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.30)' : 'rgba(0, 0, 0, 0.02)',
                overflow: 'auto',
                minHeight: 200,
                maxHeight: '70vh',
                cursor: diagramZoom > 1 ? 'grab' : 'default',
              }}
            >
              <Box sx={{ transform: `scale(${diagramZoom})`, transformOrigin: 'top left', transition: 'transform 0.15s ease' }}>
                <MermaidDiagram chart={activeDiagram.diagram} />
              </Box>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  )
}
