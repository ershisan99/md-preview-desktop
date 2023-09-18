import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'node:path'
import fs from 'fs'
import { bundleMdx } from './bundle-mdx'
const chokidar = require('chokidar')

let mainWindow: BrowserWindow | null = null
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
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
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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
console.log('dirname', __dirname)
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const watcher = chokidar.watch(path.resolve(__dirname, '../../../hello.md'), {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
})

// Something to use when events are received.
const log = console.log.bind(console)
// Add event listeners.
watcher
  .on('add', (path) => log(`File ${path} has been added`))
  .on('change', (path) => {
    fs.readFile(path, 'utf8', async (err, content) => {
      if (err) {
        console.error('Error reading the file:', err)
        return
      }
      console.log('content', content)
      // Send file content to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        const bundled = await bundleMdx(content)
        // const toc = generateToc(content, {})
        mainWindow.webContents.send('file-changed', bundled)
      }
    })
  })
  .on('unlink', (path) => log(`File ${path} has been removed`))
