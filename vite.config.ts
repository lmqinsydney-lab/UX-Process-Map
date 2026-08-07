import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 部署路径；本地 dev 不受影响
  base: '/UX-Process-Map/',
  plugins: [react()],
  // 支持 PORT 环境变量指定端口（多会话并行预览时由启动器分配）
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
})
