import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight, Construction } from 'lucide-react'
import { useAppStore } from '../lib/store/app-store'
import AnimatedBackground from '../components/layout/AnimatedBackground'

export default function ComingSoon() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const { authorizeMaintenance } = useAppStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = authorizeMaintenance(password)
    if (!success) {
      setError(true)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#2a3441', // Dark blue-gray base
        overflow: 'hidden',
      }}
    >
      {/* Animated Boxes Background */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <AnimatedBackground variant="geometric" />
      </Box>

      {/* Subtle Overlay to ensure text readability */}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(42, 52, 65, 0.7)' }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 5,
            }}
          >
            <motion.img
              src="/BinSaedanLogo-White.png"
              alt="Bin Saedan"
              style={{ height: '90px', marginBottom: '32px' }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '3rem', md: '4rem' },
                fontFamily: '"PP Neue Montreal Arabic", system-ui, sans-serif',
              }}
            >
              قريباً
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#d09b30', // Gold color
                fontWeight: 600,
                mb: 4,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                fontSize: '1.25rem'
              }}
            >
              Coming Soon
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                mb: 1,
                fontSize: '1.1rem',
                fontFamily: '"PP Neue Montreal Arabic", system-ui, sans-serif',
              }}
              dir="rtl"
            >
              نحن نعمل على تطوير تجربة عقارية رقمية استثنائية تليق بكم.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem',
              }}
            >
              We are working on developing an exceptional digital real estate experience for you.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 500,
                  }}
                >
                  Enter Access Password <Lock size={16} />
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    borderRadius: '12px',
                    minWidth: '64px',
                    height: '56px',
                    bgcolor: '#d09b30',
                    color: 'white',
                    '&:hover': { bgcolor: '#b88625' },
                    boxShadow: 'none',
                  }}
                >
                  <ArrowRight size={24} />
                </Button>
                
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error}
                  dir="rtl" // Right-to-left to match screenshot dots on the right
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      height: '56px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d09b30',
                      },
                    },
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      letterSpacing: '4px',
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="start"
                          sx={{ color: 'rgba(255, 255, 255, 0.4)', mr: -1 }}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2,
                        borderRadius: '12px',
                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                        color: '#ffcdd2',
                        border: '1px solid rgba(211, 47, 47, 0.3)',
                        '& .MuiAlert-icon': { color: '#ffcdd2' },
                      }}
                    >
                      Incorrect password. Please try again.
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Paper>

          <Box
            sx={{
              mt: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
              Under Development by Bin Saedan Team
            </Typography>
            <Construction size={16} opacity={0.7} />
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}
