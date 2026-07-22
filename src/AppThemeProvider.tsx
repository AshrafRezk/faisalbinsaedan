import { useEffect, useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { createAppTheme } from './theme'

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || i18n.language
  const isRtl = lang.startsWith('ar')
  const direction = isRtl ? 'rtl' : 'ltr'

  const theme = useMemo(() => createAppTheme(direction), [direction])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = direction
  }, [lang, direction])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
