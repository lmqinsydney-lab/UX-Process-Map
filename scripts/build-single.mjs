// 将 vite 构建产物 + 全部页面截图打包成单个自包含 HTML 片段（用于 Artifact / 单文件分发）。
// 用法: node scripts/build-single.mjs <输出路径>
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = process.argv[2] || resolve(root, 'dist/single.html')

const assetsDir = resolve(root, 'dist/assets')
const files = readdirSync(assetsDir)
const jsFile = files.find((f) => f.endsWith('.js'))
const cssFile = files.find((f) => f.endsWith('.css'))
if (!jsFile || !cssFile) throw new Error('dist/assets 缺少构建产物，先运行 npm run build')

const js = readFileSync(join(assetsDir, jsFile), 'utf8').replaceAll('</script', '<\\/script')
const css = readFileSync(join(assetsDir, cssFile), 'utf8')

// 收集页面截图 → data URI 映射
const imgRoot = resolve(root, 'public')
const map = {}
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.png')) {
      map[relative(imgRoot, p)] = `data:image/png;base64,${readFileSync(p).toString('base64')}`
    }
  }
}
walk(resolve(imgRoot, 'assets/pages'))

const html = `<title>可视化体验链路 · 月付分期还款 Demo</title>
<style>${css}</style>
<div id="root"></div>
<script>window.__ASSETS__=${JSON.stringify(map)}</script>
<script type="module">${js}</script>
`
writeFileSync(out, html)
console.log(`✓ ${out} (${(html.length / 1024 / 1024).toFixed(1)} MB, ${Object.keys(map).length} images inlined)`)
