import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { purpleMain, purpleDeep } from './theme'

const API = import.meta.env.VITE_API_URL || ''

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed.')
        return
      }

      onLogin({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      })
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#111',
          borderRadius: 3,
          boxShadow: '0 24px 80px rgba(0,0,0,0.60)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${purpleMain}, ${purpleDeep})`,
              boxShadow: '0 0 0 6px rgba(167, 139, 250, 0.15)'
            }}
          >
            <LockOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.50)' }}>
            Sign in to TestPilot AI
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            autoComplete="email"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'rgba(255,255,255,0.50)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.4,
              backgroundImage: 'none',
              backgroundColor: purpleMain,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.30), 0 22px 70px rgba(0,0,0,0.45)',
              '&:hover': { backgroundColor: purpleDeep },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(167, 139, 250, 0.3)',
                color: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
