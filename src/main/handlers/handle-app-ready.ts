import { electronApp, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app } from 'electron'

import { createWindow } from '../create-window'

export function handleAppReady(onMainWindowCreated: (win: BrowserWindow) => void) {
  return () => {
    electronApp.setAppUserModelId('com.electron')
    onMainWindowCreated(createWindow())

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        onMainWindowCreated(createWindow())
      }
    })
  }
}
