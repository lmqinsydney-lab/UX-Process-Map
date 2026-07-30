// 从 assets/source/Example1.png 按检测到的包围盒裁切各「页面×状态」真实截图，
// 输出到 public/assets/pages/<pageId>/<stateId>.png（覆盖占位图路径，扩展名为 png）。
// 包围盒来自 scripts/detect-pages.mjs 的自动检测结果（18464x4251 原图像素坐标）。
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'assets/source/Example1.png')

// 检测框 → 页面/状态 映射（行序 + x 序，与图二排布一一对应）
const CROPS = [
  { pageId: 'channel-home', stateId: 'default', x: 170, y: 640, w: 750, h: 1630 },
  { pageId: 'bill-all', stateId: 'default', x: 1000, y: 640, w: 760, h: 1630 },
  { pageId: 'bill-month', stateId: 'default', x: 1830, y: 640, w: 750, h: 1630 },
  { pageId: 'repay-page', stateId: 'collapsed', x: 3860, y: 640, w: 760, h: 1630 },
  { pageId: 'repay-page', stateId: 'expanded', x: 5880, y: 640, w: 760, h: 1630 },
  { pageId: 'plan-sheet', stateId: 'default', x: 7150, y: 640, w: 750, h: 1630 },
  { pageId: 'online-page', stateId: 'default', x: 10060, y: 640, w: 760, h: 1630 },
  { pageId: 'ir-channel-home', stateId: 'default', x: 11530, y: 640, w: 750, h: 1630 },
  { pageId: 'ir-repay-page', stateId: 'default', x: 12630, y: 640, w: 750, h: 1630 },
  { pageId: 'success-paid', stateId: 'default', x: 14200, y: 640, w: 750, h: 1630 },
  { pageId: 'success-unpaid', stateId: 'default', x: 15050, y: 640, w: 750, h: 1630 },
  { pageId: 'record-list', stateId: 'default', x: 16700, y: 640, w: 750, h: 1630 },
  { pageId: 'record-detail', stateId: 'default', x: 17590, y: 640, w: 750, h: 1630 },
  { pageId: 'repay-page', stateId: 'nocoupon-expanded', x: 7150, y: 2560, w: 750, h: 1630 },
  { pageId: 'repay-page', stateId: 'nocoupon-collapsed', x: 8230, y: 2560, w: 760, h: 1630 },
]

const OUT_W = 750 // 输出统一宽度，保持清晰度

for (const c of CROPS) {
  const dir = resolve(root, 'public/assets/pages', c.pageId)
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, `${c.stateId}.png`)
  await sharp(SRC)
    .extract({ left: c.x, top: c.y, width: c.w, height: c.h })
    .resize({ width: OUT_W })
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${c.pageId}/${c.stateId}.png (${c.w}x${c.h})`)
}
console.log(`done: ${CROPS.length} crops`)
