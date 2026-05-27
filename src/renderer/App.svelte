<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import SettingsView from './components/SettingsView.svelte';

  let appInfo: AppInfo | null = null;
  let pinging = false;
  let pingResult: string | null = null;
  let pingError = false;
  let showSettings = false;

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
          showSettings = !showSettings;
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

  async function handlePing() {
    if (pinging) return;
    pinging = true;
    pingResult = null;
    pingError = false;
    try {
      const response = await window.api.ping();
      pingResult = response;
    } catch (err: unknown) {
      pingResult = `Error: ${err instanceof Error ? err.message : String(err)}`;
      pingError = true;
    } finally {
      pinging = false;
    }
  }
</script>

<main class:settings-bg={showSettings}>
  {#if showSettings}
    <div class="settings-container">
      <button class="settings-back" on:click={() => showSettings = false}>
        ← Back to Home
      </button>
      <SettingsView />
    </div>
  {:else}
    <div class="welcome">
      <h1>Welcome to RisoTron Studio</h1>
      <p>AI-powered creative studio platform</p>
      {#if appInfo}
        <div class="info">
          <p><strong>Version:</strong> {appInfo.version}</p>
          <p><strong>Window State:</strong></p>
          <pre>{JSON.stringify(appInfo.state, null, 2)}</pre>
        </div>
      {/if}
      <div class="ping-section">
        <button id="ping-btn" on:click={handlePing} disabled={pinging}>
          {pinging ? 'Pinging…' : '🏓 Ping'}
        </button>
        {#if pingResult !== null}
          <p class="ping-result" class:ping-error={pingError}>
            {pingResult}
          </p>
        {/if}
      </div>
      <div class="settings-link">
        <button id="open-settings-btn" class="link-button" on:click={() => showSettings = true}>
          ⚙ Open Settings
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }

  main.settings-bg {
    background: var(--vscode-editor);
    align-items: flex-start;
    justify-content: stretch;
  }

  .settings-container {
    width: 100%;
    min-height: 100vh;
    padding-top: 8px;
  }

  .settings-back {
    display: inline-block;
    margin: 8px 24px;
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--vscode-border);
    border-radius: 3px;
    color: var(--vscode-link);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .settings-back:hover {
    background: var(--vscode-list-hover);
  }

  .welcome h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .welcome p {
    font-size: 1.1rem;
    opacity: 0.7;
  }

  .info {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 8px;
    text-align: left;
    font-size: 0.9rem;
  }

  .info pre {
    margin-top: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .ping-section {
    margin-top: 2rem;
  }

  .ping-section button {
    padding: 0.6rem 1.4rem;
    font-size: 1rem;
    border: none;
    border-radius: 6px;
    background: #4f8cff;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .ping-section button:hover:not(:disabled) {
    opacity: 0.85;
  }

  .ping-section button:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .ping-section button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ping-result {
    margin-top: 0.75rem;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .ping-error {
    color: #ff5555;
  }

  .settings-link {
    margin-top: 1.5rem;
  }

  .link-button {
    background: transparent;
    border: 1px solid rgba(128, 128, 128, 0.3);
    border-radius: 6px;
    color: var(--fg-muted, #6e6e73);
    font-size: 0.9rem;
    padding: 0.5rem 1.2rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .link-button:hover {
    color: var(--fg, #f5f5f7);
    border-color: rgba(128, 128, 128, 0.6);
  }
</style>
