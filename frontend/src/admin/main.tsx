import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { ThemeProvider, initThemeMode } from '../shared/theme'
import { AdminApp } from './AdminApp'

initThemeMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AdminApp />
    </ThemeProvider>
  </StrictMode>,
)
