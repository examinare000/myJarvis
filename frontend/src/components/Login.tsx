import React, { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
} from '@mui/material'
import { useAuthStore } from '../store/authStore'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { login, register, isLoading, error, isAuthenticated, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    clearError()
  }, [isRegister, clearError])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          return
        }
        await register(email, password, name || undefined)
      } else {
        await login(email, password)
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  const validateForm = () => {
    if (!email || !password) return false
    if (isRegister && password !== confirmPassword) return false
    return true
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {isRegister ? 'Create Account' : 'Sign in'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isRegister
                ? 'Create your myJarvis account to get started.'
                : 'Access your myJarvis workspace with your email and password.'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          )}

          {isRegister && (
            <TextField
              label="Name (Optional)"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              autoComplete="name"
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            autoComplete={isRegister ? 'new-password' : 'email'}
            error={!email && error !== null}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            error={!password && error !== null}
            helperText={isRegister ? '8文字以上で入力してください' : undefined}
          />

          {isRegister && (
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              error={password !== confirmPassword && confirmPassword !== ''}
              helperText={
                password !== confirmPassword && confirmPassword !== ''
                  ? 'パスワードが一致しません'
                  : undefined
              }
            />
          )}

          {!isRegister && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
              }
              label="Remember me"
            />
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!validateForm() || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {isLoading
              ? (isRegister ? 'Creating Account...' : 'Signing in...')
              : (isRegister ? 'Create Account' : 'Sign in')}
          </Button>

          <Divider />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Typography>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => {
                setIsRegister(!isRegister)
                setEmail('')
                setPassword('')
                setName('')
                setConfirmPassword('')
                clearError()
              }}
              sx={{ mt: 1 }}
            >
              {isRegister ? 'Sign in here' : 'Create account here'}
            </Link>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}

export default Login
