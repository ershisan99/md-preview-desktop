import { FileTree } from '@it-incubator/ui-kit'

import s from './file-selector.module.scss'

export enum EntryType {
  Directory = 'directory',
  File = 'file',
}

export type FileOrDirectory = {
  children?: FileOrDirectory[]
  name: string
  path: string
  type: EntryType
}

type Props = {
  data: FileOrDirectory[]
  selectedMdx: string
  setSelectedMdx: (s: string) => void
}
export const MdxFileSelector = ({ data, selectedMdx, setSelectedMdx }: Props) => {
  console.log(data)

  return (
    <div className={s.container}>
      <FileTree>
        {data?.map((item, index) => {
          return (
            <RenderItem
              isFirst={index === 0 && !selectedMdx}
              item={item}
              key={item.path}
              onFileClick={setSelectedMdx}
              selectedItemPath={selectedMdx}
            />
          )
        })}
      </FileTree>
    </div>
  )
}

const shouldOpenFolder = (dirPath: string, filePath: string): boolean => {
  return filePath.startsWith(dirPath)
}

type RenderItemProps = {
  isFirst?: boolean
  item: FileOrDirectory
  onFileClick: (path: string) => void
  selectedItemPath: string
}

const RenderItem = ({ isFirst, item, onFileClick, selectedItemPath }: RenderItemProps) => {
  const isOpen = selectedItemPath ? shouldOpenFolder(item.path, selectedItemPath) : isFirst

  if (item.type === EntryType.Directory) {
    return (
      <FileTree.Folder defaultOpen={isOpen} name={item.name}>
        {item.children &&
          item.children.map(childItem => (
            <RenderItem
              item={childItem}
              key={childItem.path}
              onFileClick={onFileClick}
              selectedItemPath={selectedItemPath}
            />
          ))}
      </FileTree.Folder>
    )
  }

  const handleFileSelected = () => {
    onFileClick(item.path)
  }

  const isSelected = selectedItemPath === item.path

  return <FileTree.File active={isSelected} name={item.name} onClick={handleFileSelected} />
}
