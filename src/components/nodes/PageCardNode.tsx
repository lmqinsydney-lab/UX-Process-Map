import { useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { asset } from '../../assetUrl'
import { endpointLabel, getEdge, getModule } from '../../data/loader'
import { EDGE_COLOR } from '../../layout'
import type { FlowEdgeData, Page } from '../../types/model'

interface PageCardData {
  page: Page
  expanded: boolean
  stateEdges: FlowEdgeData[]
  isFocused: boolean
  focusStateId: string | null
  focusModuleId: string | null
  focusHoverModuleId: string | null
  onToggle: (pageId: string) => void
  onSelectModule: (moduleId: string | null) => void
  onJumpEdge: (edgeId: string) => void
  onPickState: (pageId: string, stateId: string) => void
}

const SW = 150
const SG = 14
const STH = 352

function StateTray({ page, stateEdges, onPickState }: { page: Page; stateEdges: FlowEdgeData[]; onPickState: (pageId: string, stateId: string) => void }) {
  const idx = (stateId?: string) => page.states.findIndex((s) => s.id === stateId)
  const trayW = page.states.length * (SW + SG) - SG + 24
  return (
    <div className="state-tray nodrag" style={{ width: trayW }}>
      <div className="tray-cards">
        {page.states.map((s) => (
          <div
            key={s.id}
            className="state-card"
            style={{ width: SW }}
            title={`聚焦查看「${s.name}」`}
            onClick={(e) => {
              e.stopPropagation()
              onPickState(page.id, s.id)
            }}
          >
            <div className="state-card-name" title={s.name}>
              {s.name}
            </div>
            <img src={asset(s.image)} draggable={false} alt={s.name} />
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
            const y = 176 + ((k % 3) - 1) * 26
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

/** 聚焦态：完整截图 + 模块热区 + 聚光灯蒙层，直接绘制在画布节点内 */
function FocusedViewer({ page, stateId, moduleId, hoverId, onSelectModule, onJumpEdge }: { page: Page; stateId: string; moduleId: string | null; hoverId: string | null; onSelectModule: (m: string | null) => void; onJumpEdge: (edgeId: string) => void }) {
  const state = page.states.find((s) => s.id === stateId) ?? page.states[0]
  const zones = page.moduleInstances.filter((i) => i.hotzones[state.id])
  const selected = moduleId ? zones.find((z) => z.moduleId === moduleId) : undefined
  const hz = selected?.hotzones[state.id]
  // 鼠标进入页面时模块高亮闪两下提示位置；页面内移动不重复触发
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | null>(null)

  return (
    <>
      <div
        className={`focus-shot nodrag${flash && !moduleId ? ' flash' : ''}${moduleId ? ' has-sel' : ''}`}
        onMouseEnter={() => {
          if (moduleId) return
          setFlash(true)
          if (flashTimer.current) window.clearTimeout(flashTimer.current)
          flashTimer.current = window.setTimeout(() => setFlash(false), 1450)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectModule(null)
        }}
      >
        <img src={asset(state.image)} alt={`${page.name} · ${state.name}`} draggable={false} />
        {hz && (
          <>
            <div className="mask" style={{ left: 0, top: 0, width: '100%', height: `${hz.y}%` }} />
            <div className="mask" style={{ left: 0, top: `${hz.y}%`, width: `${hz.x}%`, height: `${hz.h}%` }} />
            <div className="mask" style={{ left: `${hz.x + hz.w}%`, top: `${hz.y}%`, width: `${100 - hz.x - hz.w}%`, height: `${hz.h}%` }} />
            <div className="mask" style={{ left: 0, top: `${hz.y + hz.h}%`, width: '100%', height: `${100 - hz.y - hz.h}%` }} />
          </>
        )}
        {zones.map((z) => {
          const zone = z.hotzones[state.id]
          const isSel = z.moduleId === moduleId
          const clickEdge = z.clickEdgeId ? getEdge(z.clickEdgeId) : undefined
          return (
            <div
              key={z.moduleId}
              className={`hz${isSel ? ' sel' : ''}${!moduleId && z.moduleId === hoverId ? ' hovered' : ''}${clickEdge ? ' jumpable' : ''}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
              title={
                clickEdge
                  ? `${getModule(z.moduleId).name} · 双击前往「${endpointLabel(clickEdge.to)}」`
                  : getModule(z.moduleId).name
              }
              onClick={(e) => {
                e.stopPropagation()
                onSelectModule(isSel ? null : z.moduleId)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (clickEdge) onJumpEdge(clickEdge.id)
              }}
            />
          )
        })}
      </div>
    </>
  )
}

export default function PageCardNode(props: NodeProps) {
  const { page, expanded, stateEdges, isFocused, focusStateId, focusModuleId, focusHoverModuleId, onToggle, onSelectModule, onJumpEdge, onPickState } =
    props.data as unknown as PageCardData
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <div className="page-card-wrap">
      <Handle type="target" position={Position.Left} id="l" className="hh" />
      <Handle type="source" position={Position.Right} id="r" className="hh" />
      <Handle type="source" position={Position.Bottom} id="bs" className="hh" />
      <Handle type="target" position={Position.Bottom} id="bt" className="hh" />
      <Handle type="source" position={Position.Top} id="ts" className="hh" />
      <Handle type="target" position={Position.Top} id="tt" className="hh" />
      <div className={`page-card${isFocused ? ' focused' : ''}`}>
        <div className="page-card-name" title={page.name}>
          {page.name}
        </div>
        {isFocused ? (
          <FocusedViewer page={page} stateId={focusStateId ?? page.states[0].id} moduleId={focusModuleId} hoverId={focusHoverModuleId} onSelectModule={onSelectModule} onJumpEdge={onJumpEdge} />
        ) : (
          <div className="page-thumb-box">
            <img className="page-thumb" src={asset(page.states[0].image)} draggable={false} alt={page.name} />
          </div>
        )}
        {isFocused && page.onlineCompare && (
          <button
            className={`compare-btn${compareOpen ? ' on' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setCompareOpen(!compareOpen)
            }}
          >
            ⇆ 对比线上
          </button>
        )}
        {page.states.length > 1 && (
          <button
            className={`state-badge${expanded ? ' on' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(page.id)
            }}
          >
            {page.states.length} 个状态 {expanded ? '▴' : '▾'}
          </button>
        )}
      </div>
      {isFocused && compareOpen && page.onlineCompare && (
        <div className="online-compare nodrag">
          <div className="oc-title">线上参考 · {page.onlineCompare.name}</div>
          <img src={asset(page.onlineCompare.image)} draggable={false} alt={page.onlineCompare.name} />
          {page.onlineCompare.note && <div className="oc-note">{page.onlineCompare.note}</div>}
        </div>
      )}
      {expanded && <StateTray page={page} stateEdges={stateEdges} onPickState={onPickState} />}
    </div>
  )
}
