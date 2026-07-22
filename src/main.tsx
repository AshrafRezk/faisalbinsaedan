import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

console.log("🚀 [Bin Saedan App] JavaScript Bundle Loaded Successfully!");

import App from './App.tsx'
import { AppThemeProvider } from './AppThemeProvider'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'
import './lib/i18n/config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
