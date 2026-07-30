import { useState } from 'react'
import { getModule, getProcessNode, pagesWithModule } from '../../data/loader'
import type { Page } from '../../types/model'
import ChatEditStub from './ChatEditStub'

interface Props {
  page: Page
  stateId: string
  view: 'page' | 'module'
  moduleId: string | null
  onState: (stateId: string) => void
  onSelectModule: (moduleId: string | null) => void
  onJump: (pageId: string, moduleId: string) => void
}

function ModuleView({ page, moduleId, onSelectModule, onJump }: { page: Page; moduleId: string; onSelectModule: (m: string | null) => void; onJump: Props['onJump'] }) {
  const mod = getModule(moduleId)
  const inst = page.moduleInstances.find((i) => i.moduleId === moduleId)
  const [modState, setModState] = useState(mod.states[0]?.id)
  const [editOpen, setEditOpen] = useState(false)
  const usedIn = pagesWithModule(moduleId)
  const current = mod.states.find((s) => s.id === modState)

  return (
    <div className="panel-inner" key={moduleId}>
      <button className="back-link" onClick={() => onSelectModule(null)}>
        ← 返回「{page.name}」详情
      </button>
      <div className="panel-head">
        <h2>
          {mod.name} <span className="tag">模块</span>
        </h2>
        <button className="edit-btn" onClick={() => setEditOpen(!editOpen)} title="对话编辑（Demo 占位）">
          ✎ 编辑
        </button>
      </div>
      {editOpen && <ChatEditStub placeholder={`试试：把「${mod.name}」的说明改成…`} />}
      {mod.states.length > 1 && (
        <div className="tabs">
          {mod.states.map((s) => (
            <button key={s.id} className={`tab${s.id === modState ? ' on' : ''}`} onClick={() => setModState(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      {current?.note && <p className="state-note">{current.note}</p>}
      <section>
        <h3>模块说明</h3>
        <p>{mod.desc}</p>
        {inst?.instanceNote && (
          <p className="inst-note">
            本页实例：{inst.instanceNote}
          </p>
        )}
      </section>
      <section>
        <h3>出现在哪些页面</h3>
        <div className="chips">
          {usedIn.map((p) => (
            <button
              key={p.id}
              className={`chip${p.id === page.id ? ' current' : ''}`}
              disabled={p.id === page.id}
              onClick={() => onJump(p.id, moduleId)}
            >
              {p.name}
              {p.id === page.id ? '（当前）' : ''}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function PageView({ page, stateId, moduleId, onState, onSelectModule }: Omit<Props, 'view' | 'onJump'> & { moduleId: string | null }) {
  const processNode = getProcessNode(page.processNodeId)
  const [editOpen, setEditOpen] = useState(false)

  return (
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
        <div className="module-list">
          {page.moduleInstances.map((inst) => {
            const mod = getModule(inst.moduleId)
            const inState = !!inst.hotzones[stateId]
            return (
              <button
                key={inst.moduleId}
                className={`module-row${inst.moduleId === moduleId ? ' on' : ''}${inState ? '' : ' ghost'}`}
                onClick={() => onSelectModule(inst.moduleId)}
                title={inState ? mod.desc : '当前状态下不存在'}
              >
                <span>{mod.name}</span>
                <span className="chev">›</span>
              </button>
            )
          })}
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
  )
}

export default function DetailPanel(props: Props) {
  return (
    <aside className="panel">
      {props.view === 'module' && props.moduleId ? (
        <ModuleView page={props.page} moduleId={props.moduleId} onSelectModule={props.onSelectModule} onJump={props.onJump} />
      ) : (
        <PageView page={props.page} stateId={props.stateId} moduleId={props.moduleId} onState={props.onState} onSelectModule={props.onSelectModule} />
      )}
    </aside>
  )
}
