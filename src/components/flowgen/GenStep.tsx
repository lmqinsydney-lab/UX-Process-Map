import { useCallback, useState } from 'react'
import { GENERIC_TEMPLATE, SAMPLE_PRD, TEMPLATES, layoutFlow, parsePrd } from '../../flowgen/templates'
import type { Flow, FlowNodeT } from '../../flowgen/compile'

const CHIPS = [
  { label: '车险投保', p: '做一个车险投保流程' },
  { label: '电商下单', p: '做一个电商购物下单流程' },
  { label: '外卖点餐', p: '做一个外卖点餐 App' },
  { label: '登录注册', p: '做一个 App 登录注册流程' },
]

interface Props {
  /** 生成完成，交出带布局（depth）的流程 */
  onGenerated: (flow: Flow) => void
}

/** 前置独立页：一句话 / PRD 文档生成流程，完成后进入流程编辑页 */
export default function GenStep({ onGenerated }: Props) {
  const [prompt, setPrompt] = useState('')
  const [prdMode, setPrdMode] = useState(false)
  const [prdText, setPrdText] = useState('')
  const [genStep, setGenStep] = useState<string | null>(null)

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
      onGenerated(f)
    },
    [genStep, onGenerated],
  )

  return (
    <div className="gen-root">
      <div className="gen-hero">
        <div className="gen-title">从一句话到可视化体验链路</div>
        <div className="gen-sub">
          输入一句话或粘贴 PRD，自动生成页面流程图；下一步可编辑节点与状态，确认后自动生成可视化体验链路
        </div>
        <div className="fg-seg gen-seg">
          <button className={!prdMode ? 'on' : ''} onClick={() => setPrdMode(false)}>一句话</button>
          <button className={prdMode ? 'on' : ''} onClick={() => setPrdMode(true)}>PRD 文档</button>
        </div>
        {!prdMode ? (
          <>
            <div className="gen-row">
              <input
                className="fg-input gen-input"
                value={prompt}
                placeholder="一句话描述产品或流程，如：做一个车险投保流程"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && generate(prompt, false)}
              />
              <button className="fg-gen" disabled={!!genStep} onClick={() => prompt.trim() && generate(prompt, false)}>
                {genStep ? '生成中…' : '生成流程'}
              </button>
            </div>
            <div className="gen-chips">
              <span>试试：</span>
              {CHIPS.map((c) => (
                <button key={c.label} className="fg-chip" disabled={!!genStep} onClick={() => { setPrompt(c.p); generate(c.p, false) }}>
                  {c.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <textarea
              className="gen-prd"
              value={prdText}
              placeholder="粘贴 PRD 内容，将自动识别页面与流程"
              onChange={(e) => setPrdText(e.target.value)}
            />
            <div className="gen-row">
              <button className="fg-chip" onClick={() => setPrdText(SAMPLE_PRD)}>填入示例 PRD</button>
              <span className="fg-spacer" />
              <button className="fg-gen" disabled={!!genStep} onClick={() => prdText.trim() && generate(prdText, true)}>
                {genStep ? '解析中…' : '解析并生成'}
              </button>
            </div>
          </>
        )}
        {genStep && <div className="gen-status">{genStep}</div>}
      </div>
    </div>
  )
}
