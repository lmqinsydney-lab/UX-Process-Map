import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 部署路径；本地 dev 不受影响
  base: '/UX-Process-Map/',
  plugins: [react()],
})
