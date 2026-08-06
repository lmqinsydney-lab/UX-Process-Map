import { toPng } from 'html-to-image'
import { buildSpec, renderPageBody } from './pagegen'
import type { Decision, FlowEdgeData, ModuleDef, ModuleInstance, Page, Project } from '../types/model'

export interface FlowNodeT {
  id: string
  type: 'start' | 'page' | 'branch' | 'modal' | 'end'
  title: string
  desc?: string
  depth?: number
}
export interface FlowEdgeT {
  from: string
  to: string
  label?: string
}
export interface Flow {
  name: string
  nodes: FlowNodeT[]
  edges: FlowEdgeT[]
}

/** 生图组件类型 → 全局模块定义（组件清单即模块划分） */
const COMP_MODULE: Record<string, { id: string; name: string; desc: string }> = {
  navbar: { id: 'gen-navbar', name: '导航栏', desc: '页面顶部导航，含返回与标题。' },
  search: { id: 'gen-search', name: '搜索栏', desc: '搜索输入入口。' },
  banner: { id: 'gen-banner', name: '运营横幅', desc: '主推内容横幅，含标题与行动按钮。' },
  notice: { id: 'gen-notice', name: '通知条', desc: '滚动通知/提示条。' },
  grid: { id: 'gen-grid', name: '功能宫格', desc: '功能入口图标宫格。' },
  steps: { id: 'gen-steps', name: '步骤条', desc: '流程进度步骤指示。' },
  cards: { id: 'gen-cards', name: '卡片列表', desc: '内容卡片列表。' },
  plans: { id: 'gen-plans', name: '方案对比', desc: '多方案对比选择卡组。' },
  form: { id: 'gen-form', name: '表单', desc: '信息录入表单字段组。' },
  info: { id: 'gen-info', name: '信息明细', desc: '键值对信息明细卡。' },
  amount: { id: 'gen-amount', name: '金额展示', desc: '大字金额展示区。' },
  paylist: { id: 'gen-paylist', name: '支付方式列表', desc: '支付渠道单选列表。' },
  agreement: { id: 'gen-agreement', name: '协议勾选', desc: '协议阅读与勾选行。' },
  button: { id: 'gen-button', name: '主操作按钮', desc: '页面底部主操作按钮。' },
  result: { id: 'gen-result', name: '结果反馈', desc: '操作结果反馈（成功/失败）。' },
  coupon: { id: 'gen-coupon', name: '优惠券', desc: '优惠券领取/展示条。' },
  progress: { id: 'gen-progress', name: '进度状态', desc: '处理中进度状态卡。' },
  tabbar: { id: 'gen-tabbar', name: '底部标签栏', desc: '底部主导航标签栏。' },
}

const PHONE_W = 340
const PHONE_H = 736 // ≈375:812，与链路端页面卡片比例一致

/** 兜底截图：foreignObject SVG 快照（纯序列化，不依赖 canvas/字体加载，任何环境可用） */
function svgSnapshot(el: HTMLElement): string {
  let html = new XMLSerializer().serializeToString(el)
  // XMLSerializer 通常已给根元素加 xhtml 命名空间；缺失时补上（重复会导致非法 XML）
  if (!/^<div[^>]*xmlns=/.test(html)) {
    html = html.replace(/^<div/, '<div xmlns="http://www.w3.org/1999/xhtml"')
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W}" height="${PHONE_H}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

let pngUnavailable = false // 首次超时后本次会话直接走 SVG 快照，避免逐页等待

async function snapshot(frame: HTMLElement): Promise<string> {
  if (pngUnavailable) return svgSnapshot(frame)
  try {
    return await Promise.race([
      toPng(frame, { width: PHONE_W, height: PHONE_H, pixelRatio: 2 }),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error('toPng timeout')), 3500)),
    ])
  } catch {
    pngUnavailable = true
    return svgSnapshot(frame)
  }
}

const GROUP_ID = 'main'

/**
 * 把第一步的流程图编译成可视化体验链路 1.0：
 * 逐节点 mock 生图（渲染离屏 DOM）→ 测量组件热区 → 截图为 dataURL → 组装 project.json。
 */
