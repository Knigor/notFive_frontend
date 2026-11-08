import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/notFive_frontend/',
    plugins: [vue(), tailwindcss(), VueI18nPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@lib': path.resolve(__dirname, './src/lib')
        }
    }
})
