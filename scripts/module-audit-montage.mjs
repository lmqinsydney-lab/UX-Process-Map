// 模块同一性核对辅助：为每个多实例模块生成一张对比拼图——
// 各页面实例的热区裁剪横向排列、带页面标签，供截图级形态比对。
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(readFileSync(resolve(root, 'src/data/project.json'), 'utf8'))
const outDir = resolve(root, 'docs/module-audit')
mkdirSync(outDir, { recursive: true })

const ROW_H = 170
const LABEL_H = 26
const GAP = 14
const MARGIN = 1.5 // 裁剪时向四周扩一点上下文（百分比）

const label = (text, w) =>
  Buffer.from(
    `<svg width="${w}" height="${LABEL_H}"><rect width="${w}" height="${LABEL_H}" fill="#1f2329"/><text x="6" y="18" font-size="13" fill="#ffffff" font-family="-apple-system,'PingFang SC',sans-serif">${text}</text></svg>`,
  )

for (const mod of project.modules) {
  const insts = []
  for (const page of project.pages) {
    for (const inst of page.moduleInstances) {
      if (inst.moduleId !== mod.id) continue
      const stateId = Object.keys(inst.hotzones)[0]
      if (!stateId) continue
      insts.push({ page, stateId, hz: inst.hotzones[stateId] })
    }
  }
  if (insts.length < 2) continue

  const tiles = []
  for (const { page, stateId, hz } of insts) {
    const state = page.states.find((s) => s.id === stateId)
    const imgPath = resolve(root, 'public', state.image)
    const meta = await sharp(imgPath).metadata()
    const x = Math.max(0, Math.round(((hz.x - MARGIN) / 100) * meta.width))
    const y = Math.max(0, Math.round(((hz.y - MARGIN) / 100) * meta.height))
    const w = Math.min(meta.width - x, Math.round(((hz.w + MARGIN * 2) / 100) * meta.width))
    const h = Math.min(meta.height - y, Math.round(((hz.h + MARGIN * 2) / 100) * meta.height))
    const crop = await sharp(imgPath).extract({ left: x, top: y, width: w, height: h }).resize({ height: ROW_H, fit: 'inside' }).png().toBuffer()
    const cm = await sharp(crop).metadata()
    const tileW = Math.max(cm.width, 90)
    const tile = await sharp({ create: { width: tileW, height: LABEL_H + ROW_H, channels: 3, background: '#ffffff' } })
      .composite([
        { input: label(`${page.name}·${stateId}`, tileW), left: 0, top: 0 },
        { input: crop, left: 0, top: LABEL_H },
      ])
      .png()
      .toBuffer()
    tiles.push(tile)
  }

  const metas = await Promise.all(tiles.map((t) => sharp(t).metadata()))
  const totalW = metas.reduce((s, m) => s + m.width, 0) + GAP * (tiles.length + 1)
  const totalH = LABEL_H + ROW_H + GAP * 2
  let cursor = GAP
  const comps = tiles.map((t, i) => {
    const c = { input: t, left: cursor, top: GAP }
    cursor += metas[i].width + GAP
    return c
  })
  await sharp({ create: { width: totalW, height: totalH, channels: 3, background: '#e8eaee' } })
    .composite(comps)
    .png()
    .toFile(resolve(outDir, `${mod.id}.png`))
  console.log(`✓ ${mod.id} (${insts.length} 实例)`)
}
console.log('done')
