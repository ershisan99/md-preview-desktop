import fs from 'fs'

import { is } from '@electron-toolkit/utils'
import { BrowserWindow, app, ipcMain } from 'electron'
import log from 'electron-log/main'

import { bundleMdxAndSend } from './bundle-mdx-and-send'
import { handleAppReady } from './handlers/handle-app-ready'
import { handleWindowAllClosed } from './handlers/handle-window-all-closed'
import { prepareAndSendDir } from './prepare-and-send-dir'
import { setupWatcher } from './setup-watcher'
import { store } from './store'

// Optional, initialize the logger for any renderer process
log.initialize()

log.info('Log from the main process')

let mainWindow: BrowserWindow | null = null

function setMainWindow(win: BrowserWindow) {
  mainWindow = win
}

if (is.dev) {
  process.env.NODE_ENV = 'development'
} else {
  process.env.NODE_ENV = 'production'
}

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
  handleAppReady(setMainWindow)()
  const currentFilePath = store.getCurrentFilePath()

  const currentDirPath = store.getCurrentDirPath()

  const currentDirExists = currentDirPath && fs.existsSync(currentDirPath)
  const currentFileExists = currentFilePath && fs.existsSync(currentFilePath)

  if (!currentDirExists && !currentFileExists) {
    store.setCurrentContent(null)

    return
  }

  if (currentDirPath) {
    prepareAndSendDir(currentDirPath, mainWindow)
    setupWatcher(currentDirPath, mainWindow)
  } else if (currentFilePath) {
    setupWatcher(currentFilePath, mainWindow)
  }
})

app.on('window-all-closed', handleWindowAllClosed)

ipcMain.on('dropped-file', (event, arg) => {
  console.warn('Dropped File(s):', arg)
  event.returnValue = `Received ${arg.length} paths.`
  if (!mainWindow) {
    throw new Error('mainWindow is not defined')
  }
  if (arg.length > 0) {
    const pathToCheck = arg[0]

    if (fs.statSync(pathToCheck).isDirectory()) {
      // If it's a directory, get the list of files
      prepareAndSendDir(pathToCheck, mainWindow)
      setupWatcher(pathToCheck, mainWindow)
    } else {
      setupWatcher(pathToCheck, mainWindow)
    }
  }
})

ipcMain.on('get-current-content', event => {
  event.reply('current-content', store.getCurrentContent())
})
ipcMain.on('get-current-dir', () => {
  const lastOpenDir = store.getCurrentDirPath()

  if (!lastOpenDir) {
    return
  }
  prepareAndSendDir(lastOpenDir, mainWindow)
})
ipcMain.on('open-file', (_event, filePath) => {
  store.setCurrentFilePath(filePath)
  bundleMdxAndSend(mainWindow)(filePath)
})

process
  .on('unhandledRejection', (reason, p) => {
    log.error('Unhandled Rejection at Promise', reason, p)
    console.error('Unhandled Rejection at Promise', reason, p)
  })
  .on('uncaughtException', err => {
    log.error('Uncaught Exception', err)

    // https://github.com/paulmillr/chokidar/issues/566
    // this has been open for over 7 years, still hasn't been fixed.
    // for some reason it doesn't even go into the chokidar error handler, so had to do it here
    if ('code' in err && err.code === 'ENOENT') {
      const lastOpenDir = store.getCurrentDirPath()

      if (!lastOpenDir) {
        return
      }
      prepareAndSendDir(lastOpenDir, mainWindow)
    } else {
      console.error(err, 'Uncaught Exception thrown')
      process.exit(1)
    }
  })

log.errorHandler.startCatching()
