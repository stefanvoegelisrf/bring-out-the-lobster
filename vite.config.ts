import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    base: './',
    server: {
        open: true,
        https: true
    },
    build: {
        outDir: 'dist'
    },
    plugins: [mkcert()]
});