import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '/bring-out-the-lobster/',
    server: {
        open: true,
        https: true,
        port: 5174
    },
    build: {
        outDir: 'dist'
    },
    plugins: [mkcert(), VitePWA({ registerType: 'autoUpdate' })]
});