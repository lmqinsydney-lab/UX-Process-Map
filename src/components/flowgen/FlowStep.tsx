import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react'
import { layoutFlow } from '../../flowgen/templates'
import MeasureFallback from '../MeasureFallback'
import type { Flow, FlowNodeT } from '../../flowgen/compile'

const TYPE_NAME: Record<string, string> = { start: '入口', page: '页面', branch: '判断', modal: '弹窗', end: '结束' }
const TYPE_COLOR: Record<string, string> = { start: '#16a34a', page: '#4f46e5', branch: '#f59e0b', modal: '#db2777', end: '#6b7280' }
/** 右侧详情面板宽 300px，另含 12px 外边距。 */
const FLOW_PANEL_W = 312

function FlowGenNode(props: NodeProps) {
  const n = (props.data as { node: FlowNodeT }).node
  if (n.type === 'branch') {
    return (
      <div className="fg-branch">
        <Handle type="target" position={Position.Left} className="fgh" />
        <Handle type="source" position={Position.Right} className="fgh" />
        <div className="fg-branch-diamond" />
        <div className="fg-branch-name">{n.title}</div>
      </div>
    )
  }
  const states = n.states?.length ? n.states : null
  return (
    <div className="fg-node">
      <Handle type="target" position={Position.Left} className="fgh" />
      <Handle type="source" position={Position.Right} className="fgh" />
      <span className="fg-type" style={{ color: TYPE_COLOR[n.type], borderColor: TYPE_COLOR[n.type] }}>
        {TYPE_NAME[n.type]}
      </span>
      {states && <span className="fg-states-badge">{states.length} 个状态</span>}
      <div className="fg-title">{n.title}</div>
      {n.desc && <div className="fg-desc">{n.desc}</div>}
    </div>
  )
}
const nodeTypes = { flowGen: FlowGenNode }

interface Props {
  /** 前置生成页产出的流程（已带 depth 布局）；为 null 表示尚未生成 */
  flow: Flow | null
  /** flow 每次重新生成递增，用于触发装载 */
  flowVersion: number
  onNext: (flow: Flow) => void
  busy: boolean
  /** 流程发生语义性修改（增删节点/连线/编辑内容）时触发，用于使已生成的链路失效 */
  onFlowChange?: () => void
  /** 返回前置生成页重新输入 */
  onBackToGen: () => void
}

