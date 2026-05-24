import { defineConfig } from 'vite';
// eslint-disable-next-line import/no-unresolved
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [svelte()],
  root: 'src/renderer',
});
