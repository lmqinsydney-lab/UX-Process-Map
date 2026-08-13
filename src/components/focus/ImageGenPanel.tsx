import { useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from '../../types/model'

const HISTORY_KEY = 'uxpm.image-generation-history'

interface GenerationRecord {
  id: string
  pageId: string
  pageName: string
  prompt: string
  createdAt: string
  status: 'placeholder'
  config: GenerationConfig
}

interface GenerationConfig {
  framework: 'React' | 'Vue 3' | 'Flutter' | '小程序'
  side: 'C 端' | 'B 端'
  designSystem: 'G-One C' | '滴滴保 B 端' | '滴滴支付 B 端' | '不使用设计系统'
  pageType: '自动判断' | '首页' | '列表页' | '表单页' | '详情页' | '收银台' | '结果页'
}

const DEFAULT_CONFIG: GenerationConfig = {
  framework: 'React',
  side: 'C 端',
  designSystem: 'G-One C',
  pageType: '自动判断',
}

interface Props {
  page: Page
  mode: 'generate' | 'history'
  onMode: (mode: 'generate' | 'history') => void
  onExit: () => void
}

function loadRecords(): GenerationRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as GenerationRecord[]) : []
  } catch {
    return []
  }
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function ImageGenPanel({ page, mode, onMode, onExit }: Props) {
  const [records, setRecords] = useState<GenerationRecord[]>(loadRecords)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG)
  const aliveRef = useRef(true)

  useEffect(() => {
    // React StrictMode 开发态会执行一次 setup → cleanup → setup，需在每次 setup 时恢复存活标记。
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const pageRecords = useMemo(
    () => records.filter((record) => record.pageId === page.id).slice().reverse(),
    [page.id, records],
  )

  const generate = async () => {
    const text = prompt.trim()
    if (!text || generating) return
    setGenerating(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    if (!aliveRef.current) return
    const next: GenerationRecord = {
      id: `${Date.now()}`,
      pageId: page.id,
      pageName: page.name,
      prompt: text,
      createdAt: new Date().toISOString(),
      status: 'placeholder',
      config,
    }
    setRecords((previous) => {
      const updated = [...previous, next]
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
    setPrompt('')
    setGenerating(false)
  }

  if (mode === 'history') {
    const timeline = records.slice().reverse()
    return (
      <div className="image-gen-panel">
        <div className="ig-mode-head">
          <div>
            <button className="ig-back-link" onClick={() => onMode('generate')}>← 返回生图模式</button>
            <h2>生成记录</h2>
          </div>
          <button className="ig-exit" onClick={onExit}>退出</button>
        </div>
        <div className="ig-history">
          {timeline.length ? timeline.map((record) => (
            <article className="ig-record" key={record.id}>
              <i />
              <div className="ig-record-card">
                <div className="ig-record-meta">
                  <strong>{record.pageName}</strong>
                  <time>{formatTime(record.createdAt)}</time>
                </div>
                <p>{record.prompt}</p>
                {record.config && (
                  <div className="ig-record-config">
                    {record.config.framework} · {record.config.side} · {record.config.designSystem} · {record.config.pageType}
                  </div>
                )}
                <span>占位生成 · 未调用真实生图服务</span>
              </div>
            </article>
          )) : (
            <div className="ig-empty"><strong>还没有生成记录</strong><span>完成一次对话生成后，记录会按时间显示在这里</span></div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="image-gen-panel">
      <div className="ig-mode-head">
        <div>
          <span className="ig-eyebrow">AI 页面生图</span>
          <h2>{page.name}</h2>
        </div>
        <div className="ig-head-actions">
          <button className="ig-history-btn" onClick={() => onMode('history')}>生成记录</button>
          <button className="ig-exit" onClick={onExit}>退出</button>
        </div>
      </div>
      <div className="ig-notice">
        <strong>当前为交互占位</strong>
        <span>尚未接入真实生图模型；提交内容只会保存为生成记录，不会修改页面图片。</span>
      </div>
      <div className="ig-config" aria-label="页面生成配置">
        <label>
          <span>框架</span>
          <select value={config.framework} onChange={(event) => setConfig({ ...config, framework: event.target.value as GenerationConfig['framework'] })}>
            {['React', 'Vue 3', 'Flutter', '小程序'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>端类型</span>
          <select value={config.side} onChange={(event) => setConfig({ ...config, side: event.target.value as GenerationConfig['side'] })}>
            {['C 端', 'B 端'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>设计系统</span>
          <select value={config.designSystem} onChange={(event) => setConfig({ ...config, designSystem: event.target.value as GenerationConfig['designSystem'] })}>
            {['G-One C', '滴滴保 B 端', '滴滴支付 B 端', '不使用设计系统'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>页面类型</span>
          <select value={config.pageType} onChange={(event) => setConfig({ ...config, pageType: event.target.value as GenerationConfig['pageType'] })}>
            {['自动判断', '首页', '列表页', '表单页', '详情页', '收银台', '结果页'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="ig-chat">
        <div className="ig-assistant">
          告诉我希望如何调整这个页面。你可以描述布局、视觉风格、文案或组件变化。
        </div>
        {pageRecords.map((record) => (
          <div className="ig-turn" key={record.id}>
            <div className="ig-user">{record.prompt}</div>
            <div className="ig-assistant">
              已记录本次生成需求。当前未连接真实生图服务，因此页面图片暂未发生变化。
              {record.config && <small>{record.config.framework} · {record.config.side} · {record.config.designSystem} · {record.config.pageType}</small>}
              <time>{formatTime(record.createdAt)}</time>
            </div>
          </div>
        ))}
      </div>
      <div className="ig-compose">
        <div className="ig-suggestions">
          {['调整为深色风格', '强化主操作按钮', '优化信息层级'].map((text) => (
            <button key={text} onClick={() => setPrompt(text)}>{text}</button>
          ))}
        </div>
        <textarea
          rows={4}
          value={prompt}
          placeholder={`描述你希望如何修改「${page.name}」…`}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void generate()
            }
          }}
        />
        <div className="ig-compose-foot">
          <span>Enter 发送 · Shift + Enter 换行</span>
          <button disabled={!prompt.trim() || generating} onClick={() => void generate()}>
            {generating ? '生成中…' : '生成页面'}
          </button>
        </div>
      </div>
    </div>
  )
}
