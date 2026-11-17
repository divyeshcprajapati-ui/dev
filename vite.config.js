import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        // Disable source maps in production — they add significant file size
        sourcemap: false,
        // CSS code splitting: Polaris CSS loads independently from JS chunks
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Split Polaris out because it is extremely large
                        if (id.includes('@shopify/polaris')) {
                            return 'vendor-polaris';
                        }
                        // Group react core dependencies together
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react-core';
                        }
                        // App Bridge gets its own small chunk
                        if (id.includes('@shopify/app-bridge')) {
                            return 'vendor-app-bridge';
                        }
                        // Fallback group for other external libraries
                        return 'vendor-libs';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
});
