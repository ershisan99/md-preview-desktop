import { ReactNode, useState } from 'react'

import { Header, Scrollbar, Toggle } from '@it-incubator/ui-kit'

import s from './layout.module.scss'

type Props = {
  children: ReactNode
}
export const Layout = ({ children }: Props) => {
  const [isDark, setIsDark] = useState<boolean>(false)

  const handleThemeChanged = () => {
    setIsDark(!isDark)
    document.body.classList.toggle('dark-mode', !isDark)
  }

  return (
    <>
      <Header className={s.header}>
        <div className={s.toggle}>
          Темная тема
          <Toggle checked={isDark} onCheckedChange={handleThemeChanged} />
        </div>
      </Header>
      <Scrollbar className={s.scrollbar}>
        <main className={s.main}>{children}</main>
      </Scrollbar>
    </>
  )
}
