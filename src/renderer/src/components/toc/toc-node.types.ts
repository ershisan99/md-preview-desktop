export type TextNode = {
  type: 'text'
  value: string
}

export type LinkNode = {
  children: Array<TextNode>
  title: null | string
  type: 'link'
  url: string
}

export type ParagraphNode = {
  children: Array<LinkNode>
  type: 'paragraph'
}

export type ListItemNode = {
  children: Array<ListNode | ParagraphNode>
  spread: boolean
  type: 'listItem'
}

export type ListNode = {
  children: Array<ListItemNode>
  ordered: boolean
  spread: boolean
  type: 'list'
}

export type NodeData = LinkNode | ListItemNode | ListNode | ParagraphNode | TextNode
