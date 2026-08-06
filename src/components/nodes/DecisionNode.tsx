import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EDGE_TYPE_NAME, type Decision, type EdgeType } from '../../types/model'

interface DecisionData {
  decision: Decision
  branches: { label: string; condition?: string; toLabel: string; type: EdgeType }[]
  open: boolean
  onOpenEdge: (edgeId: string | null) => void
}

/** 判断节点：菱形小卡；点击展开分支规则气泡（无截图无模块） */
export default function DecisionNode(props: NodeProps) {
  const { decision, branches, open, onOpenEdge } = props.data as unknown as DecisionData
  return (
    <div className="decision-wrap">
      <Handle type="target" position={Position.Left} id="l" className="hh" />
      <Handle type="source" position={Position.Right} id="r" className="hh" />
      <Handle type="source" position={Position.Bottom} id="bs" className="hh" />
      <Handle type="target" position={Position.Bottom} id="bt" className="hh" />
      <Handle type="source" position={Position.Top} id="ts" className="hh" />
      <Handle type="target" position={Position.Top} id="tt" className="hh" />
      <div
        className="decision-card"
        title={decision.desc ?? '点击查看分支规则'}
        onClick={(e) => {
          e.stopPropagation()
          onOpenEdge(open ? null : `dec:${decision.id}`)
        }}
      >
        <div className="decision-diamond" />
        <div className="decision-name">{decision.name}</div>
      </div>
      {open && (
        <div className="edge-pop decision-pop nodrag nopan" onClick={(e) => e.stopPropagation()}>
          <div className="ep-row ep-head">
            <span className="ep-type et-branch">判断 · {branches.length} 个分支</span>
            <button className="ep-close" onClick={() => onOpenEdge(null)}>
              ✕
            </button>
          </div>
          {decision.desc && (
            <div className="ep-row">
              <span className="ep-k">规则</span>
              <span className="ep-v">{decision.desc}</span>
            </div>
          )}
          {branches.map((b, i) => (
            <div key={i} className={`ep-item${i > 0 || decision.desc ? ' ep-item-sep' : ''}`}>
              <div className="ep-row">
                <span className="ep-k">分支</span>
                <span className="ep-v">
                  {b.condition ?? b.label} → {b.toLabel}
                  <span className={`ep-type ep-type-sm et-${b.type}`}>{EDGE_TYPE_NAME[b.type]}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
