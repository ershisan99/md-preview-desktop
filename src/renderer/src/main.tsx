import React from 'react'

import ReactDOM from 'react-dom/client'

import './assets/index.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@it-incubator/mdx-components/dist/style.css'
import '@it-incubator/ui-kit/dist/style.css'

import App from './App'

document.addEventListener('dragover', e => {
  e.preventDefault()
  e.stopPropagation()
})

document.addEventListener('drop', event => {
  event.preventDefault()
  event.stopPropagation()
  if (!event?.dataTransfer?.files.length) {
    return
  }
  const pathArr: string[] = []

  for (const f of event.dataTransfer.files) {
    pathArr.push(f.path) // assemble array for main.js
  }
  window.electron.ipcRenderer.sendSync('dropped-file', pathArr)
})
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
