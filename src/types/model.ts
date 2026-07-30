export interface ProcessNode {
  id: string
  name: string
  note?: string
}

export interface ModuleState {
  id: string
  name: string
  note?: string
}

export interface ModuleDef {
  id: string
  name: string
  desc: string
  states: ModuleState[]
}

export interface Hotzone {
  /** 相对截图的百分比坐标 0-100 */
  x: number
  y: number
  w: number
  h: number
}

export interface ModuleInstance {
  moduleId: string
  instanceNote?: string
  /** key = 页面状态 id；某状态无此模块则不配 */
  hotzones: Record<string, Hotzone>
}

export interface PageState {
  id: string
  name: string
  image: string
  note?: string
}

export interface OnlineRef {
  name: string
  url: string
}

export interface Page {
  id: string
  processNodeId: string
  name: string
  desc?: string
  onlineRefs?: OnlineRef[]
  states: PageState[]
  moduleInstances: ModuleInstance[]
}

export type EdgeType = 'main' | 'branch' | 'error' | 'back'

export interface EdgeEndpoint {
  pageId: string
  stateId?: string
}

export interface FlowEdgeData {
  id: string
  from: EdgeEndpoint
  to: EdgeEndpoint
  event: string
  condition?: string
  type: EdgeType
}

export interface Project {
  project: { name: string; version: string }
  processNodes: ProcessNode[]
  modules: ModuleDef[]
  pages: Page[]
  edges: FlowEdgeData[]
}

export const EDGE_TYPE_NAME: Record<EdgeType, string> = {
  main: '主流程',
  branch: '分支',
  error: '异常',
  back: '反向',
}
