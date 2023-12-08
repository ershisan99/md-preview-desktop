export enum FsEntryType {
  Directory = 'directory',
  File = 'file',
}

export type File = {
  name: string
  path: string
  type: FsEntryType.File
}

export type Directory = {
  children: Array<FileOrDirectory>
  name: string
  path: string
  type: FsEntryType.Directory
}

export type FileOrDirectory = Directory | File
