import { useCallback, useEffect, useRef, useState } from 'react'
import { ReactFlowProvider, type ReactFlowInstance } from '@xyflow/react'
import CanvasOverview from './components/CanvasOverview'
import FocusPanel from './components/focus/FocusPanel'
import { getPage, project } from './data/loader'
import { CARD_W, FOCUS_CARD_H, PANEL_W, type FocusState } from './layout'

export default function App() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [openEdgeId, setOpenEdgeId] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusState | null>(null)
  const rfRef = useRef<ReactFlowInstance | null>(null)
  const wrapRef = useRef<HTMLElement | null>(null)
  const focusRef = useRef<FocusState | null>(null)
  focusRef.current = focus

  const onToggleExpand = useCallback((pageId: string) => {
    setExpanded((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(pageId)) nextSet.delete(pageId)
      else nextSet.add(pageId)
      return nextSet
    })
  }, [])

  /** 画布内推近到页面节点：左侧留出面板宽度，缩放到合适比例 */
  const zoomToPage = useCallback((pageId: string) => {
    const rf = rfRef.current
    const wrap = wrapRef.current
    if (!rf || !wrap) return
    const inode = rf.getInternalNode(pageId)
    if (!inode) return
    const abs = inode.internals.positionAbsolute
    const availW = wrap.clientWidth - PANEL_W
    const availH = wrap.clientHeight
    const zoom = Math.min(1.6, Math.max(0.5, (availH * 0.82) / FOCUS_CARD_H))
    const cx = abs.x + CARD_W / 2
    const cy = abs.y + FOCUS_CARD_H / 2
    rf.setViewport(
      { x: availW / 2 - cx * zoom, y: availH / 2 - cy * zoom, zoom },
      { duration: 480 },
    )
  }, [])

  const focusPage = useCallback(
    (pageId: string, moduleId?: string, stateId?: string) => {
      const page = getPage(pageId)
      const stateWithModule = moduleId
        ? page.states.find((s) => page.moduleInstances.some((i) => i.moduleId === moduleId && i.hotzones[s.id]))?.id
        : undefined
      setFocus({
        pageId,
        stateId: stateId ?? stateWithModule ?? page.states[0].id,
        moduleId: moduleId ?? null,
      })
      // 等 React 提交后再推近视口；再补一次防止首次聚焦时序竞争
      window.setTimeout(() => zoomToPage(pageId), 60)
      window.setTimeout(() => zoomToPage(pageId), 320)
    },
    [zoomToPage],
  )

  const onOpenPage = useCallback(
    (pageId: string) => {
      if (focusRef.current?.pageId === pageId) {
        zoomToPage(pageId)
        return
      }
      focusPage(pageId)
    },
    [focusPage, zoomToPage],
  )

  const onSelectModule = useCallback(
    (moduleId: string | null) => {
      setFocus((f) => (f ? { ...f, moduleId } : f))
      // 选中模块时把视口拉回当前聚焦页面（用户可能已手动平移离开）
      if (moduleId && focusRef.current) {
        const pageId = focusRef.current.pageId
        window.setTimeout(() => zoomToPage(pageId), 60)
      }
    },
    [zoomToPage],
  )

  const closeFocus = useCallback(() => {
    setFocus(null)
    window.setTimeout(() => rfRef.current?.fitView({ duration: 500, padding: 0.12 }), 30)
  }, [])

  // 点击气泡/状态托盘以外的区域时关闭它们
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (!el.closest('.edge-pop') && !el.closest('.edge-label')) setOpenEdgeId(null)
      if (!el.closest('.state-tray') && !el.closest('.state-badge')) {
        setExpanded((prev) => (prev.size ? new Set<string>() : prev))
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const f = focusRef.current
      if (!f) return
      if (e.key === 'Escape') {
        if (f.moduleId) setFocus({ ...f, moduleId: null })
        else closeFocus()
      }
      const idx = project.pages.findIndex((p) => p.id === f.pageId)
      if (e.key === 'ArrowLeft' && idx > 0) focusPage(project.pages[idx - 1].id)
      if (e.key === 'ArrowRight' && idx < project.pages.length - 1) focusPage(project.pages[idx + 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeFocus, focusPage])

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">◍</span>
        <span className="title">可视化体验链路</span>
        <span className="subtitle">{project.project.name}</span>
        <span className="topbar-hint">点击页面卡片聚焦 · 点击「n 状态」角标展开 · 点击连线看事件与条件</span>
        <span className="ver">Demo · {project.project.version}</span>
      </header>
      <main className="canvas-wrap" ref={(el) => (wrapRef.current = el)}>
        <ReactFlowProvider>
          <CanvasOverview
            expanded={expanded}
            openEdgeId={openEdgeId}
            focus={focus}
            onOpenPage={onOpenPage}
            onToggleExpand={onToggleExpand}
            onOpenEdge={setOpenEdgeId}
            onJumpEdge={(edgeId) => {
              const e = project.edges.find((x) => x.id === edgeId)
              if (e) focusPage(e.to.pageId, undefined, e.to.stateId)
            }}
            onSelectModule={onSelectModule}
            onInit={(inst) => {
              rfRef.current = inst
              ;(window as unknown as { __rf?: ReactFlowInstance }).__rf = inst
            }}
          />
        </ReactFlowProvider>
        {focus && (
          <FocusPanel
            focus={focus}
            onClose={closeFocus}
            onGoPage={(pageId, moduleId) => focusPage(pageId, moduleId)}
            onState={(stateId) => {
              setFocus((f) => {
                if (!f) return f
                // 切换页面状态后，若选中模块在新状态下不展示，自动取消选中（对应面板卡片置灰）
                const keep =
                  !!f.moduleId &&
                  getPage(f.pageId).moduleInstances.some((i) => i.moduleId === f.moduleId && i.hotzones[stateId])
                return { ...f, stateId, moduleId: keep ? f.moduleId : null }
              })
              // 切换状态同样拉回聚焦页面视图（用户可能已手动平移离开）
              if (focusRef.current) {
                const pageId = focusRef.current.pageId
                window.setTimeout(() => zoomToPage(pageId), 60)
              }
            }}
            onSelectModule={onSelectModule}
          />
        )}
      </main>
    </div>
  )
}
