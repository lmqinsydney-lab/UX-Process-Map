import { GENERIC_TEMPLATE, TEMPLATES } from './templates'
import type { FlowNodeT } from './compile'

export interface PrdDraft {
  id: number
  title: string
  html: string
  source: 'prompt' | 'import'
  sourceText: string
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function importedTextToHtml(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const safe = escapeHtml(line)
      if (index === 0) return `<h1>${safe}</h1>`
      if (/^[一二三四五六七八九十]+、|^\d+[.、]/.test(line)) return `<h2>${safe}</h2>`
      if (/^[-•]/.test(line)) return `<p>• ${safe.replace(/^[-•]\s*/, '')}</p>`
      return `<p>${safe}</p>`
    })
    .join('')
}

/**
 * PRD Skill 接入点：当前仅根据模板产出占位初稿。
 * 未来可将该函数替换为异步 Skill 调用，并继续返回同一 PrdDraft 结构。
 */
export function createPlaceholderPrdDraft(input: string): PrdDraft {
  const tpl = TEMPLATES.find((item: { match: RegExp }) => item.match.test(input)) ??
    GENERIC_TEMPLATE(input.replace(/做一个|帮我做|设计|流程|的|一个|App|app/g, '').trim().slice(0, 8) || '产品')
  const nodes = tpl.nodes as FlowNodeT[]
  const title = `${tpl.name}产品需求文档`
  const pageList = nodes
    .map((node, index) => `<li><strong>${index + 1}. ${escapeHtml(node.title)}</strong>：${escapeHtml(node.desc ?? '待补充页面说明')}</li>`)
    .join('')

  return {
    id: Date.now(),
    title,
    source: 'prompt',
    sourceText: input,
    html: `
      <h1>${escapeHtml(title)}</h1>
      <p><strong>文档状态：</strong>占位初稿 · 待产品完善</p>
      <p><strong>原始需求：</strong>${escapeHtml(input)}</p>
      <h2>1. 需求背景</h2>
      <p>围绕“${escapeHtml(input)}”建设一条完整、清晰且可验证的用户体验流程，降低用户完成核心任务的理解与操作成本。</p>
      <h2>2. 产品目标</h2>
      <ul><li>覆盖用户从进入到完成目标的核心链路。</li><li>明确关键页面、判断条件及异常反馈。</li><li>为后续流程图与可视化页面生成提供结构化输入。</li></ul>
      <h2>3. 核心流程与页面</h2>
      <ol>${pageList}</ol>
      <h2>4. 业务规则</h2>
      <p>核心规则、准入条件和状态流转逻辑待产品经理结合实际业务补充。</p>
      <h2>5. 异常与边界</h2>
      <ul><li>网络异常时保留用户已填写内容，并提供明确重试入口。</li><li>关键提交操作需要防止重复点击，并展示处理中状态。</li><li>失败结果需说明原因，并提供返回或重新操作路径。</li></ul>
      <h2>6. 数据与验收</h2>
      <p>关键页面曝光、核心按钮点击、提交成功与失败结果均需埋点；具体指标口径和验收标准待补充。</p>
    `,
  }
}

export function createImportedPrdDraft(text: string): PrdDraft {
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean) ?? '导入 PRD'
  return {
    id: Date.now(),
    title: firstLine.slice(0, 50),
    html: importedTextToHtml(text),
    source: 'import',
    sourceText: text,
  }
}
