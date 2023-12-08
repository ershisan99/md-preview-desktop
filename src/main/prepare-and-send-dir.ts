import fs from 'fs'
import path from 'node:path'

import { type BrowserWindow } from 'electron'

import { getFilesRecursive } from './get-files-recursive'
import { store } from './store'
import { FsEntryType } from './types'

export function prepareAndSendDir(dir: string, mainWindow: BrowserWindow | null) {
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
  store.setCurrentDirPath(dir)
}
