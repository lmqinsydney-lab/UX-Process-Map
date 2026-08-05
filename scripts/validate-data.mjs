// project.json 引用完整性校验：id 唯一、外键存在、热区合法、图片文件存在。
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(readFileSync(resolve(root, 'src/data/project.json'), 'utf8'))

const errors = []
const dup = (arr, label) => {
  const seen = new Set()
  for (const id of arr) {
    if (seen.has(id)) errors.push(`${label} id 重复: ${id}`)
    seen.add(id)
  }
  return seen
}

const nodeIds = dup(project.processNodes.map((n) => n.id), 'processNode')
const moduleIds = dup(project.modules.map((m) => m.id), 'module')
const pageIds = dup(project.pages.map((p) => p.id), 'page')
dup(project.edges.map((e) => e.id), 'edge')

for (const page of project.pages) {
  if (!nodeIds.has(page.processNodeId)) errors.push(`page ${page.id} 引用了不存在的流程节点 ${page.processNodeId}`)
  const stateIds = dup(page.states.map((s) => s.id), `page ${page.id} state`)
  for (const state of page.states) {
    if (!existsSync(resolve(root, 'public', state.image))) errors.push(`page ${page.id}/${state.id} 图片不存在: ${state.image}`)
  }
  for (const inst of page.moduleInstances) {
    if (!moduleIds.has(inst.moduleId)) errors.push(`page ${page.id} 引用了不存在的模块 ${inst.moduleId}`)
    for (const [sid, hz] of Object.entries(inst.hotzones)) {
      if (!stateIds.has(sid)) errors.push(`page ${page.id} 模块 ${inst.moduleId} 热区引用了不存在的状态 ${sid}`)
      for (const k of ['x', 'y', 'w', 'h']) {
        if (typeof hz[k] !== 'number') errors.push(`page ${page.id} 模块 ${inst.moduleId} 热区缺少 ${k}`)
      }
      if (hz.x < 0 || hz.y < 0 || hz.x + hz.w > 100 || hz.y + hz.h > 100) {
        errors.push(`page ${page.id} 模块 ${inst.moduleId} 状态 ${sid} 热区越界`)
      }
    }
  }
}

const validTypes = new Set(['main', 'branch', 'error', 'back'])
for (const edge of project.edges) {
  for (const end of ['from', 'to']) {
    const ep = edge[end]
    if (!pageIds.has(ep.pageId)) errors.push(`edge ${edge.id} ${end} 引用了不存在的页面 ${ep.pageId}`)
    if (ep.stateId) {
      const page = project.pages.find((p) => p.id === ep.pageId)
      if (page && !page.states.some((s) => s.id === ep.stateId)) errors.push(`edge ${edge.id} ${end} 引用了不存在的状态 ${ep.pageId}/${ep.stateId}`)
    }
  }
  if (!validTypes.has(edge.type)) errors.push(`edge ${edge.id} 类型非法: ${edge.type}`)
  if (!edge.event) errors.push(`edge ${edge.id} 缺少触发事件`)
}

// 质量门禁（警告）：多状态模块的实例若在该页没有任何状态标注，
// 说明它永远无法联动到其他状态——大概率是把形态不同的组件误判成了同一模块，或漏了标注
const warnings = []
for (const page of project.pages) {
  for (const inst of page.moduleInstances) {
    const mod = project.modules.find((m) => m.id === inst.moduleId)
    if (!mod || mod.states.length <= 1) continue
    const annotated = page.states.some((s) => s.moduleStates && s.moduleStates[inst.moduleId])
    if (!annotated) {
      warnings.push(`page ${page.id} 的模块 ${inst.moduleId}（${mod.states.length} 态）无任何页面状态标注：确认是否同一组件，或补 moduleStates`)
    }
  }
}
if (warnings.length) {
  console.warn(`⚠ 模块同一性警告（${warnings.length} 处）:`)
  for (const w of warnings) console.warn('  - ' + w)
}

if (errors.length) {
  console.error(`✗ 校验失败（${errors.length} 处）:`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}
console.log(`✓ 数据校验通过：${project.processNodes.length} 个流程节点 / ${project.pages.length} 个页面 / ${project.modules.length} 个模块 / ${project.edges.length} 条连线`)
