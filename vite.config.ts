import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  // 页脚「最后更新」跟随构建时间，避免手工维护
  define: { __BUILD_MONTH__: JSON.stringify(new Date().toISOString().slice(0, 7)) },
  // 本地联调：npm run dev 时 /api 转发到 npx wrangler pages dev（8788，模拟 KV）
  server: { proxy: { '/api': 'http://127.0.0.1:8788' } },
})
