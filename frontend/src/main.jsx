/**
 * @file src/main.jsx
 * @description Application entry point. Mounts the React root into #root.
 * Imports global styles before the App component.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
