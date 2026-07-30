import type { Edge, Node } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import { canvasEdges, endpointLabel, project, stateEdgesOf } from './data/loader'
import type { EdgeType } from './types/model'

export const CARD_W = 190
export const CARD_H = 358
const GROUP_PAD_X = 24
const GROUP_PAD_TOP = 58
const GROUP_PAD_BOTTOM = 30
const CARD_GAP = 24
const GROUP_GAP = 160

export const EDGE_COLOR: Record<EdgeType, string> = {
  main: '#4f46e5',
  branch: '#818cf8',
  error: '#ef4444',
  back: '#9aa1ab',
}

/** 聚焦态：画布内缩放推近页面节点，右侧停靠详情面板 */
export interface FocusState {
  pageId: string
  stateId: string
  view: 'page' | 'module'
  moduleId: string | null
}

/** 聚焦时页面卡片展开完整截图后的近似高度（用于视口计算） */
export const FOCUS_CARD_H = 452
export const PANEL_W = 380

export interface GraphCallbacks {
  onOpenPage: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onOpenEdge: (edgeId: string | null) => void
  onSelectModule: (moduleId: string | null) => void
}

export function buildGraph(
  expanded: Set<string>,
  openEdgeId: string | null,
  focus: FocusState | null,
  cb: GraphCallbacks,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  let cursorX = 0

  for (const pn of project.processNodes) {
    const pages = project.pages.filter((p) => p.processNodeId === pn.id)
    const width = GROUP_PAD_X * 2 + pages.length * CARD_W + (pages.length - 1) * CARD_GAP
    const height = GROUP_PAD_TOP + CARD_H + GROUP_PAD_BOTTOM

    nodes.push({
      id: `g:${pn.id}`,
      type: 'processGroup',
      position: { x: cursorX, y: 0 },
      width,
      height,
      data: { node: pn, width, height },
      draggable: false,
      selectable: false,
      zIndex: 0,
    })

    pages.forEach((page, i) => {
      nodes.push({
        id: page.id,
        type: 'pageCard',
        parentId: `g:${pn.id}`,
        position: { x: GROUP_PAD_X + i * (CARD_W + CARD_GAP), y: GROUP_PAD_TOP },
        width: CARD_W,
        height: CARD_H,
        data: {
          page,
          expanded: expanded.has(page.id),
          stateEdges: stateEdgesOf(page.id),
          focusStateId: focus?.pageId === page.id ? focus.stateId : null,
          focusModuleId: focus?.pageId === page.id ? focus.moduleId : null,
          isFocused: focus?.pageId === page.id,
          onToggle: cb.onToggleExpand,
          onSelectModule: cb.onSelectModule,
        },
        draggable: false,
        selectable: false,
        zIndex: focus?.pageId === page.id ? 1200 : expanded.has(page.id) ? 1000 : 1,
      })
    })

    cursorX += width + GROUP_GAP
  }

  const targetSeen = new Map<string, number>()
  const sourceSeen = new Map<string, number>()
  const edges: Edge[] = canvasEdges().map((e) => {
    const selfLoop = e.from.pageId === e.to.pageId
    const isBack = e.type === 'back'
    const seen = targetSeen.get(e.to.pageId) ?? 0
    targetSeen.set(e.to.pageId, seen + 1)
    const srcSeen = sourceSeen.get(e.from.pageId) ?? 0
    sourceSeen.set(e.from.pageId, srcSeen + 1)
    return {
      id: e.id,
      source: e.from.pageId,
      target: e.to.pageId,
      type: 'flow',
      sourceHandle: selfLoop ? 'ts' : isBack ? 'bs' : 'r',
      targetHandle: selfLoop ? 'tt' : isBack ? 'bt' : 'l',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: EDGE_COLOR[e.type] },
      data: {
        edge: e,
        open: openEdgeId === e.id,
        fromLabel: endpointLabel(e.from),
        toLabel: endpointLabel(e.to),
        labelShift: seen * 26,
        srcShift: srcSeen * 10,
        tgtShift: seen * 10,
        onOpenEdge: cb.onOpenEdge,
      },
    }
  })

  return { nodes, edges }
}
