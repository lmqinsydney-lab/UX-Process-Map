import { useEffect, useRef, useState } from 'react'
import { getModule, getProcessNode, pagesWithModule } from '../../data/loader'
import type { ModuleInstance, Page } from '../../types/model'
import ChatEditStub from './ChatEditStub'

interface Props {
  page: Page
  stateId: string
  moduleId: string | null
  onState: (stateId: string) => void
  onSelectModule: (moduleId: string | null) => void
  onJump: (pageId: string, moduleId: string) => void
}

/** 模块手风琴卡片：收起展示名称+状态标签，展开直接露出模块详情 */
function ModuleCard({
  page,
  stateId,
  inst,
  inState,
  expanded,
  onToggle,
  onState,
  onJump,
}: {
  page: Page
  stateId: string
  inst: ModuleInstance
  inState: boolean
  expanded: boolean
  onToggle: () => void
  onState: Props['onState']
  onJump: Props['onJump']
}) {
  const mod = getModule(inst.moduleId)
  const [localState, setLocalState] = useState(mod.states[0]?.id)
  const [editOpen, setEditOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const usedIn = pagesWithModule(inst.moduleId)

  // 当前页面状态若标注了本模块的状态，则以页面状态为准（联动）；否则用本地选择
  const pageState = page.states.find((s) => s.id === stateId)
  const controlled = pageState?.moduleStates?.[inst.moduleId]
  const modState = controlled ?? localState
  const current = mod.states.find((s) => s.id === modState)

  /** 切模块状态：找到匹配该模块状态、且其余维度与当前页面状态最接近的页面状态，联动切换左侧截图 */
  const pickModState = (sid: string) => {
    setLocalState(sid)
    const candidates = page.states.filter((s) => s.moduleStates?.[inst.moduleId] === sid)
    if (candidates.length === 0) return
    const cur = pageState?.moduleStates ?? {}
    const best = candidates
      .map((c) => ({
        c,
        score: Object.entries(c.moduleStates ?? {}).filter(([k, v]) => k !== inst.moduleId && cur[k] === v).length,
      }))
      .sort((a, b) => b.score - a.score)[0].c
    if (best.id !== stateId) onState(best.id)
  }

  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [expanded])

  return (
    <div ref={ref} className={`module-card${expanded ? ' open' : ''}${inState ? '' : ' ghost'}`}>
      <div
        className="mc-head"
        onClick={inState ? onToggle : undefined}
        title={inState ? undefined : inst.visibleWhen ?? '当前页面状态下不展示'}
      >
        <span className="mc-name">{mod.name}</span>
        <span className="mc-spacer" />
        {inState && (
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation()
              setEditOpen(!editOpen)
            }}
            title="对话编辑（Demo 占位）"
          >
            ✎ 编辑
          </button>
        )}
        <span className="mc-chev">{expanded ? '▾' : '▸'}</span>
      </div>
      {(!inState || mod.states.length > 1) && (
        <div className="mc-tabs">
          {inState ? (
            <div className="tabs">
              {mod.states.map((s) => (
                <button key={s.id} className={`tab${s.id === modState ? ' on' : ''}`} onClick={() => pickModState(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="mc-cond">{inst.visibleWhen ?? '当前状态不展示'}</span>
          )}
        </div>
      )}
      {editOpen && inState && (
        <div className="mc-stub">
          <ChatEditStub placeholder={`试试：把「${mod.name}」的说明改成…`} />
        </div>
      )}
      {expanded && (
        <div className="mc-body">
          {inst.visibleWhen && <p className="mc-cond-line">展示条件：{inst.visibleWhen}</p>}
          {current?.note && <p className="state-note">{current.note}</p>}
          <h3>模块说明</h3>
          <p>{mod.desc}</p>
          {inst.instanceNote && <p className="inst-note">本页实例：{inst.instanceNote}</p>}
          <h3>出现在哪些页面</h3>
          <div className="chips">
            {usedIn.map((p) => (
              <button
                key={p.id}
                className={`chip${p.id === page.id ? ' current' : ''}`}
                disabled={p.id === page.id}
                onClick={() => onJump(p.id, inst.moduleId)}
              >
                {p.name}
                {p.id === page.id ? '（当前）' : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DetailPanel({ page, stateId, moduleId, onState, onSelectModule, onJump }: Props) {
  const processNode = getProcessNode(page.processNodeId)
  const [editOpen, setEditOpen] = useState(false)

  return (
    <aside className="panel">
      <div className="panel-inner" key={page.id}>
        <div className="panel-head">
          <div>
            <div className="crumb-sm">{processNode.name}</div>
            <h2>{page.name}</h2>
          </div>
          <button className="edit-btn" onClick={() => setEditOpen(!editOpen)} title="对话编辑（Demo 占位）">
            ✎ 编辑
          </button>
        </div>
        {editOpen && <ChatEditStub placeholder={`试试：把「${page.name}」的页面说明改成…`} />}
        <div className="tabs">
          {page.states.map((s) => (
            <button key={s.id} className={`tab${s.id === stateId ? ' on' : ''}`} onClick={() => onState(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <section>
          <h3>模块构成</h3>
          <div className="module-cards">
            {page.moduleInstances.map((inst) => (
              <ModuleCard
                key={inst.moduleId}
                page={page}
                stateId={stateId}
                inst={inst}
                inState={!!inst.hotzones[stateId]}
                expanded={inst.moduleId === moduleId}
                onToggle={() => onSelectModule(inst.moduleId === moduleId ? null : inst.moduleId)}
                onState={onState}
                onJump={onJump}
              />
            ))}
          </div>
        </section>
        {page.desc && (
          <section>
            <h3>页面说明</h3>
            <p>{page.desc}</p>
          </section>
        )}
        {page.onlineRefs && page.onlineRefs.length > 0 && (
          <section>
            <h3>线上已有页面</h3>
            {page.onlineRefs.map((r) => (
              <a key={r.name} className="online-ref" href={r.url} onClick={(e) => e.preventDefault()}>
                ↗ {r.name}
              </a>
            ))}
          </section>
        )}
      </div>
    </aside>
  )
}
