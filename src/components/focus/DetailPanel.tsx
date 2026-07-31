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
  inst,
  inState,
  expanded,
  onToggle,
  onJump,
}: {
  page: Page
  inst: ModuleInstance
  inState: boolean
  expanded: boolean
  onToggle: () => void
  onJump: Props['onJump']
}) {
  const mod = getModule(inst.moduleId)
  const [modState, setModState] = useState(mod.states[0]?.id)
  const [editOpen, setEditOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = mod.states.find((s) => s.id === modState)
  const usedIn = pagesWithModule(inst.moduleId)

  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [expanded])

  return (
    <div ref={ref} className={`module-card${expanded ? ' open' : ''}${inState ? '' : ' ghost'}`}>
      <button className="mc-head" onClick={onToggle} title={inState ? undefined : '当前页面状态下不存在'}>
        <span className="mc-name">{mod.name}</span>
        <span className="mc-states">
          {mod.states.map((s) => (
            <span key={s.id} className="mc-state-tag">
              {s.name}
            </span>
          ))}
        </span>
        <span className="mc-chev">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="mc-body">
          <div className="mc-toolbar">
            {mod.states.length > 1 ? (
              <div className="tabs">
                {mod.states.map((s) => (
                  <button key={s.id} className={`tab${s.id === modState ? ' on' : ''}`} onClick={() => setModState(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            ) : (
              <span />
            )}
            <button className="edit-btn" onClick={() => setEditOpen(!editOpen)} title="对话编辑（Demo 占位）">
              ✎ 编辑
            </button>
          </div>
          {editOpen && <ChatEditStub placeholder={`试试：把「${mod.name}」的说明改成…`} />}
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
                inst={inst}
                inState={!!inst.hotzones[stateId]}
                expanded={inst.moduleId === moduleId}
                onToggle={() => onSelectModule(inst.moduleId === moduleId ? null : inst.moduleId)}
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
