import { ReactNode, useState } from 'react'

import { Button, Header, Scrollbar, Typography } from '@it-incubator/ui-kit'

import s from './layout.module.scss'

type Props = {
  children: ReactNode
  fileName: string
}
export const Layout = ({ children, fileName }: Props) => {
  const [isDark, setIsDark] = useState<boolean>(false)

  const handleThemeChanged = () => {
    setIsDark(!isDark)
    document.body.classList.toggle('dark-mode', !isDark)
  }

  return (
    <>
      <Header>
        <Typography.H1>{fileName}</Typography.H1>
        <Button onClick={() => handleThemeChanged()}>Toggle theme</Button>
      </Header>
      <Scrollbar className={s.scrollbar}>
        <main className={s.main}>{children}</main>
      </Scrollbar>
    </>
  )
}
