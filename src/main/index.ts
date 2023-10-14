import fs from 'fs'
import path from 'node:path'
import { join } from 'path'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, ipcMain, shell } from 'electron'

import icon from '../../resources/icon.png?asset'
import { bundleMdx } from './bundle-mdx'
const chokidar = require('chokidar')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let watcher: any = null

function setupWatcher(filePath: string) {
  // Close the existing watcher if it exists
  if (watcher) {
    watcher.close()
  }

  watcher = chokidar.watch(filePath, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  })

  const bundleAndSend = async (path: string) => {
    fs.readFile(path, 'utf8', async (err, content) => {
      if (err) {
        console.error('Error reading the file:', err)

        return
      }
      // Send file content to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        const bundled = await bundleMdx(content)

        mainWindow.webContents.send('file-changed', { ...bundled, fileName: path })
      }
    })
    await shell.openPath(path)
  }

  // Add your event listeners
  watcher
    .on('add', async (path: string) => {
      await bundleAndSend(path)

      console.warn(`File ${path} has been added`)
    })
    .on('change', bundleAndSend)
    .on('unlink', (path: string) => console.warn(`File ${path} has been removed`))
}

ipcMain.on('dropped-file', (event, arg) => {
  console.warn('Dropped File(s):', arg)
  event.returnValue = `Received ${arg.length} paths.` // Synchronous reply

  // Assuming the user only dropped one file, update the watcher to watch that file.
  if (arg.length > 0) {
    setupWatcher(arg[0])
  }
})

// Initially setup watcher for 'hello.md'
setupWatcher(path.resolve(__dirname, '../../../hello.md'))