export default function FlowStep({ flow, flowVersion, onNext, busy, onFlowChange, onBackToGen }: Props) {
  const [flowName, setFlowName] = useState('')
  const [rfNodes, setRfNodes] = useState<Node[]>([])
  const [rfEdges, setRfEdges] = useState<Edge[]>([])
  const [seq, setSeq] = useState(1)
  const rfRef = useRef<ReactFlowInstance | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const focusTimerRef = useRef<number | null>(null)

  const selected = rfNodes.find((n) => n.selected)
  const selNode = selected ? ((selected.data as { node: FlowNodeT }).node ?? null) : null

  /** 与可视化链路的页面聚焦保持一致：为右侧详情面板留位后，将节点推近到剩余画布中央。 */
  const zoomToNode = useCallback((nodeId: string): boolean => {
    const rf = rfRef.current
    const canvas = canvasRef.current
    if (!rf || !canvas) return false
    const inode = rf.getInternalNode(nodeId)
    if (!inode) return false
    const nodeW = inode.measured.width
    const nodeH = inode.measured.height
    // 新增节点进入 store 后还需要一次 DOM 测量；尺寸未就绪时先等待，避免按估算尺寸定位后再修正。
    if (!nodeW || !nodeH) return false
    const abs = inode.internals.positionAbsolute
    const availW = Math.max(0, canvas.clientWidth - FLOW_PANEL_W)
    const availH = canvas.clientHeight
    const zoom = Math.min(1.6, Math.max(0.5, (availH * 0.82) / Math.max(nodeH, 96)))
    const cx = abs.x + nodeW / 2
    const cy = abs.y + nodeH / 2
    void rf.setViewport(
      { x: availW / 2 - cx * zoom, y: availH / 2 - cy * zoom, zoom },
      { duration: 480 },
    )
    return true
  }, [])

  const focusNode = useCallback((nodeId: string) => {
    if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current)
    let attempts = 0
    const tryFocus = () => {
      // 只在节点进入 React Flow store 后执行一次动画；未就绪时仅重试查找，不重复移动视口。
      if (zoomToNode(nodeId)) {
        focusTimerRef.current = null
        return
      }
      attempts += 1
      if (attempts < 6) focusTimerRef.current = window.setTimeout(tryFocus, 50)
      else focusTimerRef.current = null
    }
    focusTimerRef.current = window.setTimeout(tryFocus, 0)
  }, [zoomToNode])

  useEffect(() => () => {
    if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current)
  }, [])

  /** 更新某节点的业务数据（名称/简介/状态）；用函数式更新避免连续操作读到陈旧数据 */
  const patchNode = useCallback((id: string, patch: Partial<FlowNodeT> | ((cur: FlowNodeT) => Partial<FlowNodeT>)) => {
    setRfNodes((ns) =>
      ns.map((n) => {
        if (n.id !== id) return n
        const cur = (n.data as { node: FlowNodeT }).node
        const p = typeof patch === 'function' ? patch(cur) : patch
        return { ...n, data: { node: { ...cur, ...p } } }
      }),
    )
    onFlowChange?.()
  }, [onFlowChange])

  const toRfEdge = (from: string, to: string, label: string | undefined, i: number | string): Edge => ({
    id: `fe${i}`,
    source: from,
    target: to,
    label,
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#818cf8' },
    style: { stroke: '#818cf8', strokeWidth: 1.6 },
    labelStyle: { fontSize: 11, fill: '#4b5563' },
    labelBgStyle: { fill: '#ffffff', stroke: '#d6d9df' },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 8,
  })

  // 前置页每次生成新流程后装载到画布（flowVersion 递增触发）
  useEffect(() => {
    if (!flow) return
    const byDepth = new Map<number, FlowNodeT[]>()
    for (const n of flow.nodes) {
      const d = n.depth ?? 0
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(n)
    }
    setFlowName(flow.name)
    setRfNodes(
      flow.nodes.map((n) => {
        const col = byDepth.get(n.depth ?? 0)!
        const row = col.indexOf(n)
        return {
          id: n.id,
          type: 'flowGen',
          position: { x: (n.depth ?? 0) * 280, y: (row - (col.length - 1) / 2) * 150 },
          data: { node: { ...n } },
        }
      }),
    )
    setRfEdges(flow.edges.map((e, i) => toRfEdge(e.from, e.to, e.label, i)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowVersion])

  const addNode = useCallback(
    (type: 'page' | 'branch') => {
      const id = `n${seq}`
      setSeq((v) => v + 1)
      const node: FlowNodeT = {
        id,
        type,
        title: type === 'branch' ? '新判断' : '新页面',
        desc: type === 'branch' ? '判断条件说明' : '页面简介',
      }
      // 放在当前视野内已有节点的右下方向，避免重叠
      const maxX = rfNodes.length ? Math.max(...rfNodes.map((n) => n.position.x)) : 0
      setRfNodes((ns) => [
        ...ns.map((n) => ({ ...n, selected: false })),
        { id, type: 'flowGen', position: { x: maxX + 280, y: 40 }, data: { node }, selected: true },
      ])
      onFlowChange?.()
      focusNode(id)
    },
    [rfNodes, seq, onFlowChange, focusNode],
  )

  const deleteNode = useCallback((id: string) => {
    setRfNodes((ns) => ns.filter((n) => n.id !== id))
    setRfEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
    onFlowChange?.()
  }, [onFlowChange])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((ns) => applyNodeChanges(changes, ns))
    // 拖拽位置/选中不算修改；键盘删除节点算
    if (changes.some((c) => c.type === 'remove')) onFlowChange?.()
  }, [onFlowChange])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    setRfEdges((es) => {
      if (es.some((e) => e.source === c.source && e.target === c.target)) return es
      return [...es, toRfEdge(c.source, c.target, undefined, `c${es.length}-${c.source}`)]
    })
    onFlowChange?.()
  }, [onFlowChange])

  const buildFlow = useCallback((): Flow => {
    const f: Flow = {
      name: flowName || '未命名流程',
      nodes: rfNodes.map((n) => ({ ...(n.data as { node: FlowNodeT }).node })),
      edges: rfEdges.map((e) => ({ from: e.source, to: e.target, label: typeof e.label === 'string' ? e.label : undefined })),
    }
    layoutFlow(f)
    return f
  }, [flowName, rfNodes, rfEdges])

  const graphEdges = useMemo(() => rfEdges, [rfEdges])

  return (
    <div className="fg-root">
      <div className="fg-toolbar">
        <button className="fg-chip" onClick={onBackToGen}>← 重新输入</button>
        {flowName && <span className="fg-flow-name">{flowName}</span>}
        {rfNodes.length > 0 && (
          <div className="fg-chips">
            <button className="fg-chip" onClick={() => addNode('page')}>＋ 页面节点</button>
            <button className="fg-chip" onClick={() => addNode('branch')}>＋ 判断节点</button>
          </div>
        )}
        <span className="fg-spacer" />
      </div>
      <div className="fg-canvas" ref={canvasRef}>
        {!rfNodes.length && (
          <div className="fg-empty">
            <div className="fg-empty-title">还没有流程</div>
            <div className="fg-empty-sub">先在前置页输入一句话或粘贴 PRD 生成流程图，节点可拖拽、增删、编辑与配置状态</div>
            <button className="fg-gen" onClick={onBackToGen}>去生成流程</button>
          </div>
        )}
        {rfNodes.length > 0 && (
          <button className="fg-next-float" disabled={busy} onClick={() => onNext(buildFlow())}>
            <span className="fg-next-main">生成可视化链路</span>
          </button>
        )}
        <ReactFlowProvider>
          <ReactFlow
            nodes={rfNodes}
            edges={graphEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              rfRef.current = instance
            }}
            onNodeClick={(_, node) => focusNode(node.id)}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.2}
            maxZoom={1.6}
            panOnScroll
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
            nodesConnectable
            elementsSelectable
          >
            <Background gap={24} size={1.5} color="#e3e5ea" />
            <Controls showInteractive={false} />
            <MeasureFallback dep={rfNodes.length} refit />
          </ReactFlow>
        </ReactFlowProvider>
        {selNode && (
          <aside className="fg-panel">
            <div className="fg-panel-head">
              <span className="fg-type" style={{ color: TYPE_COLOR[selNode.type], borderColor: TYPE_COLOR[selNode.type] }}>
                {TYPE_NAME[selNode.type]}
              </span>
              <span className="fg-panel-title">节点详情</span>
              <button className="fg-del" onClick={() => deleteNode(selNode.id)}>删除节点</button>
            </div>
            <label className="fg-field">
              <span>名称</span>
              <input value={selNode.title} onChange={(e) => patchNode(selNode.id, { title: e.target.value })} />
            </label>
            <label className="fg-field">
              <span>简介</span>
              <textarea rows={3} value={selNode.desc ?? ''} onChange={(e) => patchNode(selNode.id, { desc: e.target.value })} />
            </label>
            {selNode.type !== 'branch' && (
              <div className="fg-field">
                <span>页面状态（{selNode.states?.length ?? 1} 个）</span>
                <div className="fg-states">
                  {(selNode.states ?? [{ id: 'default', name: '默认' }]).map((s, i, arr) => (
                    <div key={s.id} className="fg-state-row">
                      <input
                        value={s.name}
                        onChange={(e) =>
                          patchNode(selNode.id, (cur) => ({
                            states: (cur.states ?? [{ id: 'default', name: '默认' }]).map((x) =>
                              x.id === s.id ? { ...x, name: e.target.value } : x,
                            ),
                          }))
                        }
                      />
                      <button
                        className="fg-state-del"
                        disabled={arr.length <= 1}
                        title={arr.length <= 1 ? '至少保留一个状态' : '删除该状态'}
                        onClick={() =>
                          patchNode(selNode.id, (cur) => {
                            const next = (cur.states ?? []).filter((x) => x.id !== s.id)
                            return { states: next.length ? next : undefined }
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="fg-chip"
                    onClick={() => {
                      patchNode(selNode.id, (cur) => {
                        const list = cur.states ?? [{ id: 'default', name: '默认' }]
                        return { states: [...list, { id: `s${Date.now() % 1000000}-${list.length}`, name: `状态 ${list.length + 1}` }] }
                      })
                      // 用户可能已手动平移到别处；新增状态后重新回到当前节点。
                      focusNode(selNode.id)
                    }}
                  >
                    ＋ 添加状态
                  </button>
                </div>
                <p className="fg-field-tip">每个状态会在下一步各生成一版页面，进入链路后可切换查看</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
