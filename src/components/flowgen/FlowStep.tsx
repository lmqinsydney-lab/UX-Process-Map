import { useCallback, useMemo, useState } from 'react'
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, type NodeProps } from '@xyflow/react'
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
        <Handle type="target" position={Position.Left} className="hh" />
        <Handle type="source" position={Position.Right} className="hh" />
        <div className="fg-branch-diamond" />
        <div className="fg-branch-name">{n.title}</div>
      </div>
    )
  }
  return (
    <div className="fg-node">
      <Handle type="target" position={Position.Left} className="hh" />
      <Handle type="source" position={Position.Right} className="hh" />
      <span className="fg-type" style={{ color: TYPE_COLOR[n.type], borderColor: TYPE_COLOR[n.type] }}>
        {TYPE_NAME[n.type]}
      </span>
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
  flow: Flow | null
  onFlowChange: (flow: Flow | null) => void
  onNext: () => void
  busy: boolean
}

export default function FlowStep({ flow, onFlowChange, onNext, busy }: Props) {
  const [prompt, setPrompt] = useState('')
  const [genStep, setGenStep] = useState<string | null>(null)
  const [prdOpen, setPrdOpen] = useState(false)
  const [prdText, setPrdText] = useState('')

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
      setGenStep(null)
      onFlowChange(f)
    },
    [genStep, onFlowChange],
  )

  const graph = useMemo(() => {
    if (!flow) return { nodes: [], edges: [] }
    const byDepth = new Map<number, FlowNodeT[]>()
    for (const n of flow.nodes) {
      const d = n.depth ?? 0
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(n)
    }
    const nodes = flow.nodes.map((n) => {
      const col = byDepth.get(n.depth ?? 0)!
      const row = col.indexOf(n)
      return {
        id: n.id,
        type: 'flowGen',
        position: { x: (n.depth ?? 0) * 280, y: (row - (col.length - 1) / 2) * 150 },
        data: { node: n },
      }
    })
    const edges = flow.edges.map((e, i) => ({
      id: `fe${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#818cf8' },
      style: { stroke: '#818cf8', strokeWidth: 1.6 },
      labelStyle: { fontSize: 11, fill: '#4b5563' },
      labelBgStyle: { fill: '#ffffff', stroke: '#d6d9df' },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 8,
    }))
    return { nodes, edges }
  }, [flow])

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
        <span className="fg-spacer" />
        <button className="fg-next" disabled={!flow || busy} onClick={onNext} title={flow ? undefined : '先生成流程图'}>
          下一步：生成可视化体验链路 →
        </button>
      </div>
      <div className="fg-canvas">
        {!flow && !genStep && (
          <div className="fg-empty">
            <div className="fg-empty-title">第一步 · 一句话生成流程</div>
            <div className="fg-empty-sub">输入一句话或粘贴 PRD，生成页面流程图；确认后进入下一步自动生成可视化体验链路</div>
          </div>
        )}
        {genStep && <div className="fg-genmask">{genStep}</div>}
        <ReactFlowProvider>
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.2}
            maxZoom={1.6}
            panOnScroll
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={24} size={1.5} color="#e3e5ea" />
            <Controls showInteractive={false} />
            <MeasureFallback dep={flow} refit />
          </ReactFlow>
        </ReactFlowProvider>
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
