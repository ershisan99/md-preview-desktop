import { join } from 'path'

import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'

import icon from '../../resources/icon.png?asset'

export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    height: 670,
    show: false,
    width: 900,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)

    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
