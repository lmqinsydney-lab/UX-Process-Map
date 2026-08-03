import raw from './project.json'
import type { FlowEdgeData, ModuleDef, Page, ProcessNode, Project } from '../types/model'

export const project = raw as unknown as Project

export function getPage(id: string): Page {
  const page = project.pages.find((p) => p.id === id)
  if (!page) throw new Error(`unknown page: ${id}`)
  return page
}

export function getModule(id: string): ModuleDef {
  const mod = project.modules.find((m) => m.id === id)
  if (!mod) throw new Error(`unknown module: ${id}`)
  return mod
}

export function getEdge(id: string): FlowEdgeData | undefined {
  return project.edges.find((e) => e.id === id)
}

export function getProcessNode(id: string): ProcessNode {
  const node = project.processNodes.find((n) => n.id === id)
  if (!node) throw new Error(`unknown process node: ${id}`)
  return node
}

/** 引用了某模块的所有页面（模块复用索引） */
export function pagesWithModule(moduleId: string): Page[] {
  return project.pages.filter((p) => p.moduleInstances.some((i) => i.moduleId === moduleId))
}

/** 页面内部的状态间流转边（在状态展开托盘里渲染） */
export function stateEdgesOf(pageId: string): FlowEdgeData[] {
  return project.edges.filter(
    (e) =>
      e.from.pageId === pageId &&
      e.to.pageId === pageId &&
      !!e.from.stateId &&
      !!e.to.stateId &&
      e.from.stateId !== e.to.stateId,
  )
}

/** 画布层面的页面间边（含页面级自环，如支付失败停留当前页） */
export function canvasEdges(): FlowEdgeData[] {
  return project.edges.filter((e) => !(e.from.pageId === e.to.pageId && e.from.stateId && e.to.stateId))
}

export function endpointLabel(ep: { pageId: string; stateId?: string }): string {
  const page = getPage(ep.pageId)
  if (!ep.stateId) return page.name
  const state = page.states.find((s) => s.id === ep.stateId)
  return state ? `${page.name} · ${state.name}` : page.name
}
