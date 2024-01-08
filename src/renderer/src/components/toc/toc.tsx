import { MouseEvent, useEffect, useRef, useState } from 'react'

import { Typography } from '@it-incubator/ui-kit'

import s from './toc.module.scss'

import { TocNode } from './toc-node'
import { NodeData } from './toc-node.types'

type Props = {
  tocMap: NodeData
}
export const TableOfContents = ({ tocMap }: Props) => {
  const [currentHeading, setCurrentHeading] = useState('')
  const headingsObserverRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const setCurrent: IntersectionObserverCallback = entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setCurrentHeading(entry.target.id)
          break
        }
      }
    }

    const observerOptions: IntersectionObserverInit = {
      // Negative top margin accounts for `scroll-margin`.
      // Negative bottom margin means heading needs to be towards top of viewport to trigger intersection.
      rootMargin: '-60px 0% -66%',
      threshold: 1,
    }

    if (!headingsObserverRef.current) {
      headingsObserverRef.current = new IntersectionObserver(setCurrent, observerOptions)
    }

    const headingsObserver = headingsObserverRef.current

    setTimeout(() => {
      document.querySelectorAll('article :is(h2,h3,h4)').forEach(h => headingsObserver.observe(h))
    }, 100)

    return () => {
      headingsObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (headingsObserverRef.current) {
      const headingsObserver = headingsObserverRef.current

      // Disconnect and reconnect the observer to refresh it
      headingsObserver.disconnect()
      setTimeout(() => {
        document.querySelectorAll('article :is(h2,h3,h4)').forEach(h => headingsObserver.observe(h))
      }, 100)
    }
  }, [tocMap])

  const onLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    setCurrentHeading(e.currentTarget.getAttribute('href')!.replace('#', ''))
    if (headingsObserverRef.current) {
      const headingsObserver = headingsObserverRef.current

      // Disconnect and reconnect the observer to refresh it
      headingsObserver.disconnect()
      setTimeout(() => {
        document.querySelectorAll('article :is(h2,h3,h4)').forEach(h => headingsObserver.observe(h))
      }, 100)
    }
  }

  return (
    <aside className={s.toc}>
      <Typography.Subtitle2 mb={'13px'} ml={'12px'} mt={'19px'}>
        Содержание:
      </Typography.Subtitle2>
      <TocNode currentHeading={currentHeading} data={tocMap} depth={0} onLinkClick={onLinkClick} />
    </aside>
  )
}
