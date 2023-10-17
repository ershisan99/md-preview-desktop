import { useEffect, useState } from 'react'

import { IpcRendererListener } from '@electron-toolkit/preload'
import { MdxComponent, Prose } from '@it-incubator/mdx-components'
import { ImagePreview } from '@it-incubator/ui-kit'

import s from './view.module.scss'

import { FileOrDirectory, MdxFileSelector } from '../file-selector/file-selector'
import { TableOfContents } from '../toc'

export const View = ({ setFileName }) => {
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [toc, setToc] = useState<any>({})
  const [srcPreview, setSrcPreview] = useState<string>('')

  const [directoryContents, setDirectoryContents] = useState<{
    data: FileOrDirectory[]
    dir: string
    dirName: string
    files: string[]
  } | null>(null)

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath)
    window.electron.ipcRenderer.send('open-file', filePath)
  }

  useEffect(() => {
    const contentListener: IpcRendererListener = (_event, content) => {
      if (!content) return
      setCode(content?.code)
      setFileName(content?.fileName)
      setSelectedFile(content?.fileName)
      setToc(content?.toc)
    }

    const directoryContentsListener: IpcRendererListener = (_event, content) => {
      setDirectoryContents(content)
    }

    window.electron.ipcRenderer.on('current-content', contentListener)
    window.electron.ipcRenderer.on('directory-contents', directoryContentsListener)

    window.electron.ipcRenderer.send('get-current-dir')
    window.electron.ipcRenderer.send('get-current-content')

    return () => {
      window.electron.ipcRenderer.removeAllListeners('file-changed')
      window.electron.ipcRenderer.removeAllListeners('current-content')
      window.electron.ipcRenderer.removeAllListeners('directory-contents')
    }
  }, [])

  if (!code) {
    return null
  }

  return (
    <div className={s.page}>
      <ImagePreview onClose={() => setSrcPreview('')} open={!!srcPreview} src={srcPreview} />
      <div className={s.container}>
        <div>
          {directoryContents && (
            <MdxFileSelector
              data={directoryContents.data}
              selectedMdx={selectedFile}
              setSelectedMdx={handleFileClick}
            />
          )}
        </div>
        <Prose as={'article'} className={s.root}>
          <MdxComponent code={code} onImageClick={setSrcPreview} />
        </Prose>
        <div>
          <TableOfContents tocMap={toc?.map} />
        </div>
      </div>
    </div>
  )
}
