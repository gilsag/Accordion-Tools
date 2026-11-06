/*
  React entry point.

  This mounts the App component into the root element defined in index.html.
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadInterfaceCatalog } from './i18n/catalog'
import { initialInterfaceLanguage } from './settings/useLanguageSettings'

function mount() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Only the English catalog is in the startup bundle. Load the visitor's own
// language first (a small chunk) so the first render is already translated;
// if that load fails, mount anyway and fall back to English.
loadInterfaceCatalog(initialInterfaceLanguage()).then(mount, mount)
