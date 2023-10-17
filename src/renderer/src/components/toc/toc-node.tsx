import { MouseEvent } from 'react'

import { clsx } from 'clsx'

import s from './toc-node.module.scss'

import { NodeData } from './toc-node.types'

interface NodeProps {
  currentHeading?: string
  data: NodeData
  depth: number
  onLinkClick: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function TocNode({ currentHeading, data, depth, onLinkClick }: NodeProps) {
  if (!data) {
    return null
  }

  switch (data.type) {
    case 'list':
      return (
        <ul className={s.list}>
          {data.children.map((child, index) => (
            <TocNode
              currentHeading={currentHeading}
              data={child}
              depth={depth}
              key={index}
              onLinkClick={onLinkClick}
            />
          ))}
        </ul>
      )
    case 'listItem':
      return (
        <li className={s.listItem}>
          {data.children.map((child, index) => (
            <TocNode
              currentHeading={currentHeading}
              data={child}
              depth={depth + 1}
              key={index}
              onLinkClick={onLinkClick}
            />
          ))}
        </li>
      )
    case 'paragraph':
      return (
        <>
          {data.children.map((child, index) => (
            <TocNode
              currentHeading={currentHeading}
              data={child}
              depth={depth}
              key={index}
              onLinkClick={onLinkClick}
            />
          ))}
        </>
      )
    case 'link':
      return (
        <a
          className={clsx(s.link, data.url === `#${currentHeading}` && s.active)}
          data-depth={depth}
          href={data.url}
          onClick={onLinkClick}
          title={data.title ?? undefined}
        >
          {data.children.map((child, index) => (
            <TocNode
              currentHeading={currentHeading}
              data={child}
              depth={depth}
              key={index}
              onLinkClick={onLinkClick}
            />
          ))}
        </a>
      )
    case 'text':
      return <>{data.value}</>
    default:
      return null
  }
}
