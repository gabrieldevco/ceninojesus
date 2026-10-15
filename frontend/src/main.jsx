import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider, RequestsProvider, ToastProvider } from './store'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><RequestsProvider><ToastProvider><App /></ToastProvider></RequestsProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