export async function compileFlow(
  flow: Flow,
  onProgress: (done: number, total: number, label: string) => void,
): Promise<Project> {
  const pageNodes = flow.nodes.filter((n) => n.type !== 'branch')
  const seq = new Map<string, number>()
  ;[...flow.nodes]
    .map((n, i) => ({ n, i }))
    .sort((a, b) => (a.n.depth ?? 0) - (b.n.depth ?? 0) || a.i - b.i)
    .forEach(({ n }, idx) => seq.set(n.id, idx))

  const decisions: Decision[] = flow.nodes
    .filter((n) => n.type === 'branch')
    .map((n) => ({ id: n.id, processNodeId: GROUP_ID, name: n.title, desc: n.desc, seq: seq.get(n.id) }))

  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
  document.body.appendChild(host)

  const modulesUsed = new Map<string, ModuleDef>()
  const pages: Page[] = []

  try {
    let done = 0
    for (const n of pageNodes) {
      onProgress(done, pageNodes.length, n.title)
      const spec = buildSpec({ title: n.title, desc: n.desc || '' }, '', { fw: 'react', side: 'c', ds: 'gone-c', pt: 'auto' })
      const frame = document.createElement('div')
      frame.style.cssText = `width:${PHONE_W}px;height:${PHONE_H}px;overflow:hidden;background:#F5F7FA;`
      frame.innerHTML = renderPageBody(spec, false)
      host.appendChild(frame)
      // 等一帧完成布局（个别环境 rAF 不可用则退化为宏任务）
      await new Promise<void>((r) => {
        let settled = false
        requestAnimationFrame(() => { settled = true; r() })
        setTimeout(() => { if (!settled) r() }, 50)
      })

      // 组件热区：spec.comps 与 DOM .comp 按渲染顺序一一对应
      const frameRect = frame.getBoundingClientRect()
      const els = [...frame.querySelectorAll<HTMLElement>('.comp')]
      const instMap = new Map<string, ModuleInstance>()
      let elIdx = 0
      for (const c of spec.comps as { type: string }[]) {
        const el = els[elIdx]
        if (!el) break
        elIdx++
        const r = el.getBoundingClientRect()
        let x = ((r.left - frameRect.left) / PHONE_W) * 100
        let y = ((r.top - frameRect.top) / PHONE_H) * 100
        let w = (r.width / PHONE_W) * 100
        let h = (r.height / PHONE_H) * 100
        if (y >= 100 || h <= 0.5) continue // 被视口裁掉的组件不建热区
        if (y + h > 100) h = 100 - y
        if (x + w > 100) w = 100 - x
        x = Math.max(0, +x.toFixed(1)); y = Math.max(0, +y.toFixed(1))
        w = +w.toFixed(1); h = +h.toFixed(1)
        const mod = COMP_MODULE[c.type] ?? { id: `gen-${c.type}`, name: c.type, desc: '生成组件' }
        if (!modulesUsed.has(mod.id)) {
          modulesUsed.set(mod.id, { id: mod.id, name: mod.name, desc: mod.desc, states: [{ id: 'default', name: '默认' }] })
        }
        const exist = instMap.get(mod.id)
        if (exist) {
          // 同页同类型组件出现多次 → 1.0 先取包围盒并集
          const hz = exist.hotzones.default
          const nx = Math.min(hz.x, x), ny = Math.min(hz.y, y)
          hz.w = +(Math.max(hz.x + hz.w, x + w) - nx).toFixed(1)
          hz.h = +(Math.max(hz.y + hz.h, y + h) - ny).toFixed(1)
          hz.x = nx; hz.y = ny
        } else {
          instMap.set(mod.id, { moduleId: mod.id, hotzones: { default: { x, y, w, h } } })
        }
      }

      const image = await snapshot(frame)
      host.removeChild(frame)

      pages.push({
        id: n.id,
        processNodeId: GROUP_ID,
        name: n.title,
        seq: seq.get(n.id),
        desc: n.desc,
        states: [{ id: 'default', name: '默认', image }],
        moduleInstances: [...instMap.values()],
      })
      done++
      onProgress(done, pageNodes.length, n.title)
    }
  } finally {
    host.remove()
  }

  const decisionIds = new Set(decisions.map((d) => d.id))
  const outSeen = new Map<string, number>()
  const edges: FlowEdgeData[] = flow.edges.map((e, i) => {
    const fromDecision = decisionIds.has(e.from)
    const nth = outSeen.get(e.from) ?? 0
    outSeen.set(e.from, nth + 1)
    return {
      id: `e${i + 1}`,
      from: { pageId: e.from },
      to: { pageId: e.to },
      event: fromDecision ? '系统判断' : e.label || '进入下一步',
      condition: fromDecision ? e.label || `分支 ${nth + 1}` : undefined,
      type: nth === 0 ? 'main' : 'branch',
    }
  })

  // 主操作按钮 → 该页第一条主流程出边（双击可走查）
  for (const p of pages) {
    const btn = p.moduleInstances.find((m) => m.moduleId === 'gen-button')
    const out = edges.find((e) => e.from.pageId === p.id && e.type === 'main')
    if (btn && out) btn.clickEdgeId = out.id
  }

  return {
    project: { name: flow.name, version: 'v1.0' },
    processNodes: [{ id: GROUP_ID, name: flow.name, note: '由一句话/PRD 自动生成的链路 1.0' }],
    modules: [...modulesUsed.values()],
    pages,
    decisions,
    edges,
  }
}
