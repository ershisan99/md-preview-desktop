import { ComponentProps, ReactElement, useEffect, useState } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import s from './view.module.scss'
import { Pre } from './components/pre'
import { ImagePreview } from '@it-incubator/ui-kit'
function App() {
  const [code, setCode] = useState<any>()
  const [srcPreview, setSrcPreview] = useState<string>('')
  console.log(code)
  useEffect(() => {
    const listener = (event, content) => {
      console.log('file-changed', event, content)
      setCode(content.code)
    }
    console.log(window.electron)
    window.electron.ipcRenderer.on('file-changed', listener)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('file-changed')
    }
  }, [])
  if (!code) return null
  const Component = getMDXComponent(code)
  return (
    <article className={s.root}>
      <ImagePreview open={!!srcPreview} src={srcPreview} onClose={() => setSrcPreview('')} />
      <Component
        components={{
          code: Code,
          pre: Pre,
          img: (props) => (
            <img
              {...props}
              onClick={() => setSrcPreview(props.src || '')}
              style={{ cursor: 'pointer' }}
            />
          )
        }}
      />
    </article>
  )
}

export default App
const Code = ({ children, ...props }: ComponentProps<'code'>): ReactElement => {
  return (
    <code className={s.inline} dir="ltr" {...props}>
      {children}
    </code>
  )
}
