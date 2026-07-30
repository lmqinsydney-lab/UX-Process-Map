import { useEffect } from 'react'
import { getPage, getProcessNode, project } from '../../data/loader'
import PageViewer from './PageViewer'
import DetailPanel from './DetailPanel'

export interface FocusState {
  pageId: string
  stateId: string
  view: 'page' | 'module'
  moduleId: string | null
}

interface Props {
  focus: FocusState
  setFocus: (f: FocusState) => void
  onClose: () => void
}

export default function FocusView({ focus, setFocus, onClose }: Props) {
  const page = getPage(focus.pageId)
  const processNode = getProcessNode(page.processNodeId)
  const idx = project.pages.findIndex((p) => p.id === focus.pageId)
  const prev = idx > 0 ? project.pages[idx - 1] : null
  const next = idx < project.pages.length - 1 ? project.pages[idx + 1] : null

  const goPage = (pageId: string) =>
    setFocus({ pageId, stateId: getPage(pageId).states[0].id, view: 'page', moduleId: null })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (focus.view === 'module') setFocus({ ...focus, view: 'page', moduleId: null })
        else onClose()
      }
      if (e.key === 'ArrowLeft' && prev) goPage(prev.id)
      if (e.key === 'ArrowRight' && next) goPage(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="focus-root">
      <div className="focus-top">
        <button className="back-btn" onClick={onClose}>
          ← 返回全览
        </button>
        <span className="crumb">
          {processNode.name} <span className="crumb-sep">›</span> {page.name}
        </span>
        <span className="focus-hint">Esc 返回 · ← → 翻页</span>
      </div>
      <div className="focus-body">
        <button className="nav-arrow" disabled={!prev} title={prev ? `上一页：${prev.name}` : undefined} onClick={() => prev && goPage(prev.id)}>
          ‹
        </button>
        <PageViewer
          page={page}
          stateId={focus.stateId}
          selectedModuleId={focus.moduleId}
          onSelectModule={(m) => setFocus({ ...focus, view: m ? 'module' : 'page', moduleId: m })}
        />
        <button className="nav-arrow" disabled={!next} title={next ? `下一页：${next.name}` : undefined} onClick={() => next && goPage(next.id)}>
          ›
        </button>
        <DetailPanel
          page={page}
          stateId={focus.stateId}
          view={focus.view}
          moduleId={focus.moduleId}
          onState={(s) => setFocus({ ...focus, stateId: s })}
          onSelectModule={(m) => setFocus({ ...focus, view: m ? 'module' : 'page', moduleId: m })}
          onJump={(pageId, moduleId) => {
            const target = getPage(pageId)
            const stateWithModule =
              target.states.find((s) => target.moduleInstances.some((i) => i.moduleId === moduleId && i.hotzones[s.id]))?.id ??
              target.states[0].id
            setFocus({ pageId, stateId: stateWithModule, view: 'module', moduleId })
          }}
        />
      </div>
    </div>
  )
}
