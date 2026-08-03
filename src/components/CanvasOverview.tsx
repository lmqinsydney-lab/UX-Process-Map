import { useEffect, useMemo } from 'react'
import { Background, Controls, MiniMap, ReactFlow, useReactFlow, useStoreApi, type ReactFlowInstance } from '@xyflow/react'
import { buildGraph, type FocusState, type GraphCallbacks } from '../layout'
import ProcessGroupNode from './nodes/ProcessGroupNode'
import PageCardNode from './nodes/PageCardNode'
import FlowEdge from './edges/FlowEdge'

const nodeTypes = { processGroup: ProcessGroupNode, pageCard: PageCardNode }
const edgeTypes = { flow: FlowEdge }

interface Props extends GraphCallbacks {
  expanded: Set<string>
  openEdgeId: string | null
  focus: FocusState | null
  onInit: (instance: ReactFlowInstance) => void
}

export default function CanvasOverview(props: Props) {
  const { expanded, openEdgeId, focus, onOpenPage, onToggleExpand, onOpenEdge, onSelectModule, onInit } = props

  const graph = useMemo(
    () => buildGraph(expanded, openEdgeId, focus, { onOpenPage, onToggleExpand, onOpenEdge, onSelectModule }),
    [expanded, openEdgeId, focus, onOpenPage, onToggleExpand, onOpenEdge, onSelectModule],
  )

  // 兜底：部分内嵌浏览器环境 ResizeObserver 不触发，节点测量进不了 store，
  // 所有连线会静默消失。挂载后若未初始化则手动喂一次 DOM 尺寸。
  const storeApi = useStoreApi()
  const rf = useReactFlow()
  useEffect(() => {
    const t = window.setTimeout(() => {
      const s = storeApi.getState() as unknown as {
        nodesInitialized: boolean
        domNode: HTMLElement | null
        updateNodeInternals: (m: Map<string, { id: string; nodeElement: HTMLElement; force: boolean }>) => void
      }
      if (s.nodesInitialized || !s.domNode) return
      const updates = new Map<string, { id: string; nodeElement: HTMLElement; force: boolean }>()
      s.domNode.querySelectorAll<HTMLElement>('.react-flow__node').forEach((el) => {
        const id = el.getAttribute('data-id')
        if (id) updates.set(id, { id, nodeElement: el, force: true })
      })
      if (updates.size) {
        s.updateNodeInternals(updates)
        window.requestAnimationFrame(() => rf.fitView({ padding: 0.12 }))
      }
    }, 120)
    return () => window.clearTimeout(t)
  }, [storeApi, rf, graph])

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
