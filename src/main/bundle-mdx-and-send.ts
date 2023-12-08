import fs from 'fs'

import { bundleMdx, generateToc } from '@it-incubator/md-bundler'
import { BrowserWindow } from 'electron'

import { store } from './store'

export const bundleMdxAndSend = (mainWindow: BrowserWindow | null) => async (path: string) => {
  const currentFilePath = store.getCurrentFilePath()

  if (currentFilePath !== path) {
    return
  }
  fs.readFile(path, 'utf8', async (err, content) => {
    if (err) {
      console.error('Error reading the file:', err)

      return
    }
    // Send file content to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bundled = await bundleMdx(content)
      const toc = await generateToc(content, {})
      const newContent = { ...bundled, fileName: path, toc }

      store.setCurrentContent(newContent)

      mainWindow.webContents.send('current-content', newContent)
    }
  })
}
