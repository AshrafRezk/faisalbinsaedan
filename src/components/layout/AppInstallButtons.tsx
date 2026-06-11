import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { Apple, Shop } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'

export default function AppInstallButtons() {
  const { t } = useTranslation()
  const { installPromptEvent } = useAppStore()
  const [iosModalOpen, setIosModalOpen] = useState(false)

  // Detect iOS to conditionally show instructions or just show it anyway for the Apple button
  const isIos = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

  const handleAndroidClick = async () => {
    if (installPromptEvent) {
      // Trigger the native PWA prompt
      await installPromptEvent.prompt()
    } else {
      // If it's already installed or not supported, maybe show a toast or alert
      // But typically we do nothing or show a fallback message
      alert(t('installBanner.androidFallback', 'To install the app, use the "Add to Home Screen" option in your browser menu.'))
    }
  }

  const handleIosClick = () => {
    // iOS Safari does not support the beforeinstallprompt event.
    // Must instruct user to manually add to home screen.
    setIosModalOpen(true)
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Button
        variant="contained"
        startIcon={<Shop />}
        onClick={handleAndroidClick}
        sx={{
          bgcolor: '#000',
          color: '#fff',
          textTransform: 'none',
          borderRadius: 2,
          px: 3,
          py: 1,
          '&:hover': { bgcolor: '#333' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8, lineHeight: 1 }}>
            {t('installBanner.getItOn', 'GET IT ON')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            Google Play
          </Typography>
        </Box>
      </Button>

      <Button
        variant="contained"
        startIcon={<Apple />}
        onClick={handleIosClick}
        sx={{
          bgcolor: '#000',
          color: '#fff',
          textTransform: 'none',
          borderRadius: 2,
          px: 3,
          py: 1,
          '&:hover': { bgcolor: '#333' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8, lineHeight: 1 }}>
            {t('installBanner.downloadOnThe', 'Download on the')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            App Store
          </Typography>
        </Box>
      </Button>

      {/* iOS Instructions Modal */}
      <Dialog open={iosModalOpen} onClose={() => setIosModalOpen(false)}>
        <DialogTitle>{t('installBanner.iosInstallTitle', 'Install on iOS')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('installBanner.iosInstallBody', 'To install this app on your iPhone or iPad, tap the Share button at the bottom of Safari, then tap "Add to Home Screen".')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            {/* Simple icon to represent the share button */}
            <Box component="span" sx={{ fontSize: '2rem' }}>⬆️</Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIosModalOpen(false)}>{t('common.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
