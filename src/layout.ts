import type { Edge, Node } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import { canvasEdges, endpointLabel, project, stateEdgesOf } from './data/loader'
import type { Decision, Page } from './types/model'
import type { EdgeType } from './types/model'

export const CARD_W = 190
export const CARD_H = 422
/** 判断节点（菱形小卡）尺寸 */
export const DEC_W = 150
export const DEC_H = 96
const GROUP_PAD_X = 24
const GROUP_PAD_TOP = 58
const GROUP_PAD_BOTTOM = 30
const CARD_GAP = 132
const NARROW_GAP = 36
const GROUP_GAP = 160

export const EDGE_COLOR: Record<EdgeType, string> = {
  main: '#4f46e5',
  branch: '#818cf8',
  error: '#ef4444',
  back: '#9aa1ab',
}

/** 聚焦态：画布内缩放推近页面节点，右侧停靠详情面板；moduleId = 当前选中/展开的模块 */
export interface FocusState {
  pageId: string
  stateId: string
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
  /** 双击带点击事件的模块热区 → 沿 clickEdgeId 定位到目标页面 */
  onJumpEdge: (edgeId: string) => void
  /** 点击状态托盘中的状态卡片 → 聚焦到该页面的该状态 */
  onPickState: (pageId: string, stateId: string) => void
}

