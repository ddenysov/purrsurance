import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/stream': {
                target: process.env.VITE_SSE_PROXY_TARGET || 'http://127.0.0.1:80',
                changeOrigin: true,
            },
            '/api/chat': {
                target: process.env.VITE_CHAT_PROXY_TARGET || 'http://127.0.0.1:80',
                changeOrigin: true,
            },
            '/api/vet-appointments': {
                target: 'https://3ehcudxdblj37bv2ovnxakr5340pvqlz.lambda-url.us-east-1.on.aws/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        tailwindcss(),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        wayfinder({
            formVariants: true,
        }),
    ],
});
