import { useEffect, useState } from 'react'
import { getPage, getProcessNode, project } from '../../data/loader'
import type { FocusState } from '../../layout'
import DetailPanel from './DetailPanel'
import ImageGenPanel from './ImageGenPanel'

interface Props {
  focus: FocusState
  onClose: () => void
  onGoPage: (pageId: string, moduleId?: string) => void
  onState: (stateId: string) => void
  onSelectModule: (moduleId: string | null) => void
  onHoverModule: (moduleId: string | null) => void
}

export default function FocusPanel({ focus, onClose, onGoPage, onState, onSelectModule, onHoverModule }: Props) {
  const page = getPage(focus.pageId)
  const processNode = getProcessNode(page.processNodeId)
  const idx = project.pages.findIndex((p) => p.id === focus.pageId)
  const prev = idx > 0 ? project.pages[idx - 1] : null
  const next = idx < project.pages.length - 1 ? project.pages[idx + 1] : null
  const [mode, setMode] = useState<'detail' | 'generate' | 'history'>('detail')

  useEffect(() => setMode('detail'), [page.id])

  useEffect(() => {
    if (mode === 'detail') return
    const exitGeneration = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      setMode('detail')
    }
    window.addEventListener('keydown', exitGeneration, true)
    return () => window.removeEventListener('keydown', exitGeneration, true)
  }, [mode])

  return (
    <aside className="focus-panel">
      <div className="fp-head">
        <button className="back-btn" onClick={onClose}>
          ← 全览
        </button>
        <span className="crumb" title={`${processNode.name} › ${page.name}`}>
          {processNode.name} <span className="crumb-sep">›</span> {page.name}
        </span>
        <span className="fp-nav">
          <button className="fp-arrow" disabled={!prev} title={prev ? `上一页：${prev.name}` : undefined} onClick={() => prev && onGoPage(prev.id)}>
            ‹
          </button>
          <button className="fp-arrow" disabled={!next} title={next ? `下一页：${next.name}` : undefined} onClick={() => next && onGoPage(next.id)}>
            ›
          </button>
        </span>
      </div>
      <div className="fp-body">
        {mode === 'detail' ? (
          <DetailPanel
            page={page}
            stateId={focus.stateId}
            moduleId={focus.moduleId}
            onState={onState}
            onSelectModule={onSelectModule}
            onHoverModule={onHoverModule}
            onJump={(pageId, moduleId) => onGoPage(pageId, moduleId)}
            onEditPage={() => setMode('generate')}
          />
        ) : (
          <ImageGenPanel
            page={page}
            mode={mode}
            onMode={setMode}
            onExit={() => setMode('detail')}
          />
        )}
      </div>
      <div className="fp-foot">{mode === 'detail' ? 'Esc 返回 · ← → 翻页 · 双指滑动平移画布' : '生图模式 · 页面画布保持可见'}</div>
    </aside>
  )
}
