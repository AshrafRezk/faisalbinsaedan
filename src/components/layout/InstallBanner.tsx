import { useEffect, useState } from 'react'
import { Snackbar, Alert, Button, Box, Avatar } from '@mui/material'
import { Download } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallBanner() {
  const { t } = useTranslation()
  const { installPromptEvent, setInstallPrompt } = useAppStore()
  const [isInstalled, setIsInstalled] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    if (isInstalled) return

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault()
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled, setInstallPrompt])

  const handleInstall = async () => {
    if (!installPromptEvent) return

    await installPromptEvent.prompt()
    const { outcome } = await installPromptEvent.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setInstallPrompt(null)
  }

  if (isInstalled) {
    return null
  }

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: '80px', md: '20px' } }}
    >
      <Alert
        severity="info"
        icon={false}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleInstall}
            startIcon={<Download />}
            sx={{
              color: 'white',
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: '6px',
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {t('installBanner.install')}
          </Button>
        }
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: { xs: 'auto', sm: '400px' },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: '500px' },
          '& .MuiAlert-message': {
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          },
        }}
      >
        <Avatar
          src="/appicon.png"
          alt="Bin Saedan App Icon"
          sx={{
            width: 48,
            height: 48,
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.95rem' }}>
            {t('installBanner.title')}
          </Box>
          <Box sx={{ fontSize: '0.875rem', opacity: 0.95, lineHeight: 1.5 }}>
            {t('installBanner.description')}
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  )
}

