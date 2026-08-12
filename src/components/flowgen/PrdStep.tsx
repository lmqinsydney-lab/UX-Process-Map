import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrdDraft } from '../../flowgen/prdDraft'

interface Props {
  draft: PrdDraft
  onChange: (draft: PrdDraft) => void
  onBack: () => void
  onGenerateFlow: (draft: PrdDraft, plainText: string) => void
}

const FLOW_STEPS = ['正在读取 PRD 内容…', '识别页面与关键状态…', '构建流程节点关系…', '自动布局中…']

export default function PrdStep({ draft, onChange, onBack, onGenerateFlow }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [genStep, setGenStep] = useState<string | null>(null)

  const syncDraft = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    setWordCount(editor.innerText.replace(/\s/g, '').length)
    onChange({ ...draft, html: editor.innerHTML })
  }, [draft, onChange])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.innerHTML = draft.html
    setWordCount(editor.innerText.replace(/\s/g, '').length)
    // 只在换入一份新草稿时重置编辑器，输入过程中不覆盖光标。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id])

  const command = useCallback((name: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(name, false, value)
    syncDraft()
  }, [syncDraft])

  const generateFlow = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || genStep || !editor.innerText.trim()) return
    for (const label of FLOW_STEPS) {
      setGenStep(label)
      await new Promise((resolve) => window.setTimeout(resolve, 320))
    }
    const nextDraft = { ...draft, html: editor.innerHTML }
    onChange(nextDraft)
    setGenStep(null)
    onGenerateFlow(nextDraft, editor.innerText)
  }, [draft, genStep, onChange, onGenerateFlow])

  const tool = (label: string, title: string, name: string, value?: string) => (
    <button
      type="button"
      className="prd-tool"
      title={title}
      aria-label={title}
      onMouseDown={(event) => {
        event.preventDefault()
        command(name, value)
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="prd-root">
      <div className="prd-head">
        <button className="fg-chip" onClick={onBack}>← 返回需求输入</button>
        <div className="prd-head-copy">
          <strong>PRD 编辑</strong>
          <span>当前为占位初稿，未来将接入 PRD 生成 Skill</span>
        </div>
        <span className="fg-spacer" />
        <span className="prd-saved">已保存到当前会话 · {wordCount} 字</span>
        <button className="fg-gen prd-generate" disabled={!!genStep} onClick={generateFlow}>
          {genStep ? '生成中…' : '确认并生成流程'}
        </button>
      </div>
      <div className="prd-toolbar" role="toolbar" aria-label="文档编辑工具栏">
        {tool('↶', '撤销', 'undo')}
        {tool('↷', '重做', 'redo')}
        <i />
        {tool('正文', '正文', 'formatBlock', 'p')}
        {tool('标题 1', '一级标题', 'formatBlock', 'h1')}
        {tool('标题 2', '二级标题', 'formatBlock', 'h2')}
        <i />
        {tool('B', '加粗', 'bold')}
        {tool('I', '斜体', 'italic')}
        {tool('U', '下划线', 'underline')}
        {tool('S', '删除线', 'strikeThrough')}
        <i />
        {tool('• 列表', '无序列表', 'insertUnorderedList')}
        {tool('1. 列表', '有序列表', 'insertOrderedList')}
        <i />
        {tool('左对齐', '左对齐', 'justifyLeft')}
        {tool('居中', '居中', 'justifyCenter')}
        {tool('清除格式', '清除格式', 'removeFormat')}
      </div>
      <div className="prd-workspace">
        <div
          ref={editorRef}
          className="prd-paper"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="PRD 文档正文"
          aria-multiline="true"
          onInput={syncDraft}
        />
      </div>
      {genStep && <div className="prd-generating"><span>{genStep}</span></div>}
    </div>
  )
}
