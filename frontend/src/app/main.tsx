import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Proveedores } from './Proveedores'
import './styles.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No se encontró el elemento #root')

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <Proveedores>
        <App />
      </Proveedores>
    </BrowserRouter>
  </StrictMode>,
)
