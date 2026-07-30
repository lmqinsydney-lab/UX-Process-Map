// 为每个「页面 × 状态」生成灰底线框占位 SVG，模块块按热区坐标绘制，
// 保证素材未到位时全链路可跑、热区与画面天然对齐。
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(readFileSync(resolve(root, 'src/data/project.json'), 'utf8'))

const W = 375
const H = 812

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

let count = 0
for (const page of project.pages) {
  for (const state of page.states) {
    const blocks = []
    for (const inst of page.moduleInstances) {
      const hz = inst.hotzones[state.id]
      if (!hz) continue
      const mod = project.modules.find((m) => m.id === inst.moduleId)
      const x = (hz.x / 100) * W
      const y = (hz.y / 100) * H
      const w = (hz.w / 100) * W
      const h = (hz.h / 100) * H
      const fontSize = h < 28 ? 11 : 13
      blocks.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="6" fill="#f3f4f6" stroke="#d1d5db" stroke-dasharray="5 4"/>` +
          `<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + fontSize / 3).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" fill="#6b7280" font-family="-apple-system,'PingFang SC',sans-serif">${esc(mod ? mod.name : inst.moduleId)}</text>`,
      )
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#e5e7eb"/>
${blocks.join('\n')}
<text x="${W / 2}" y="${H - 16}" text-anchor="middle" font-size="12" fill="#c0c4cc" font-family="-apple-system,'PingFang SC',sans-serif">${esc(page.name)} · ${esc(state.name)} · 占位图</text>
</svg>
`
    const rel = state.image.replace(/\.(png|jpg|svg)$/, '.svg')
    const out = resolve(root, 'public', rel)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, svg)
    count++
  }
}
console.log(`generated ${count} placeholder svgs under public/assets/pages/`)
