import fs from 'fs'
import path from 'node:path'
import { join } from 'path'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { bundleMdx, generateToc } from '@it-incubator/md-bundler'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import Store from 'electron-store'

import icon from '../../resources/icon.png?asset'

const chokidar = require('chokidar')
const store = new Store()

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
}

if (is.dev) {
  process.env.NODE_ENV = 'development'
} else {
  process.env.NODE_ENV = 'production'
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
let currentContent: any = null

function setupWatcher(filePath: string) {
  const isDir = fs.statSync(filePath).isDirectory()

  store.set(isDir ? 'lastOpenDir' : 'lastFilePath', filePath)
  // Close the existing watcher if it exists
  if (watcher) {
    watcher.close()
  }

  watcher = chokidar.watch(filePath, {
    ignored: path => {
      if (path.includes('node_modules')) {
        return true
      }

      // Ignore if it's not a directory and does not end with .mdx
      return !path.endsWith('.mdx') && !fs.lstatSync(path).isDirectory()
    },
    persistent: true,
  })

  const bundleAndSend = async (path: string) => {
    if (isDir) {
      const lastOpenDir = store.get('lastOpenDir') as string | undefined

      if (!lastOpenDir) {
        return
      }

      prepareAndSendDir(lastOpenDir)

      return
    }

    console.log('change', path)
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

        currentContent = newContent

        mainWindow.webContents.send('current-content', newContent)
      }
    })
    // await shell.openPath(path)
  }

  bundleAndSend(filePath)
  // Add your event listeners
  watcher
    .on('add', async (path: string) => {
      console.log('file added', path)
      await bundleAndSend(path)

      console.warn(`File ${path} has been added`)
    })
    .on('addDir', async () => {
      console.log('add dir')
      const lastOpenDir = store.get('lastOpenDir') as string | undefined

      if (!lastOpenDir) {
        return
      }

      prepareAndSendDir(lastOpenDir)
    })
    .on('unlinkDir', async () => {
      const lastOpenDir = store.get('lastOpenDir') as string | undefined

      if (!lastOpenDir) {
        return
      }

      prepareAndSendDir(lastOpenDir)
    })
    .on('change', bundleAndSend)
    .on('unlink', (path: string) => console.warn(`File ${path} has been removed`))

  const watchedPaths = watcher.getWatched()

  console.log(watchedPaths)
}

function prepareAndSendDir(dir: string) {
  console.log('prepareAndSendDir', dir)
  const files = fs.readdirSync(dir)
  const dirName = path.basename(dir)
  const data = [
    {
      children: getFilesRecursive(
        dir,
        ['.md', '.mdx'],
        ['node_modules', 'README.md'],
        true,
        dir + '/'
      ),
      name: dirName,
      path: dir,
      type: FsEntryType.Directory,
    },
  ]

  // Send the list of files to the renderer process
  mainWindow?.webContents.send('directory-contents', { data, dir, dirName, files })
  store.set('lastOpenDir', dir)
}

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
      prepareAndSendDir(pathToCheck)
      setupWatcher(pathToCheck)
    } else {
      setupWatcher(pathToCheck)
    }
  }
})

ipcMain.on('get-current-content', event => {
  event.reply('current-content', currentContent)
})
ipcMain.on('get-current-dir', () => {
  const lastOpenDir = store.get('lastOpenDir') as string | undefined

  if (!lastOpenDir) {
    return
  }
  prepareAndSendDir(lastOpenDir)
})
ipcMain.on('open-file', (_event, filePath) => {
  setupWatcher(filePath)
})
const lastFilePath = store.get('lastFilePath') as string | undefined
const lastOpenDir = store.get('lastOpenDir') as string | undefined

if (lastOpenDir) {
  prepareAndSendDir(lastOpenDir)
}

if (lastFilePath) {
  setupWatcher(lastFilePath)
}

function getFilesRecursive(
  directory: string,
  allowedExtensions: string[] = [],
  ignoredPaths: string[] = [],
  includeParent = true,
  prefix = ''
): FileOrDirectory[] {
  const fileList: FileOrDirectory[] = []

  const filesAndDirs = fs.readdirSync(directory)

  for (const fileOrDir of filesAndDirs) {
    const absolutePath = path.join(directory, fileOrDir)
    const relativePath = path.join(prefix, fileOrDir)

    // Skip dotfiles and dot directories
    if (fileOrDir.startsWith('.')) {
      continue
    }

    // Skip ignored files and directories
    if (ignoredPaths.some(ignoredPath => absolutePath.includes(ignoredPath))) {
      continue
    }

    if (fs.statSync(absolutePath).isDirectory()) {
      const nestedFiles = getFilesRecursive(
        absolutePath,
        allowedExtensions,
        ignoredPaths,
        includeParent,
        relativePath + '/'
      )

      fileList.push({
        children: nestedFiles,
        name: fileOrDir,
        path: relativePath,
        type: FsEntryType.Directory,
      })
    } else {
      const extension = path.extname(fileOrDir).toLowerCase()

      // Check the file has an allowed extension
      if (
        allowedExtensions.length === 0 ||
        allowedExtensions.map(e => e.toLowerCase()).includes(extension)
      ) {
        fileList.push({
          name: fileOrDir,
          path: relativePath,
          type: FsEntryType.File,
        })
      }
    }
  }

  return fileList
}

enum FsEntryType {
  Directory = 'directory',
  File = 'file',
}

type File = {
  name: string
  path: string
  type: FsEntryType.File
}

type Directory = {
  children: Array<FileOrDirectory>
  name: string
  path: string
  type: FsEntryType.Directory
}

type FileOrDirectory = Directory | File
