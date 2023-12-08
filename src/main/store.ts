import Store from 'electron-store'

enum StoreKey {
  CurrentContent = 'currentContent',
  CurrentDirPath = 'currentDirPath',
  CurrentFilePath = 'currentFile',
}

type StoreSchema = {
  [StoreKey.CurrentContent]: any
  [StoreKey.CurrentDirPath]: string
  [StoreKey.CurrentFilePath]: string
}

const _store = new Store<StoreSchema>()

export const store = {
  getCurrentContent(): any {
    return _store.get(StoreKey.CurrentContent)
  },
  getCurrentDirPath(): string | undefined {
    return _store.get(StoreKey.CurrentDirPath)
  },
  getCurrentFilePath(): string | undefined {
    return _store.get(StoreKey.CurrentFilePath)
  },
  setCurrentContent(content: any) {
    _store.set(StoreKey.CurrentContent, content)
  },

  setCurrentDirPath(dir: string) {
    _store.set(StoreKey.CurrentDirPath, dir)
  },
  setCurrentFilePath(filePath: string) {
    _store.set(StoreKey.CurrentFilePath, filePath)
  },
}
