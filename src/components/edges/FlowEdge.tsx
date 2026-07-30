import type { CSSProperties } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { EDGE_COLOR } from '../../layout'
import { EDGE_TYPE_NAME, type FlowEdgeData } from '../../types/model'

interface FlowEdgeDataProps {
  edge: FlowEdgeData
  kind: 'loop' | 'back' | 'long' | 'short'
  lane: number
  srcShift: number
  tgtShift: number
  open: boolean
  fromLabel: string
  toLabel: string
  onOpenEdge: (edgeId: string | null) => void
}

export default function FlowEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd } = props
  const { edge, kind, lane, srcShift, tgtShift, open, fromLabel, toLabel, onOpenEdge } = props.data as unknown as FlowEdgeDataProps

  let path: string
  let labelX: number
  let labelY: number

  if (kind === 'loop') {
    path = `M ${sourceX} ${sourceY} C ${sourceX - 95} ${sourceY - 115}, ${sourceX + 95} ${sourceY - 115}, ${targetX} ${targetY}`
    labelX = sourceX
    labelY = sourceY - 88
  } else if (kind === 'back') {
    // 反向边沿分组下方回勾，泳道避免多条回勾线重叠
    const dip = Math.max(sourceY, targetY) + 56 + lane * 26
    path = `M ${sourceX} ${sourceY} C ${sourceX} ${dip}, ${targetX} ${dip}, ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = dip - 16
  } else if (kind === 'long') {
    // 长距离连线走正交路径：卡片间隙垂直上升 → 顶部专属泳道横穿 → 目标间隙垂直下降
    const r = 8
    const upX = sourceX + 8 + srcShift
    const downX = targetX - 8 - tgtShift
    const topY = -84 - lane * 30
    path = [
      `M ${sourceX} ${sourceY}`,
      `L ${upX - r} ${sourceY}`,
      `Q ${upX} ${sourceY} ${upX} ${sourceY - r}`,
      `L ${upX} ${topY + r}`,
      `Q ${upX} ${topY} ${upX + r} ${topY}`,
      `L ${downX - r} ${topY}`,
      `Q ${downX} ${topY} ${downX} ${topY + r}`,
      `L ${downX} ${targetY - r}`,
      `Q ${downX} ${targetY} ${downX + r} ${targetY}`,
      `L ${targetX} ${targetY}`,
    ].join(' ')
    labelX = (upX + downX) / 2
    labelY = topY
  } else {
    ;[path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  }

  const color = EDGE_COLOR[edge.type]
  const style: CSSProperties = {
    stroke: color,
    strokeWidth: edge.type === 'main' ? 2.2 : 1.5,
    strokeDasharray: edge.type === 'error' ? '7 5' : edge.type === 'back' ? '4 4' : undefined,
  }

  return (
    <>
      <BaseEdge id={props.id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className={`edge-label et-${edge.type} nodrag nopan`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onClick={(ev) => {
            ev.stopPropagation()
            onOpenEdge(open ? null : edge.id)
          }}
          title="点击查看触发事件与判断条件"
        >
          {edge.event}
        </div>
        {open && (
          <div
            className="edge-pop nodrag nopan"
            style={{ transform: `translate(-50%, 0) translate(${labelX}px, ${labelY + 16}px)` }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="ep-row ep-head">
              <span className={`ep-type et-${edge.type}`}>{EDGE_TYPE_NAME[edge.type]}</span>
              <button className="ep-close" onClick={() => onOpenEdge(null)}>
                ✕
              </button>
            </div>
            <div className="ep-row">
              <span className="ep-k">流向</span>
              <span className="ep-v">
                {fromLabel} → {toLabel}
              </span>
            </div>
            <div className="ep-row">
              <span className="ep-k">触发事件</span>
              <span className="ep-v">{edge.event}</span>
            </div>
            {edge.condition && (
              <div className="ep-row">
                <span className="ep-k">判断条件</span>
                <span className="ep-v">{edge.condition}</span>
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
