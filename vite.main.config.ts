import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

/**
 * Externalize everything that should NOT be bundled into the main process output:
 *  1. All Node.js built-ins (fs, path, node:*, etc.)
 *  2. All node_modules — especially CJS packages like @electron-forge/core that
 *     use __dirname and break when inlined into an ES module bundle.
 * Electron resolves node_modules at runtime from the app directory, so
 * externalizing them is both correct and required.
 */
const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: [
        ...nodeExternals,
        // Externalize all node_modules — matched by package name (no leading ./ or /)
        /^[^./]|^\.[^./]|^\.\.[^/]/,
      ],
      output: {
        format: 'es',
      },
    },
  },
});
