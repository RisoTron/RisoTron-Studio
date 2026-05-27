<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import SettingsView from './components/SettingsView.svelte';

  let appInfo: AppInfo | null = null;
  let currentView: 'home' | 'settings' = 'home';

  let cleanupNewProject: (() => void) | undefined;
  let cleanupPreferences: (() => void) | undefined;

  onMount(async () => {
    if (window.api) {
      if (window.api.onMenuNewProject) {
        cleanupNewProject = window.api.onMenuNewProject(() => {
          console.log('[STUB] "New Project" menu item clicked');
        });
      }
      
      if (window.api.onMenuPreferences) {
        cleanupPreferences = window.api.onMenuPreferences(() => {
          currentView = currentView === 'settings' ? 'home' : 'settings';
        });
      }

      if (window.api.getAppInfo) {
        try {
          appInfo = await window.api.getAppInfo();
        } catch (e) {
          console.error("Failed to get app info", e);
        }
      }
    }
  });

  onDestroy(() => {
    if (cleanupNewProject) cleanupNewProject();
    if (cleanupPreferences) cleanupPreferences();
  });
</script>

<div class="vscode-layout">
  <!-- Activity Bar -->
  <aside class="activity-bar">
    <button class="activity-icon {currentView === 'home' ? 'active' : ''}" on:click={() => currentView = 'home'} title="Explorer">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 18H21v-2h-6.5v2zm0-12v2H21V6h-6.5zm-11 0v12h9V6h-9zm1.5 2h6v8h-6V8z" /></svg>
    </button>
    <div class="activity-spacer"></div>
    <button class="activity-icon {currentView === 'settings' ? 'active' : ''}" on:click={() => currentView = 'settings'} title="Settings">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
    </button>
  </aside>

  <!-- Editor Area -->
  <main class="editor-area">
    {#if currentView === 'settings'}
      <SettingsView />
    {:else}
      <div class="welcome">
        <h1>Welcome to RisoTron Studio</h1>
        <p>AI-powered creative studio platform</p>
      </div>
    {/if}
  </main>

  <!-- Status Bar -->
  <footer class="status-bar">
    <div class="status-item">RisoTron Studio</div>
    {#if appInfo}
      <div class="status-item">v{appInfo.version}</div>
    {/if}
    <div class="status-spacer"></div>
    <div class="status-item">Node 22</div>
  </footer>
</div>

<style>
  /* Base Layout */
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: var(--vscode-editor);
    color: var(--vscode-fg);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    height: 100vh;
    overflow: hidden;
  }

  .vscode-layout {
    display: grid;
    grid-template-areas:
      "activity editor"
      "status   status";
    grid-template-columns: 48px 1fr;
    grid-template-rows: 1fr 22px;
    height: 100vh;
  }

  /* Activity Bar */
  .activity-bar {
    grid-area: activity;
    background-color: var(--vscode-activity-bar);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
  }

  .activity-icon {
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--vscode-fg-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    border-left: 2px solid transparent;
  }

  .activity-icon:hover {
    color: var(--vscode-fg);
  }

  .activity-icon.active {
    color: var(--vscode-active);
    border-left-color: var(--vscode-active);
  }

  .activity-icon svg {
    width: 24px;
    height: 24px;
  }

  .activity-spacer {
    flex-grow: 1;
  }

  /* Editor Area */
  .editor-area {
    grid-area: editor;
    background-color: var(--vscode-editor);
    overflow-y: auto;
    position: relative;
  }

  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }

  .welcome h1 {
    font-size: 2rem;
    font-weight: 400;
    color: var(--vscode-active);
    margin-bottom: 0.5rem;
  }

  .welcome p {
    font-size: 1.1rem;
    color: var(--vscode-fg-muted);
  }

  .info {
    margin-top: 2rem;
    color: var(--vscode-fg-muted);
    font-size: 0.9rem;
  }

  /* Status Bar */
  .status-bar {
    grid-area: status;
    background-color: var(--vscode-status-bar);
    color: #ffffff;
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-size: 12px;
  }

  .status-item {
    padding: 0 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .status-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .status-spacer {
    flex-grow: 1;
  }
</style>
