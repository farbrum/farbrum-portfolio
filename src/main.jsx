import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)

// ─── Service Worker — Mode hors-ligne ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ Service Worker enregistré — mode hors-ligne activé'))
      .catch((err) => console.log('SW registration failed:', err))
  })
}
