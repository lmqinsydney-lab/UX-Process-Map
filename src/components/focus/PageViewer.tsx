import { getModule } from '../../data/loader'
import type { Page } from '../../types/model'

interface Props {
  page: Page
  stateId: string
  selectedModuleId: string | null
  onSelectModule: (moduleId: string | null) => void
}

export default function PageViewer({ page, stateId, selectedModuleId, onSelectModule }: Props) {
  const state = page.states.find((s) => s.id === stateId) ?? page.states[0]
  const zones = page.moduleInstances.filter((i) => i.hotzones[state.id])
  const selected = selectedModuleId ? zones.find((z) => z.moduleId === selectedModuleId) : undefined
  const hz = selected?.hotzones[state.id]

  return (
    <div className="viewer">
      <div className="phone">
        <img src={'/' + state.image} alt={`${page.name} · ${state.name}`} draggable={false} onClick={() => onSelectModule(null)} />
        {hz && (
          <>
            <div className="mask" style={{ left: 0, top: 0, width: '100%', height: `${hz.y}%` }} />
            <div className="mask" style={{ left: 0, top: `${hz.y}%`, width: `${hz.x}%`, height: `${hz.h}%` }} />
            <div className="mask" style={{ left: `${hz.x + hz.w}%`, top: `${hz.y}%`, width: `${100 - hz.x - hz.w}%`, height: `${hz.h}%` }} />
            <div className="mask" style={{ left: 0, top: `${hz.y + hz.h}%`, width: '100%', height: `${100 - hz.y - hz.h}%` }} />
          </>
        )}
        {zones.map((z) => {
          const zone = z.hotzones[state.id]
          const isSel = z.moduleId === selectedModuleId
          return (
            <div
              key={z.moduleId}
              className={`hz${isSel ? ' sel' : ''}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
              title={getModule(z.moduleId).name}
              onClick={(e) => {
                e.stopPropagation()
                onSelectModule(isSel ? null : z.moduleId)
              }}
            />
          )
        })}
      </div>
      {selectedModuleId && !hz && <div className="viewer-note">「{getModule(selectedModuleId).name}」在当前状态下不存在</div>}
      {!selectedModuleId && <div className="viewer-hint">点击虚线热区选中模块 · 其余区域将被蒙层遮罩</div>}
    </div>
  )
}
