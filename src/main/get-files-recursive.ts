import fs from 'fs'
import path from 'node:path'

import { FileOrDirectory, FsEntryType } from './types'

export function getFilesRecursive(
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