export function buildGraph(
  expanded: Set<string>,
  openEdgeId: string | null,
  focus: FocusState | null,
  hoverModuleId: string | null,
  cb: GraphCallbacks,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const pagePos = new Map<string, { left: number; right: number }>()
  const groupPos = new Map<string, { left: number; right: number }>()
  let cursorX = 0

  // 相邻页面之间存在流转边才需要给连线留宽间距，否则用窄间距
  const hasEdgeBetween = (a: string, b: string) =>
    project.edges.some(
      (e) => (e.from.pageId === a && e.to.pageId === b) || (e.from.pageId === b && e.to.pageId === a),
    )

  for (const pn of project.processNodes) {
    const pages = project.pages.filter((p) => p.processNodeId === pn.id)
    const decisions = (project.decisions ?? []).filter((d) => d.processNodeId === pn.id)
    // 页面与判断节点按 seq 混排（无 seq 时保持页面在前的原顺序）
    type Ent = { kind: 'page'; page: Page; seq: number } | { kind: 'decision'; dec: Decision; seq: number }
    const ents: Ent[] = [
      ...pages.map((page, i) => ({ kind: 'page' as const, page, seq: page.seq ?? i })),
      ...decisions.map((dec, i) => ({ kind: 'decision' as const, dec, seq: dec.seq ?? pages.length + i })),
    ].sort((a, b) => a.seq - b.seq)

    const height = GROUP_PAD_TOP + CARD_H + GROUP_PAD_BOTTOM
    let innerX = GROUP_PAD_X
    const xs: number[] = []
    ents.forEach((ent, i) => {
      if (i > 0) {
        const prevId = ents[i - 1].kind === 'page' ? (ents[i - 1] as { page: Page }).page.id : (ents[i - 1] as { dec: Decision }).dec.id
        const curId = ent.kind === 'page' ? ent.page.id : ent.dec.id
        innerX += hasEdgeBetween(prevId, curId) ? CARD_GAP : NARROW_GAP
      }
      xs.push(innerX)
      innerX += ent.kind === 'page' ? CARD_W : DEC_W
    })
    const width = innerX + GROUP_PAD_X
    groupPos.set(pn.id, { left: cursorX, right: cursorX + width })

    nodes.push({
      id: `g:${pn.id}`,
      type: 'processGroup',
      position: { x: cursorX, y: 0 },
      width,
      height,
      data: { node: pn, width, height },
      draggable: false,
      selectable: false,
      // 分组底板置于连线之下，避免遮住从组内页面伸出的连线段
      zIndex: -1,
    })

    ents.forEach((ent, i) => {
      if (ent.kind === 'decision') {
        const left = cursorX + xs[i]
        pagePos.set(ent.dec.id, { left, right: left + DEC_W })
        nodes.push({
          id: ent.dec.id,
          type: 'decisionNode',
          parentId: `g:${pn.id}`,
          position: { x: xs[i], y: GROUP_PAD_TOP + (CARD_H - DEC_H) / 2 },
          width: DEC_W,
          height: DEC_H,
          data: {
            decision: ent.dec,
            branches: project.edges
              .filter((e) => e.from.pageId === ent.dec.id)
              .map((e) => ({ label: e.event, condition: e.condition, toLabel: endpointLabel(e.to), type: e.type })),
            open: openEdgeId === `dec:${ent.dec.id}`,
            onOpenEdge: cb.onOpenEdge,
          },
          draggable: false,
          selectable: false,
          zIndex: 1,
        })
        return
      }
      const page = ent.page
      const left = cursorX + xs[i]
      pagePos.set(page.id, { left, right: left + CARD_W })
      nodes.push({
        id: page.id,
        type: 'pageCard',
        parentId: `g:${pn.id}`,
        position: { x: xs[i], y: GROUP_PAD_TOP },
        width: CARD_W,
        height: CARD_H,
        data: {
          page,
          expanded: expanded.has(page.id),
          stateEdges: stateEdgesOf(page.id),
          focusStateId: focus?.pageId === page.id ? focus.stateId : null,
          focusModuleId: focus?.pageId === page.id ? focus.moduleId : null,
          focusHoverModuleId: focus?.pageId === page.id ? hoverModuleId : null,
          isFocused: focus?.pageId === page.id,
          onToggle: cb.onToggleExpand,
          onSelectModule: cb.onSelectModule,
          onJumpEdge: cb.onJumpEdge,
          onPickState: cb.onPickState,
        },
        draggable: false,
        selectable: false,
        zIndex: focus?.pageId === page.id ? 1200 : expanded.has(page.id) ? 1000 : 1,
      })
    })

    cursorX += width + GROUP_GAP
  }

  const all = canvasEdges()
  const pageGroup = new Map<string, string>([
    ...project.pages.map((p) => [p.id, p.processNodeId] as [string, string]),
    ...(project.decisions ?? []).map((d) => [d.id, d.processNodeId] as [string, string]),
  ])
  /** 流程内页面级连线；跨流程连线聚合为分组级单箭头 */
  const intra = all.filter((e) => pageGroup.get(e.from.pageId) === pageGroup.get(e.to.pageId))
  const cross = all.filter((e) => pageGroup.get(e.from.pageId) !== pageGroup.get(e.to.pageId))

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

  // ---------- 跨流程连线聚合为分组级单箭头 ----------
  interface Agg {
    id: string
    fromG: string
    toG: string
    members: typeof cross
    kind: 'gshort' | 'glong' | 'gback'
  }
  const aggMap = new Map<string, Agg>()
  for (const e of cross) {
    const fromG = pageGroup.get(e.from.pageId)!
    const toG = pageGroup.get(e.to.pageId)!
    const id = `agg:${fromG}->${toG}`
    if (!aggMap.has(id)) {
      const gap = groupPos.get(toG)!.left - groupPos.get(fromG)!.right
      // 目标流程在源流程左侧 → 反向聚合边，沿分组下方回勾
      aggMap.set(id, { id, fromG, toG, members: [], kind: gap < 0 ? 'gback' : gap > 260 ? 'glong' : 'gshort' })
    }
    aggMap.get(id)!.members.push(e)
  }
  const aggs = [...aggMap.values()]

  const longEdges = intra.filter((e) => kindOf(e) === 'long')
  const longLanes = assignLanes(
    [
      ...longEdges.map((e) => ({ id: e.id, start: pagePos.get(e.from.pageId)!.right, end: pagePos.get(e.to.pageId)!.left })),
      ...aggs
        .filter((a) => a.kind === 'glong')
        .map((a) => ({ id: a.id, start: groupPos.get(a.fromG)!.right, end: groupPos.get(a.toG)!.left })),
    ],
    40,
  )
  const backLanes = assignLanes(
    [
      ...intra
        .filter((e) => kindOf(e) === 'back')
        .map((e) => {
          const a = pagePos.get(e.from.pageId)!
          const b = pagePos.get(e.to.pageId)!
          return { id: e.id, start: Math.min(a.left, b.left), end: Math.max(a.right, b.right) }
        }),
      ...aggs
        .filter((a) => a.kind === 'gback')
        .map((a) => {
          const f = groupPos.get(a.fromG)!
          const t = groupPos.get(a.toG)!
          return { id: a.id, start: Math.min(f.left, t.left), end: Math.max(f.right, t.right) }
        }),
    ],
    40,
  )

  // 同源/同目标的升降段错位：泳道越高的线，升段越靠左 / 降段越靠右
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

  // 分组多进/多出时，箭头在分组边缘做垂直错位
  const aggSrcY: Record<string, number> = {}
  const aggTgtY: Record<string, number> = {}
  const spread = (lists: Map<string, Agg[]>, out: Record<string, number>) => {
    for (const list of lists.values()) list.forEach((a, i) => (out[a.id] = (i - (list.length - 1) / 2) * 30))
  }
  const outByG = new Map<string, Agg[]>()
  const inByG = new Map<string, Agg[]>()
  for (const a of aggs) {
    if (!outByG.has(a.fromG)) outByG.set(a.fromG, [])
    outByG.get(a.fromG)!.push(a)
    if (!inByG.has(a.toG)) inByG.set(a.toG, [])
    inByG.get(a.toG)!.push(a)
  }
  spread(outByG, aggSrcY)
  spread(inByG, aggTgtY)

  // 无法靠排层消除的交叉（升降段穿过更低泳道的水平段）→ 记录交叉点，渲染成跨线桥
  const geo = new Map<string, { upX: number; downX: number; laneY: number }>()
  for (const e of longEdges) {
    geo.set(e.id, {
      upX: pagePos.get(e.from.pageId)!.right + 8 + srcShifts[e.id],
      downX: pagePos.get(e.to.pageId)!.left - 8 - tgtShifts[e.id],
      laneY: -(LANE_BASE + longLanes[e.id] * LANE_PITCH),
    })
  }
  for (const a of aggs) {
    if (a.kind !== 'glong') continue
    geo.set(a.id, {
      upX: groupPos.get(a.fromG)!.right + 8,
      downX: groupPos.get(a.toG)!.left - 8,
      laneY: -(LANE_BASE + longLanes[a.id] * LANE_PITCH),
    })
  }
  const geoList = [...geo.values()]
  const hopsAt = (x: number, laneY: number) =>
    geoList.filter((g) => g.laneY > laneY && g.upX + 6 < x && x < g.downX - 6).map((g) => g.laneY)

  const toItem = (e: (typeof all)[number]) => ({
    fromLabel: endpointLabel(e.from),
    toLabel: endpointLabel(e.to),
    event: e.event,
    condition: e.condition,
    type: e.type,
  })
  const marker = (t: EdgeType) => ({ type: MarkerType.ArrowClosed, width: 18, height: 18, color: EDGE_COLOR[t] })
  const typeRank: EdgeType[] = ['main', 'branch', 'error', 'back']

  const edges: Edge[] = [
    ...intra.map((e) => {
      const kind = kindOf(e)
      const g = kind === 'long' ? geo.get(e.id)! : null
      return {
        id: e.id,
        source: e.from.pageId,
        target: e.to.pageId,
        type: 'flow',
        zIndex: 0,
        sourceHandle: kind === 'loop' ? 'ts' : kind === 'back' ? 'bs' : 'r',
        targetHandle: kind === 'loop' ? 'tt' : kind === 'back' ? 'bt' : 'l',
        markerEnd: marker(e.type),
        data: {
          kind,
          lane: kind === 'long' ? longLanes[e.id] : kind === 'back' ? backLanes[e.id] : 0,
          srcShift: kind === 'long' ? srcShifts[e.id] : 0,
          tgtShift: kind === 'long' ? tgtShifts[e.id] : 0,
          srcYOff: 0,
          tgtYOff: 0,
          upHops: g ? hopsAt(g.upX, g.laneY) : [],
          downHops: g ? hopsAt(g.downX, g.laneY) : [],
          open: openEdgeId === e.id,
          label: e.event,
          typeKey: e.type,
          items: [toItem(e)],
          onOpenEdge: cb.onOpenEdge,
        },
      }
    }),
    ...aggs.map((a) => {
      const typeKey = typeRank.find((t) => a.members.some((m) => m.type === t))!
      const events = [...new Set(a.members.map((m) => m.event))]
      const label =
        events.length === 1
          ? a.members.length > 1
            ? `${events[0]} ×${a.members.length}`
            : events[0]
          : `${a.members.length} 条流转`
      const g = a.kind === 'glong' ? geo.get(a.id)! : null
      return {
        id: a.id,
        source: `g:${a.fromG}`,
        target: `g:${a.toG}`,
        type: 'flow',
        zIndex: 0,
        sourceHandle: a.kind === 'gback' ? 'gbs' : 'gr',
        targetHandle: a.kind === 'gback' ? 'gbt' : 'gl',
        markerEnd: marker(typeKey),
        data: {
          kind: a.kind,
          lane: a.kind === 'glong' ? longLanes[a.id] : a.kind === 'gback' ? backLanes[a.id] : 0,
          srcShift: 0,
          tgtShift: 0,
          srcYOff: aggSrcY[a.id] ?? 0,
          tgtYOff: aggTgtY[a.id] ?? 0,
          upHops: g ? hopsAt(g.upX, g.laneY) : [],
          downHops: g ? hopsAt(g.downX, g.laneY) : [],
          open: openEdgeId === a.id,
          label,
          typeKey,
          items: a.members.map(toItem),
          onOpenEdge: cb.onOpenEdge,
        },
      }
    }),
  ]

  return { nodes, edges }
}
