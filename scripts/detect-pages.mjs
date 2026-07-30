// 在黑底大图上自动检测手机页面截图的包围盒：
// 降采样 → 亮度阈值 → 连通域 → 过滤出手机形状的块，输出像素坐标供裁切脚本使用。
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'assets/source/Example1.png')
const SCALE = 0.1

const img = sharp(SRC)
const meta = await img.metadata()
const w = Math.round(meta.width * SCALE)
const h = Math.round(meta.height * SCALE)
const { data } = await img.resize(w, h).grayscale().raw().toBuffer({ resolveWithObject: true })

const TH = 50
const seen = new Uint8Array(w * h)
const boxes = []

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (seen[i] || data[i] <= TH) continue
    // BFS 连通域
    let minX = x, maxX = x, minY = y, maxY = y, count = 0
    const stack = [i]
    seen[i] = 1
    while (stack.length) {
      const p = stack.pop()
      const py = Math.floor(p / w)
      const px = p - py * w
      count++
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const ni = ny * w + nx
        if (!seen[ni] && data[ni] > TH) {
          seen[ni] = 1
          stack.push(ni)
        }
      }
    }
    boxes.push({ minX, maxX, minY, maxY, count })
  }
}

// 过滤：手机截图应是较大的竖矩形，且填充率高（文字标注是稀疏小块）
const phones = boxes
  .map((b) => ({
    x: b.minX, y: b.minY,
    w: b.maxX - b.minX + 1, h: b.maxY - b.minY + 1,
    fill: b.count / ((b.maxX - b.minX + 1) * (b.maxY - b.minY + 1)),
  }))
  .filter((b) => b.w > 40 && b.h > 80 && b.h / b.w > 1.4 && b.h / b.w < 3 && b.fill > 0.7)
  .sort((a, b) => (Math.abs(a.y - b.y) > 60 ? a.y - b.y : a.x - b.x))

console.log(`scale=${SCALE} grid=${w}x${h} candidates=${boxes.length} phones=${phones.length}`)
for (const p of phones) {
  const px = (v) => Math.round(v / SCALE)
  console.log(`row_y=${px(p.y)} x=${px(p.x)} y=${px(p.y)} w=${px(p.w)} h=${px(p.h)} fill=${p.fill.toFixed(2)}`)
}
