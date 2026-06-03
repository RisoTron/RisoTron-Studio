import { mergeConfig } from 'vite';
import baseConfig from './vite.main.config';

/**
 * Standalone e2e build config.
 * Extends the base main config with fallback defines for Forge constants.
 * Used only by `build:main` (playwright e2e) — NOT by `electron-forge start/package`
 * which injects these defines itself.
 */
export default mergeConfig(baseConfig, {
  define: {
    // No dev server in standalone mode → fall through to loadFile()
    MAIN_WINDOW_VITE_DEV_SERVER_URL: 'undefined',
    MAIN_WINDOW_VITE_NAME: JSON.stringify('main_window'),
  },
});
