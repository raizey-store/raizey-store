import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// إعدادات محرك Vite لتجميع ملفات متجر رايزي بسلاسة
export default defineConfig({
  plugins: [react()],
})
