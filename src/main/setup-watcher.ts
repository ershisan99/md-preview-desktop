import fs from 'fs'

import { BrowserWindow } from 'electron'

import { bundleMdxAndSend } from './bundle-mdx-and-send'
import { prepareAndSendDir } from './prepare-and-send-dir'
import { store } from './store'
import FileWatcher from './watcher'

export async function setupWatcher(filePath: string, mainWindow: BrowserWindow | null) {
  const fileWatcher = FileWatcher.getInstance()
  const lastOpenDir = store.getCurrentDirPath()

  const isDir = fs.statSync(filePath).isDirectory()

  const path = isDir ? filePath : lastOpenDir || filePath

  fileWatcher.close()
  fileWatcher.setPaths([path])
  fileWatcher.start()

  fileWatcher.on('add', reloadDirs(mainWindow))
  fileWatcher.on('addDir', reloadDirs(mainWindow))
  fileWatcher.on('unlinkDir', reloadDirs(mainWindow))
  fileWatcher.on('change', bundleMdxAndSend(mainWindow))
  fileWatcher.on('unlink', reloadDirs(mainWindow))
}

function reloadDirs(mainWindow: BrowserWindow | null) {
  return () => {
    const lastOpenDir = store.getCurrentDirPath()

    if (!lastOpenDir) {
      return
    }

    prepareAndSendDir(lastOpenDir, mainWindow)
  }
}
