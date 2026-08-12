import { useCallback, useState } from 'react'
import { SAMPLE_PRD } from '../../flowgen/templates'
import { createImportedPrdDraft, createPlaceholderPrdDraft, type PrdDraft } from '../../flowgen/prdDraft'

const CHIPS = [
  { label: '车险投保', p: '做一个车险投保流程' },
  { label: '电商下单', p: '做一个电商购物下单流程' },
  { label: '外卖点餐', p: '做一个外卖点餐 App' },
  { label: '登录注册', p: '做一个 App 登录注册流程' },
]

interface Props {
  /** 需求输入完成后先进入 PRD 生成，不直接生成流程。 */
  onPrdReady: (draft: PrdDraft) => void
}

/** 前置独立页：一句话 / 已有 PRD → PRD 生成 */
export default function GenStep({ onPrdReady }: Props) {
  const [prompt, setPrompt] = useState('')
  const [prdMode, setPrdMode] = useState(false)
  const [prdText, setPrdText] = useState('')
  const [genStep, setGenStep] = useState<string | null>(null)

  const createDraft = useCallback(
    async (text: string, fromPrd: boolean) => {
      if (genStep) return
      const steps = fromPrd
        ? ['正在读取 PRD 文档…', '整理文档结构…', '准备 PRD 编辑器…']
        : ['正在整理需求…', '创建 PRD 占位初稿…', '准备 PRD 编辑器…']
      for (const s of steps) {
        setGenStep(s)
        await new Promise((r) => setTimeout(r, 320))
      }
      setGenStep(null)
      onPrdReady(fromPrd ? createImportedPrdDraft(text) : createPlaceholderPrdDraft(text))
    },
    [genStep, onPrdReady],
  )

  const submitDraft = useCallback(() => {
    const text = prdMode ? prdText : prompt
    if (text.trim()) void createDraft(text, prdMode)
  }, [createDraft, prdMode, prdText, prompt])

  return (
    <div className="gen-root">
      <div className="gen-hero">
        <div className="gen-title">从一句话到可视化体验链路</div>
        <div className="gen-sub">
          输入一句话或导入已有 PRD，先完善产品需求文档，再从 PRD 生成可编辑流程图与可视化体验链路
        </div>
        <div className="gen-composer">
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
                onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && submitDraft()}
              />
              <button className="stage-primary gen-submit" disabled={!!genStep || !prompt.trim()} onClick={submitDraft}>
                {genStep ? '准备中…' : '生成 PRD 初稿'}
              </button>
            </div>
            <div className="gen-chips">
              <span>试试：</span>
              {CHIPS.map((c) => (
                <button key={c.label} className="fg-chip" disabled={!!genStep} onClick={() => setPrompt(c.p)}>
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
              placeholder="粘贴已有 PRD 内容，进入编辑器继续完善"
              onChange={(e) => setPrdText(e.target.value)}
            />
            <div className="gen-row gen-prd-actions">
              <button className="fg-chip" onClick={() => setPrdText(SAMPLE_PRD)}>填入示例 PRD</button>
              <span className="fg-spacer" />
              <button className="stage-primary gen-submit" disabled={!!genStep || !prdText.trim()} onClick={submitDraft}>
                {genStep ? '准备中…' : '进入 PRD 生成'}
              </button>
            </div>
          </>
        )}
        </div>
        {genStep && <div className="gen-status">{genStep}</div>}
      </div>
    </div>
  )
}
