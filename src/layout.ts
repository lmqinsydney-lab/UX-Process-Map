import type { Edge, Node } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import { canvasEdges, endpointLabel, project, stateEdgesOf } from './data/loader'
import type { EdgeType } from './types/model'

export const CARD_W = 190
export const CARD_H = 422
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
export const FOCUS_CARD_H = 462
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
  const pagePos = new Map<string, { left: number; right: number }>()
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
      const left = cursorX + GROUP_PAD_X + i * (CARD_W + CARD_GAP)
      pagePos.set(page.id, { left, right: left + CARD_W })
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

  const all = canvasEdges()

  const kindOf = (e: (typeof all)[number]): 'loop' | 'back' | 'long' | 'short' => {
    if (e.from.pageId === e.to.pageId) return 'loop'
    if (e.type === 'back') return 'back'
    const gap = pagePos.get(e.to.pageId)!.left - pagePos.get(e.from.pageId)!.right
    return gap > 220 ? 'long' : 'short'
  }

  /** 区间图着色：水平区间重叠的连线分配到不同泳道，互不交叠 */
  const assignLanes = (items: { id: string; start: number; end: number }[], margin: number) => {
    const laneEnds: number[] = []
    const out: Record<string, number> = {}
    for (const it of [...items].sort((a, b) => a.start - b.start)) {
      let lane = laneEnds.findIndex((end) => end + margin <= it.start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(it.end)
      } else {
        laneEnds[lane] = it.end
      }
      out[it.id] = lane
    }
    return out
  }

  const longLanes = assignLanes(
    all
      .filter((e) => kindOf(e) === 'long')
      .map((e) => ({ id: e.id, start: pagePos.get(e.from.pageId)!.right, end: pagePos.get(e.to.pageId)!.left })),
    40,
  )
  const backLanes = assignLanes(
    all
      .filter((e) => kindOf(e) === 'back')
      .map((e) => {
        const a = pagePos.get(e.from.pageId)!
        const b = pagePos.get(e.to.pageId)!
        return { id: e.id, start: Math.min(a.left, b.left), end: Math.max(a.right, b.right) }
      }),
    40,
  )

  const srcSeen = new Map<string, number>()
  const tgtSeen = new Map<string, number>()
  const edges: Edge[] = all.map((e) => {
    const kind = kindOf(e)
    let srcShift = 0
    let tgtShift = 0
    if (kind === 'long') {
      srcShift = (srcSeen.get(e.from.pageId) ?? 0) * 10
      srcSeen.set(e.from.pageId, (srcSeen.get(e.from.pageId) ?? 0) + 1)
      tgtShift = (tgtSeen.get(e.to.pageId) ?? 0) * 10
      tgtSeen.set(e.to.pageId, (tgtSeen.get(e.to.pageId) ?? 0) + 1)
    }
    return {
      id: e.id,
      source: e.from.pageId,
      target: e.to.pageId,
      type: 'flow',
      sourceHandle: kind === 'loop' ? 'ts' : kind === 'back' ? 'bs' : 'r',
      targetHandle: kind === 'loop' ? 'tt' : kind === 'back' ? 'bt' : 'l',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: EDGE_COLOR[e.type] },
      data: {
        edge: e,
        kind,
        lane: kind === 'long' ? longLanes[e.id] : kind === 'back' ? backLanes[e.id] : 0,
        srcShift,
        tgtShift,
        open: openEdgeId === e.id,
        fromLabel: endpointLabel(e.from),
        toLabel: endpointLabel(e.to),
        onOpenEdge: cb.onOpenEdge,
      },
    }
  })

  return { nodes, edges }
}
