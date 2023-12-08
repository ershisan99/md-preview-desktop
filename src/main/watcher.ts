import fs from 'fs'

import chokidar, { FSWatcher } from 'chokidar'

class FileWatcher {
  private static instance: FileWatcher
  private pathsToWatch: string[]
  private watcher: FSWatcher | null

  private constructor() {
    this.pathsToWatch = []
    this.watcher = null
  }

  public static getInstance(): FileWatcher {
    if (!FileWatcher.instance) {
      FileWatcher.instance = new FileWatcher()
    }

    return FileWatcher.instance
  }

  public close(): void {
    if (this.watcher) {
      this.watcher
        .close()
        .then(() => {
          console.log('File watcher closed successfully.')
        })
        .catch(error => {
          console.error('Error closing file watcher:', error)
        })
      this.watcher = null
    }
  }

  public on(event: string, callback: (path: string) => void): void {
    this.watcher?.on(event, callback)
  }

  public setPaths(paths: string[]): void {
    this.pathsToWatch = paths
  }

  public start(): void {
    if (!this.watcher) {
      this.watcher = chokidar.watch(this.pathsToWatch, {
        ignored: path => {
          if (path.includes('node_modules')) {
            return true
          }
          if (path.match(/(^|[/\\])\../)) {
            return true
          }

          // Ignore if it's not a directory and does not end with .mdx
          return !path.endsWith('.mdx') && !fs.lstatSync(path).isDirectory()
        },
      })
    }
  }
}

export default FileWatcher
