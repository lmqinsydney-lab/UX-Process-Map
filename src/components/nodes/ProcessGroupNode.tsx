import type { NodeProps } from '@xyflow/react'
import type { ProcessNode } from '../../types/model'

export default function ProcessGroupNode(props: NodeProps) {
  const { node, width, height } = props.data as { node: ProcessNode; width: number; height: number }
  return (
    <div className="process-group" style={{ width, height }}>
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
