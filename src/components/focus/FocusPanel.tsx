import { getPage, getProcessNode, project } from '../../data/loader'
import type { FocusState } from '../../layout'
import DetailPanel from './DetailPanel'

interface Props {
  focus: FocusState
  onClose: () => void
  onGoPage: (pageId: string, moduleId?: string) => void
  onState: (stateId: string) => void
  onSelectModule: (moduleId: string | null) => void
}

export default function FocusPanel({ focus, onClose, onGoPage, onState, onSelectModule }: Props) {
  const page = getPage(focus.pageId)
  const processNode = getProcessNode(page.processNodeId)
  const idx = project.pages.findIndex((p) => p.id === focus.pageId)
  const prev = idx > 0 ? project.pages[idx - 1] : null
  const next = idx < project.pages.length - 1 ? project.pages[idx + 1] : null

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
        <DetailPanel
          page={page}
          stateId={focus.stateId}
          view={focus.view}
          moduleId={focus.moduleId}
          onState={onState}
          onSelectModule={onSelectModule}
          onJump={(pageId, moduleId) => onGoPage(pageId, moduleId)}
        />
      </div>
      <div className="fp-foot">Esc 返回 · ← → 翻页 · 双指滑动平移画布</div>
    </aside>
  )
}
