import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageProvider.jsx'
import { HelmetProvider } from "react-helmet-async";
import AnalyticsTracker from './components/AnalyticsTracker'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AnalyticsTracker />

        <LanguageProvider>
          <App />
        </LanguageProvider>

      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)