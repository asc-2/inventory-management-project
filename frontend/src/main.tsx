// this file starts the default typescript starter app.
// it is separate from the jsx inventory entry file.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// this mounts the typescript starter app into the root element.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
