import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    base: './',
    server: {
        open: true,
        https: true,
        port: 5174
    },
    build: {
        outDir: 'dist'
    },
    plugins: [mkcert()]
});