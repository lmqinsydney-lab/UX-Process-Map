import type { CSSProperties } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { EDGE_COLOR, LANE_BASE, LANE_PITCH } from '../../layout'
import { EDGE_TYPE_NAME, type EdgeType } from '../../types/model'

interface EdgeItem {
  fromLabel: string
  toLabel: string
  event: string
  condition?: string
  type: EdgeType
}

interface FlowEdgeDataProps {
  kind: 'loop' | 'back' | 'long' | 'short' | 'gshort' | 'glong' | 'gback'
  lane: number
  srcShift: number
  tgtShift: number
  srcYOff: number
  tgtYOff: number
  upHops: number[]
  downHops: number[]
  open: boolean
  label: string
  typeKey: EdgeType
  items: EdgeItem[]
  onOpenEdge: (edgeId: string | null) => void
}

export default function FlowEdge(props: EdgeProps) {
  const { sourceX, targetX, sourcePosition, targetPosition, markerEnd } = props
  const { kind, lane, srcShift, tgtShift, srcYOff, tgtYOff, upHops, downHops, open, label, typeKey, items, onOpenEdge } =
    props.data as unknown as FlowEdgeDataProps
  const sourceY = props.sourceY + srcYOff
  const targetY = props.targetY + tgtYOff

  let path: string
  let labelX: number
  let labelY: number

  if (kind === 'loop') {
    path = `M ${sourceX} ${sourceY} C ${sourceX - 95} ${sourceY - 115}, ${sourceX + 95} ${sourceY - 115}, ${targetX} ${targetY}`
    labelX = sourceX
    labelY = sourceY - 88
  } else if (kind === 'back' || kind === 'gback') {
    // 反向边沿分组下方回勾，泳道避免多条回勾线重叠
    const dip = Math.max(sourceY, targetY) + 56 + lane * 32
    path = `M ${sourceX} ${sourceY} C ${sourceX} ${dip}, ${targetX} ${dip}, ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = dip - 16
  } else if (kind === 'long' || kind === 'glong') {
    // 长距离连线走正交路径：间隙垂直上升 → 顶部专属泳道横穿 → 目标间隙垂直下降；
    // 垂直段与更低泳道相交处画跨线桥（小弧跳过）
    const r = 8
    const hr = 7
    const upX = sourceX + 8 + srcShift
    const downX = targetX - 8 - tgtShift
    const topY = -(LANE_BASE + lane * LANE_PITCH)
    const parts = [`M ${sourceX} ${sourceY}`, `L ${upX - r} ${sourceY}`, `Q ${upX} ${sourceY} ${upX} ${sourceY - r}`]
    for (const hy of [...upHops].sort((a, b) => b - a)) {
      parts.push(`L ${upX} ${hy + hr}`, `A ${hr} ${hr} 0 0 1 ${upX} ${hy - hr}`)
    }
    parts.push(`L ${upX} ${topY + r}`, `Q ${upX} ${topY} ${upX + r} ${topY}`, `L ${downX - r} ${topY}`, `Q ${downX} ${topY} ${downX} ${topY + r}`)
    for (const hy of [...downHops].sort((a, b) => a - b)) {
      parts.push(`L ${downX} ${hy - hr}`, `A ${hr} ${hr} 0 0 0 ${downX} ${hy + hr}`)
    }
    parts.push(`L ${downX} ${targetY - r}`, `Q ${downX} ${targetY} ${downX + r} ${targetY}`, `L ${targetX} ${targetY}`)
    path = parts.join(' ')
    labelX = (upX + downX) / 2
    labelY = topY
  } else {
    ;[path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  }

  const color = EDGE_COLOR[typeKey]
  const style: CSSProperties = {
    stroke: color,
    strokeWidth: typeKey === 'main' ? 2.2 : 1.5,
    strokeDasharray: typeKey === 'error' ? '7 5' : typeKey === 'back' ? '4 4' : undefined,
  }

  return (
    <>
      <BaseEdge id={props.id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className={`edge-label${kind === 'short' || kind === 'gshort' ? ' wrap' : ''} et-${typeKey} nodrag nopan`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onClick={(ev) => {
            ev.stopPropagation()
            onOpenEdge(open ? null : props.id)
          }}
          title="点击查看触发事件与判断条件"
        >
          {label}
        </div>
        {open && (
          <div
            className="edge-pop nodrag nopan"
            style={{ transform: `translate(-50%, 0) translate(${labelX}px, ${labelY + 16}px)` }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="ep-row ep-head">
              <span className={`ep-type et-${typeKey}`}>
                {items.length > 1 ? `${items.length} 条流转` : EDGE_TYPE_NAME[typeKey]}
              </span>
              <button className="ep-close" onClick={() => onOpenEdge(null)}>
                ✕
              </button>
            </div>
            {items.map((it, i) => (
              <div key={i} className={`ep-item${i > 0 ? ' ep-item-sep' : ''}`}>
                <div className="ep-row">
                  <span className="ep-k">流向</span>
                  <span className="ep-v">
                    {it.fromLabel} → {it.toLabel}
                    {items.length > 1 && <span className={`ep-type ep-type-sm et-${it.type}`}>{EDGE_TYPE_NAME[it.type]}</span>}
                  </span>
                </div>
                <div className="ep-row">
                  <span className="ep-k">触发事件</span>
                  <span className="ep-v">{it.event}</span>
                </div>
                {it.condition && (
                  <div className="ep-row">
                    <span className="ep-k">判断条件</span>
                    <span className="ep-v">{it.condition}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
