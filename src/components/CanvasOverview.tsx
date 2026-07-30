import { useMemo } from 'react'
import { Background, Controls, MiniMap, ReactFlow, type ReactFlowInstance } from '@xyflow/react'
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
