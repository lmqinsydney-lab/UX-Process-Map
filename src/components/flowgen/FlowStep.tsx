import { useCallback, useMemo, useState } from 'react'
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
} from '@xyflow/react'
import { GENERIC_TEMPLATE, SAMPLE_PRD, TEMPLATES, layoutFlow, parsePrd } from '../../flowgen/templates'
import MeasureFallback from '../MeasureFallback'
import type { Flow, FlowNodeT } from '../../flowgen/compile'

const TYPE_NAME: Record<string, string> = { start: '入口', page: '页面', branch: '判断', modal: '弹窗', end: '结束' }
const TYPE_COLOR: Record<string, string> = { start: '#16a34a', page: '#4f46e5', branch: '#f59e0b', modal: '#db2777', end: '#6b7280' }

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

const CHIPS = [
  { label: '车险投保', p: '做一个车险投保流程' },
  { label: '电商下单', p: '做一个电商购物下单流程' },
  { label: '外卖点餐', p: '做一个外卖点餐 App' },
  { label: '登录注册', p: '做一个 App 登录注册流程' },
]

interface Props {
  onNext: (flow: Flow) => void
  busy: boolean
}

export default function FlowStep({ onNext, busy }: Props) {
  const [prompt, setPrompt] = useState('')
  const [genStep, setGenStep] = useState<string | null>(null)
  const [prdOpen, setPrdOpen] = useState(false)
  const [prdText, setPrdText] = useState('')
  const [flowName, setFlowName] = useState('')
  const [rfNodes, setRfNodes] = useState<Node[]>([])
  const [rfEdges, setRfEdges] = useState<Edge[]>([])
  const [seq, setSeq] = useState(1)

  const selected = rfNodes.find((n) => n.selected)
  const selNode = selected ? ((selected.data as { node: FlowNodeT }).node ?? null) : null

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
  }, [])

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

  const generate = useCallback(
    async (text: string, fromPrd: boolean) => {
      if (genStep) return
      const steps = fromPrd
        ? ['正在解析 PRD 文档…', '识别页面与流程关键词…', '构建节点关系图…', '自动布局中…']
        : ['正在理解需求…', '拆解用户旅程与关键场景…', '生成页面节点与分支…', '自动布局中…']
      for (const s of steps) {
        setGenStep(s)
        await new Promise((r) => setTimeout(r, 380))
      }
      let tpl
      if (fromPrd) {
        tpl = parsePrd(text)
      } else {
        tpl = TEMPLATES.find((t: { match: RegExp }) => t.match.test(text))
        if (!tpl) {
          const topic = text.replace(/做一个|帮我做|设计|流程|的|一个|App|app/g, '').trim().slice(0, 6) || '产品'
          tpl = GENERIC_TEMPLATE(topic)
        }
      }
      const f: Flow = {
        name: tpl.name,
        nodes: tpl.nodes.map((n: FlowNodeT) => ({ ...n })),
        edges: tpl.edges.map((e: { from: string; to: string; label?: string }) => ({ ...e })),
      }
      layoutFlow(f)
      const byDepth = new Map<number, FlowNodeT[]>()
      for (const n of f.nodes) {
        const d = n.depth ?? 0
        if (!byDepth.has(d)) byDepth.set(d, [])
        byDepth.get(d)!.push(n)
      }
      setFlowName(f.name)
      setRfNodes(
        f.nodes.map((n) => {
          const col = byDepth.get(n.depth ?? 0)!
          const row = col.indexOf(n)
          return {
            id: n.id,
            type: 'flowGen',
            position: { x: (n.depth ?? 0) * 280, y: (row - (col.length - 1) / 2) * 150 },
            data: { node: n },
          }
        }),
      )
      setRfEdges(f.edges.map((e, i) => toRfEdge(e.from, e.to, e.label, i)))
      setGenStep(null)
    },
    [genStep],
  )

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
    },
    [rfNodes, seq],
  )

  const deleteNode = useCallback((id: string) => {
    setRfNodes((ns) => ns.filter((n) => n.id !== id))
    setRfEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((ns) => applyNodeChanges(changes, ns))
  }, [])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    setRfEdges((es) => {
      if (es.some((e) => e.source === c.source && e.target === c.target)) return es
      return [...es, toRfEdge(c.source, c.target, undefined, `c${es.length}-${c.source}`)]
    })
  }, [])

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
        <div className="fg-seg">
          <button className={!prdOpen ? 'on' : ''} onClick={() => setPrdOpen(false)}>一句话</button>
          <button onClick={() => setPrdOpen(true)}>PRD 文档</button>
        </div>
        <input
          className="fg-input"
          value={prompt}
          placeholder="一句话描述产品或流程，如：做一个车险投保流程"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && generate(prompt, false)}
        />
        <button className="fg-gen" disabled={!!genStep} onClick={() => prompt.trim() && generate(prompt, false)}>
          {genStep ? '生成中…' : '生成流程'}
        </button>
        <div className="fg-chips">
          {CHIPS.map((c) => (
            <button key={c.label} className="fg-chip" onClick={() => { setPrompt(c.p); generate(c.p, false) }}>
              {c.label}
            </button>
          ))}
        </div>
        {rfNodes.length > 0 && (
          <div className="fg-chips">
            <button className="fg-chip" onClick={() => addNode('page')}>＋ 页面节点</button>
            <button className="fg-chip" onClick={() => addNode('branch')}>＋ 判断节点</button>
          </div>
        )}
        <span className="fg-spacer" />
      </div>
      <div className="fg-canvas">
        {!rfNodes.length && !genStep && (
          <div className="fg-empty">
            <div className="fg-empty-title">第一步 · 一句话生成流程</div>
            <div className="fg-empty-sub">输入一句话或粘贴 PRD，生成页面流程图；节点可拖拽、增删、编辑与配置状态，确认后进入下一步自动生成可视化体验链路</div>
          </div>
        )}
        {genStep && <div className="fg-genmask">{genStep}</div>}
        {rfNodes.length > 0 && (
          <button className="fg-next-float" disabled={busy} onClick={() => onNext(buildFlow())}>
            <span className="fg-next-main">下一步 · 生成可视化体验链路</span>
            <span className="fg-next-sub">为每个页面节点自动生成初版设计稿 →</span>
          </button>
        )}
        <ReactFlowProvider>
          <ReactFlow
            nodes={rfNodes}
            edges={graphEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
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
                    onClick={() =>
                      patchNode(selNode.id, (cur) => {
                        const list = cur.states ?? [{ id: 'default', name: '默认' }]
                        return { states: [...list, { id: `s${Date.now() % 1000000}-${list.length}`, name: `状态 ${list.length + 1}` }] }
                      })
                    }
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
      {prdOpen && (
        <div className="fg-modal" onMouseDown={(e) => e.target === e.currentTarget && setPrdOpen(false)}>
          <div className="fg-modal-card">
            <div className="fg-modal-title">粘贴 PRD 文档</div>
            <textarea value={prdText} placeholder="粘贴 PRD 内容，将自动识别页面与流程" onChange={(e) => setPrdText(e.target.value)} />
            <div className="fg-modal-foot">
              <button className="fg-chip" onClick={() => setPrdText(SAMPLE_PRD)}>填入示例 PRD</button>
              <span className="fg-spacer" />
              <button className="fg-chip" onClick={() => setPrdOpen(false)}>取消</button>
              <button className="fg-gen" onClick={() => { if (prdText.trim()) { setPrdOpen(false); generate(prdText, true) } }}>
                解析并生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
