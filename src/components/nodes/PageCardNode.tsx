import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EDGE_COLOR } from '../../layout'
import type { FlowEdgeData, Page } from '../../types/model'

interface PageCardData {
  page: Page
  expanded: boolean
  stateEdges: FlowEdgeData[]
  onOpen: (pageId: string) => void
  onToggle: (pageId: string) => void
}

const SW = 150
const SG = 14
const STH = 254

function StateTray({ page, stateEdges, onOpen }: { page: Page; stateEdges: FlowEdgeData[]; onOpen: (id: string) => void }) {
  const idx = (stateId?: string) => page.states.findIndex((s) => s.id === stateId)
  const trayW = page.states.length * (SW + SG) - SG + 24
  return (
    <div className="state-tray nodrag" style={{ width: trayW }}>
      <div className="tray-cards">
        {page.states.map((s) => (
          <div key={s.id} className="state-card" style={{ width: SW }}>
            <div className="state-card-name" title={s.name}>
              {s.name}
            </div>
            <img src={'/' + s.image} draggable={false} alt={s.name} />
          </div>
        ))}
      </div>
      <svg className="tray-svg" width={trayW} height={STH + 46}>
        <defs>
          {(['main', 'branch', 'error', 'back'] as const).map((t) => (
            <marker key={t} id={`tray-arrow-${t}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill={EDGE_COLOR[t]} />
            </marker>
          ))}
        </defs>
        {stateEdges.map((e, k) => {
          const i = idx(e.from.stateId)
          const j = idx(e.to.stateId)
          if (i < 0 || j < 0) return null
          const color = EDGE_COLOR[e.type]
          const dash = e.type === 'back' || e.type === 'error' ? '5 4' : undefined
          if (j === i + 1) {
            const x1 = 12 + i * (SW + SG) + SW
            const x2 = 12 + j * (SW + SG)
            const y = 40 + ((k % 3) - 1) * 26
            return (
              <g key={e.id}>
                <line x1={x1} y1={y} x2={x2 - 2} y2={y} stroke={color} strokeWidth={1.6} strokeDasharray={dash} markerEnd={`url(#tray-arrow-${e.type})`} />
                <title>{e.event}</title>
              </g>
            )
          }
          const cx1 = 12 + i * (SW + SG) + SW / 2
          const cx2 = 12 + j * (SW + SG) + SW / 2
          const yBase = j < i ? STH + 14 + (k % 2) * 14 : -6
          return (
            <g key={e.id}>
              <path
                d={`M ${cx1} ${j < i ? STH + 2 : 8} C ${cx1} ${yBase + 14}, ${cx2} ${yBase + 14}, ${cx2} ${j < i ? STH + 4 : 10}`}
                fill="none"
                stroke={color}
                strokeWidth={1.4}
                strokeDasharray={dash}
                markerEnd={`url(#tray-arrow-${e.type})`}
              />
              <title>{e.event}</title>
            </g>
          )
        })}
      </svg>
      <div className="tray-legend">
        {stateEdges.map((e) => {
          const from = page.states[idx(e.from.stateId)]
          const to = page.states[idx(e.to.stateId)]
          return (
            <span key={e.id} className={`tray-edge-tag et-${e.type}`} title={`${from?.name} → ${to?.name}`}>
              {e.event}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function PageCardNode(props: NodeProps) {
  const { page, expanded, stateEdges, onOpen, onToggle } = props.data as unknown as PageCardData
  return (
    <div className="page-card-wrap">
      <Handle type="target" position={Position.Left} id="l" className="hh" />
      <Handle type="source" position={Position.Right} id="r" className="hh" />
      <Handle type="source" position={Position.Bottom} id="bs" className="hh" />
      <Handle type="target" position={Position.Bottom} id="bt" className="hh" />
      <Handle type="source" position={Position.Top} id="ts" className="hh" />
      <Handle type="target" position={Position.Top} id="tt" className="hh" />
      {/* 打开页面由 ReactFlow onNodeClick 统一处理（节点需保留指针事件） */}
      <div className="page-card">
        <div className="page-card-name" title={page.name}>
          {page.name}
        </div>
        <div className="page-thumb-box">
          <img className="page-thumb" src={'/' + page.states[0].image} draggable={false} alt={page.name} />
        </div>
        <button
          className={`state-badge${expanded ? ' on' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(page.id)
          }}
        >
          {page.states.length} 状态 {expanded ? '▴' : '▾'}
        </button>
      </div>
      {expanded && <StateTray page={page} stateEdges={stateEdges} onOpen={onOpen} />}
    </div>
  )
}
