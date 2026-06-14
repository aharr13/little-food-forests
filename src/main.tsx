import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // <--- Make sure this says .tsx (or just ./App)
import './App.css'          // <--- Make sure this matches your CSS file name
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)