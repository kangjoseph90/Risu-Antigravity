import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { risuPluginHeader } from './vite-plugin-risu-header';

export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      emitCss: true,
    }),
    cssInjectedByJsPlugin(), // CSS injection
    risuPluginHeader(), // RisuAI Plugin header injection
  ],
  build: {
    lib: {
      entry: 'src/main.ts', // Plugin entry file
      name: 'risu-antigravity', // Plugin name
      fileName: () => 'risu-antigravity.js', // Output file name
      formats: ['umd']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    cssCodeSplit: false,
    minify: 'terser',
    sourcemap: false
  }
});
