import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

console.log("🚀 [Bin Saedan App] JavaScript Bundle Loaded Successfully!");

import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'
import './lib/i18n/config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
