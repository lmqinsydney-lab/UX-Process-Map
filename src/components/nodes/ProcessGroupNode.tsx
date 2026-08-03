import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ProcessNode } from '../../types/model'

export default function ProcessGroupNode(props: NodeProps) {
  const { node, width, height } = props.data as { node: ProcessNode; width: number; height: number }
  return (
    <div className="process-group" style={{ width, height }}>
      <Handle type="target" position={Position.Left} id="gl" className="hh" />
      <Handle type="source" position={Position.Right} id="gr" className="hh" />
      <Handle type="source" position={Position.Bottom} id="gbs" className="hh" />
      <Handle type="target" position={Position.Bottom} id="gbt" className="hh" />
      <div className="pg-header">
        <span className="pg-title">{node.name}</span>
        {node.note && (
          <span className="pg-note" title={node.note}>
            {node.note}
          </span>
        )}
      </div>
    </div>
  )
}
