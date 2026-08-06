import { useEffect } from 'react'
import { useReactFlow, useStoreApi } from '@xyflow/react'

/**
 * 兜底：部分内嵌浏览器环境 ResizeObserver 不触发，节点测量进不了 store，连线会静默消失。
 * 挂载后检查未测量节点并手动喂 DOM 尺寸；deps 变化时重查。
 */
export default function MeasureFallback({ dep, refit = false }: { dep?: unknown; refit?: boolean }) {
  const storeApi = useStoreApi()
  const rf = useReactFlow()
  useEffect(() => {
    const t = window.setTimeout(() => {
      const s = storeApi.getState() as unknown as {
        domNode: HTMLElement | null
        nodeLookup: Map<string, { measured?: { width?: number }; internals?: { handleBounds?: unknown } }>
        updateNodeInternals: (m: Map<string, { id: string; nodeElement: HTMLElement; force: boolean }>) => void
      }
      if (!s.domNode) return
      const updates = new Map<string, { id: string; nodeElement: HTMLElement; force: boolean }>()
      s.domNode.querySelectorAll<HTMLElement>('.react-flow__node').forEach((el) => {
        const id = el.getAttribute('data-id')
        const n = id ? s.nodeLookup.get(id) : null
        if (id && n && !(n.measured?.width && n.internals?.handleBounds)) {
          updates.set(id, { id, nodeElement: el, force: true })
        }
      })
      if (updates.size) {
        s.updateNodeInternals(updates)
        if (refit) window.requestAnimationFrame(() => rf.fitView({ padding: 0.18 }))
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [storeApi, rf, dep, refit])
  return null
}
