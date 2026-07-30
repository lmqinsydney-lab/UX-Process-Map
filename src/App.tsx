import { useCallback, useRef, useState } from 'react'
import { ReactFlowProvider, type ReactFlowInstance } from '@xyflow/react'
import CanvasOverview from './components/CanvasOverview'
import FocusView, { type FocusState } from './components/focus/FocusView'
import { getPage, project } from './data/loader'

export default function App() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [openEdgeId, setOpenEdgeId] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusState | null>(null)
  const rfRef = useRef<ReactFlowInstance | null>(null)

  const onToggleExpand = useCallback((pageId: string) => {
    setExpanded((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(pageId)) nextSet.delete(pageId)
      else nextSet.add(pageId)
      return nextSet
    })
  }, [])

  const onOpenPage = useCallback((pageId: string) => {
    rfRef.current?.fitView({ nodes: [{ id: pageId }], duration: 450, padding: 0.4, maxZoom: 1.4 })
    window.setTimeout(() => {
      setFocus({ pageId, stateId: getPage(pageId).states[0].id, view: 'page', moduleId: null })
    }, 430)
  }, [])

  const closeFocus = useCallback(() => {
    setFocus(null)
    window.setTimeout(() => rfRef.current?.fitView({ duration: 500, padding: 0.12 }), 30)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">◍</span>
        <span className="title">可视化体验链路</span>
        <span className="subtitle">{project.project.name}</span>
        <span className="topbar-hint">点击页面卡片聚焦 · 点击「n 状态」角标展开 · 点击连线看事件与条件</span>
        <span className="ver">Demo · {project.project.version}</span>
      </header>
      <main className="canvas-wrap">
        <ReactFlowProvider>
          <CanvasOverview
            expanded={expanded}
            openEdgeId={openEdgeId}
            onOpenPage={onOpenPage}
            onToggleExpand={onToggleExpand}
            onOpenEdge={setOpenEdgeId}
            onInit={(inst) => {
              rfRef.current = inst
            }}
          />
        </ReactFlowProvider>
        {focus && <FocusView focus={focus} setFocus={setFocus} onClose={closeFocus} />}
      </main>
    </div>
  )
}
