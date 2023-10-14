import { ComponentProps, ReactElement, useEffect, useState } from 'react'

import { IpcRendererListener } from '@electron-toolkit/preload'
import * as components from '@it-incubator/mdx-components'
import { ImagePreview, Typography } from '@it-incubator/ui-kit'
import { getMDXComponent } from 'mdx-bundler/client'

import s from './view.module.scss'

import { Pre } from './components/pre'
function App() {
  const [code, setCode] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [srcPreview, setSrcPreview] = useState<string>('')

  useEffect(() => {
    const listener: IpcRendererListener = (_event, content) => {
      setCode(content.code)
      setFileName(content.fileName)
    }

    window.electron.ipcRenderer.on('file-changed', listener)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('file-changed')
    }
  }, [])

  if (!code) {
    return null
  }

  const Component = getMDXComponent(code, { components: components })

  return (
    <div>
      <Typography.H1>{fileName}</Typography.H1>
      <article className={s.root}>
        <ImagePreview onClose={() => setSrcPreview('')} open={!!srcPreview} src={srcPreview} />
        <Component
          components={{
            code: Code,
            img: props => (
              <img
                {...props}
                onClick={() => setSrcPreview(props.src || '')}
                style={{ cursor: 'pointer' }}
              />
            ),
            pre: Pre,
          }}
        />
      </article>
    </div>
  )
}

export default App
const Code = ({ children, ...props }: ComponentProps<'code'>): ReactElement => {
  return (
    <code className={s.inline} dir={'ltr'} {...props}>
      {children}
    </code>
  )
}
