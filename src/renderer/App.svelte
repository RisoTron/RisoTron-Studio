<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import '@vscode/codicons/dist/codicon.css';
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
      <i class="codicon codicon-files"></i>
    </button>
    <div class="activity-spacer"></div>
    <button class="activity-icon {currentView === 'settings' ? 'active' : ''}" on:click={() => currentView = 'settings'} title="Settings">
      <i class="codicon codicon-settings-gear"></i>
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
    font-size: 24px;
  }

  .activity-icon:hover {
    color: var(--vscode-fg);
  }

  .activity-icon.active {
    color: var(--vscode-active);
    border-left-color: var(--vscode-active);
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
