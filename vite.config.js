import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/pdf-editor/',
  plugins: [vue()]
})