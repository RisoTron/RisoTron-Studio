import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
      fileName: () => '[name].js'
    },
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});
