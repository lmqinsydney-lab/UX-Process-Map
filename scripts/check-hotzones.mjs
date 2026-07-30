// 将 project.json 的热区框叠加到真实截图上，输出到 scratch 目录用于人工核对
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(readFileSync(resolve(root, 'src/data/project.json'), 'utf8'))
const outDir = process.argv[2] || resolve(root, '.hotzone-check')
mkdirSync(outDir, { recursive: true })

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

for (const page of project.pages) {
  for (const state of page.states) {
    const src = resolve(root, 'public', state.image)
    const meta = await sharp(src).metadata()
    const W = meta.width
    const H = meta.height
    const rects = []
    for (const inst of page.moduleInstances) {
      const hz = inst.hotzones[state.id]
      if (!hz) continue
      const mod = project.modules.find((m) => m.id === inst.moduleId)
      const x = (hz.x / 100) * W
      const y = (hz.y / 100) * H
      const w = (hz.w / 100) * W
      const h = (hz.h / 100) * H
      rects.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(79,70,229,0.12)" stroke="#4f46e5" stroke-width="3" stroke-dasharray="10 6"/>` +
          `<text x="${x + 8}" y="${y + 26}" font-size="24" font-weight="bold" fill="#4f46e5">${esc(mod.name)}</text>`,
      )
    }
    const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${rects.join('')}</svg>`)
    const out = resolve(outDir, `${page.id}__${state.id}.png`)
    await sharp(src).composite([{ input: overlay }]).png().toFile(out)
    console.log(`✓ ${page.id}__${state.id}.png (${rects.length} zones)`)
  }
}
