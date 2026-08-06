import { useEffect, useMemo, useRef } from 'react'
import { Background, Controls, MiniMap, ReactFlow, useReactFlow, useStoreApi, type ReactFlowInstance } from '@xyflow/react'
import { buildGraph, type FocusState, type GraphCallbacks } from '../layout'
import ProcessGroupNode from './nodes/ProcessGroupNode'
import PageCardNode from './nodes/PageCardNode'
import DecisionNode from './nodes/DecisionNode'
import FlowEdge from './edges/FlowEdge'

const nodeTypes = { processGroup: ProcessGroupNode, pageCard: PageCardNode, decisionNode: DecisionNode }
const edgeTypes = { flow: FlowEdge }

interface Props extends GraphCallbacks {
  expanded: Set<string>
  openEdgeId: string | null
  focus: FocusState | null
  hoverModuleId: string | null
  onInit: (instance: ReactFlowInstance) => void
}

export default function CanvasOverview(props: Props) {
  const { expanded, openEdgeId, focus, hoverModuleId, onOpenPage, onToggleExpand, onOpenEdge, onSelectModule, onJumpEdge, onPickState, onInit } = props

  const graph = useMemo(
    () => buildGraph(expanded, openEdgeId, focus, hoverModuleId, { onOpenPage, onToggleExpand, onOpenEdge, onSelectModule, onJumpEdge, onPickState }),
    [expanded, openEdgeId, focus, hoverModuleId, onOpenPage, onToggleExpand, onOpenEdge, onSelectModule, onJumpEdge, onPickState],
  )

  // 兜底：部分内嵌浏览器环境 ResizeObserver 不触发，节点测量进不了 store，
  // 所有连线会静默消失。挂载后若未初始化则手动喂一次 DOM 尺寸。
  const storeApi = useStoreApi()
  const rf = useReactFlow()
  const didInitialFit = useRef(false)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const s = storeApi.getState() as unknown as {
        domNode: HTMLElement | null
        nodeLookup: Map<string, { measured?: { width?: number }; internals?: { handleBounds?: unknown } }>
        updateNodeInternals: (m: Map<string, { id: string; nodeElement: HTMLElement; force: boolean }>) => void
      }
      if (!s.domNode) return
      // 只补喂真正没有测量结果的节点，避免正常环境下反复触发
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
        // 视口只在首次初始化时适配一次，且聚焦态下绝不重置
        if (!didInitialFit.current && !focus) {
          didInitialFit.current = true
          window.requestAnimationFrame(() => rf.fitView({ padding: 0.12 }))
        }
      }
    }, 120)
    return () => window.clearTimeout(t)
  }, [storeApi, rf, graph, focus])

  return (
    <ReactFlow
      nodes={graph.nodes}
      edges={graph.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.12}
      maxZoom={2.5}
      panOnScroll
      zoomOnScroll={false}
      zoomOnPinch
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onNodeClick={(_, node) => {
        if (node.type === 'pageCard') onOpenPage(node.id)
      }}
      onPaneClick={() => onOpenEdge(null)}
    >
      <Background gap={24} size={1.5} color="#e3e5ea" />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => (n.type === 'processGroup' ? '#ececf1' : '#c7cad1')}
        nodeStrokeColor="transparent"
        maskColor="rgba(245,246,248,0.7)"
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
