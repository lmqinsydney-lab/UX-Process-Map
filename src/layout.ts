import type { Edge, Node } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import { canvasEdges, endpointLabel, project, stateEdgesOf } from './data/loader'
import type { EdgeType } from './types/model'

export const CARD_W = 190
export const CARD_H = 422
const GROUP_PAD_X = 24
const GROUP_PAD_TOP = 58
const GROUP_PAD_BOTTOM = 30
const CARD_GAP = 132
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

/** 顶部泳道基准高度与间距（画布坐标，负值在分组上方） */
export const LANE_BASE = 84
export const LANE_PITCH = 36

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

  /**
   * 泳道分配（按跨度嵌套排层）：窄跨度连线走低泳道，宽跨度连线走高泳道。
   * 这样升降段只需爬到自己的泳道，不会穿过外层连线的水平段，长线之间零交叉。
   */
  const assignLanes = (items: { id: string; start: number; end: number }[], margin: number) => {
    const laneIntervals: { start: number; end: number }[][] = []
    const out: Record<string, number> = {}
    for (const it of [...items].sort((a, b) => a.end - a.start - (b.end - b.start))) {
      let lane = laneIntervals.findIndex((ivs) => ivs.every((v) => v.end + margin <= it.start || it.end + margin <= v.start))
      if (lane === -1) {
        lane = laneIntervals.length
        laneIntervals.push([])
      }
      laneIntervals[lane].push({ start: it.start, end: it.end })
      out[it.id] = lane
    }
    return out
  }

  const longEdges = all.filter((e) => kindOf(e) === 'long')
  const longLanes = assignLanes(
    longEdges.map((e) => ({ id: e.id, start: pagePos.get(e.from.pageId)!.right, end: pagePos.get(e.to.pageId)!.left })),
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

  // 同源/同目标的升降段错位：泳道越高的线，升段越靠左 / 降段越靠右，
  // 避免爬向高泳道时穿过同组低泳道线的水平段
  const srcShifts: Record<string, number> = {}
  const tgtShifts: Record<string, number> = {}
  const byKey = (key: (e: (typeof all)[number]) => string, shifts: Record<string, number>) => {
    const groups = new Map<string, typeof longEdges>()
    for (const e of longEdges) {
      const k = key(e)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(e)
    }
    for (const group of groups.values()) {
      group.sort((a, b) => longLanes[b.id] - longLanes[a.id])
      group.forEach((e, i) => (shifts[e.id] = i * 10))
    }
  }
  byKey((e) => e.from.pageId, srcShifts)
  byKey((e) => e.to.pageId, tgtShifts)

  // 无法靠排层消除的交叉（升降段穿过更低泳道的水平段）→ 记录交叉点，渲染成跨线桥
  const geo = new Map(
    longEdges.map((e) => [
      e.id,
      {
        upX: pagePos.get(e.from.pageId)!.right + 8 + srcShifts[e.id],
        downX: pagePos.get(e.to.pageId)!.left - 8 - tgtShifts[e.id],
        laneY: -(LANE_BASE + longLanes[e.id] * LANE_PITCH),
      },
    ]),
  )
  const hopsAt = (x: number, laneY: number) =>
    longEdges
      .filter((b) => {
        const g = geo.get(b.id)!
        return g.laneY > laneY && g.upX + 6 < x && x < g.downX - 6
      })
      .map((b) => geo.get(b.id)!.laneY)

  const edges: Edge[] = all.map((e) => {
    const kind = kindOf(e)
    const srcShift = kind === 'long' ? srcShifts[e.id] : 0
    const tgtShift = kind === 'long' ? tgtShifts[e.id] : 0
    const g = kind === 'long' ? geo.get(e.id)! : null
    return {
      id: e.id,
      source: e.from.pageId,
      target: e.to.pageId,
      type: 'flow',
      zIndex: 0,
      sourceHandle: kind === 'loop' ? 'ts' : kind === 'back' ? 'bs' : 'r',
      targetHandle: kind === 'loop' ? 'tt' : kind === 'back' ? 'bt' : 'l',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: EDGE_COLOR[e.type] },
      data: {
        edge: e,
        kind,
        lane: kind === 'long' ? longLanes[e.id] : kind === 'back' ? backLanes[e.id] : 0,
        srcShift,
        tgtShift,
        upHops: g ? hopsAt(g.upX, g.laneY) : [],
        downHops: g ? hopsAt(g.downX, g.laneY) : [],
        open: openEdgeId === e.id,
        fromLabel: endpointLabel(e.from),
        toLabel: endpointLabel(e.to),
        onOpenEdge: cb.onOpenEdge,
      },
    }
  })

  return { nodes, edges }
}
