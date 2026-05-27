<script lang="ts">
  import { onMount } from 'svelte';

  /** Local reactive copies of each setting. */
  let defaultTemplate = '';
  let defaultPath = '';

  /** UI state flags. */
  let loading = true;
  let saveStatus: Record<string, 'idle' | 'saving' | 'saved' | 'error'> = {
    defaultTemplate: 'idle',
    defaultPath: 'idle',
  };

  onMount(async () => {
    try {
      const settings = await window.api.settings.getAll();
      defaultTemplate = settings.defaultTemplate;
      defaultPath = settings.defaultPath;
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      loading = false;
    }
  });

  /** Debounce timers keyed by setting name. */
  const timers: Record<string, ReturnType<typeof setTimeout>> = {};

  function handleChange(key: 'defaultTemplate' | 'defaultPath', value: string) {
    // Immediately update local state
    if (key === 'defaultTemplate') defaultTemplate = value;
    if (key === 'defaultPath') defaultPath = value;

    // Debounce the save
    clearTimeout(timers[key]);
    saveStatus[key] = 'idle';
    saveStatus = { ...saveStatus }; // trigger reactivity

    timers[key] = setTimeout(async () => {
      saveStatus[key] = 'saving';
      saveStatus = { ...saveStatus };
      try {
        await window.api.settings.set(key, value);
        saveStatus[key] = 'saved';
        saveStatus = { ...saveStatus };
        // Reset to idle after a beat
        setTimeout(() => {
          saveStatus[key] = 'idle';
          saveStatus = { ...saveStatus };
        }, 2000);
      } catch (err) {
        console.error(`Failed to save setting "${key}"`, err);
        saveStatus[key] = 'error';
        saveStatus = { ...saveStatus };
      }
    }, 400);
  }
</script>

{#if loading}
  <div class="settings-loading">
    <div class="spinner"></div>
    <p>Loading settings…</p>
  </div>
{:else}
  <div class="settings-root">
    <!-- Header -->
    <div class="settings-header">
      <div class="settings-header-icon">⚙</div>
      <h1 class="settings-title">Settings</h1>
      <p class="settings-subtitle">Configure your RisoTron Studio preferences</p>
    </div>

    <!-- Search bar (decorative for now — foundation for future filtering) -->
    <div class="settings-search">
      <span class="search-icon">🔍</span>
      <input
        id="settings-search-input"
        type="text"
        placeholder="Search settings…"
        disabled
        aria-label="Search settings (coming soon)"
      />
    </div>

    <!-- Settings groups -->
    <div class="settings-body">
      <!-- Project Defaults group -->
      <section class="settings-group" aria-labelledby="group-project-defaults">
        <h2 id="group-project-defaults" class="group-title">Project Defaults</h2>
        <p class="group-description">
          Default values used when creating new projects.
        </p>

        <!-- Default Template -->
        <div class="setting-row">
          <div class="setting-label-area">
            <label for="setting-defaultTemplate" class="setting-label">
              Default Template
            </label>
            <p class="setting-description">
              The project template to use by default (e.g. <code>electron-forge-vite</code>).
            </p>
          </div>
          <div class="setting-control">
            <input
              id="setting-defaultTemplate"
              type="text"
              value={defaultTemplate}
              on:input={(e) => handleChange('defaultTemplate', e.currentTarget.value)}
            />
            <span class="save-indicator {saveStatus.defaultTemplate}">
              {#if saveStatus.defaultTemplate === 'saving'}
                Saving…
              {:else if saveStatus.defaultTemplate === 'saved'}
                ✓ Saved
              {:else if saveStatus.defaultTemplate === 'error'}
                ✗ Error
              {/if}
            </span>
          </div>
        </div>

        <!-- Default Path -->
        <div class="setting-row">
          <div class="setting-label-area">
            <label for="setting-defaultPath" class="setting-label">
              Default Path
            </label>
            <p class="setting-description">
              Filesystem path where new projects are created.
            </p>
          </div>
          <div class="setting-control">
            <input
              id="setting-defaultPath"
              type="text"
              value={defaultPath}
              on:input={(e) => handleChange('defaultPath', e.currentTarget.value)}
            />
            <span class="save-indicator {saveStatus.defaultPath}">
              {#if saveStatus.defaultPath === 'saving'}
                Saving…
              {:else if saveStatus.defaultPath === 'saved'}
                ✓ Saved
              {:else if saveStatus.defaultPath === 'error'}
                ✗ Error
              {/if}
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  /* ── Layout ── */
  .settings-root {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    color: var(--vscode-fg);
  }

  /* ── Loading state ── */
  .settings-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    color: var(--vscode-fg-muted);
    gap: 16px;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--vscode-border);
    border-top-color: var(--vscode-status-bar);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Header ── */
  .settings-header {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--vscode-border);
  }

  .settings-header-icon {
    font-size: 28px;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .settings-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--vscode-active);
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }

  .settings-subtitle {
    font-size: 13px;
    color: var(--vscode-fg-muted);
    margin: 0;
  }

  /* ── Search (decorative) ── */
  .settings-search {
    position: relative;
    margin-bottom: 28px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.5;
    pointer-events: none;
  }

  .settings-search input {
    width: 100%;
    padding: 8px 12px 8px 32px;
    background: var(--vscode-input-bg);
    border: 1px solid var(--vscode-border);
    border-radius: 4px;
    color: var(--vscode-fg-muted);
    font-size: 13px;
    outline: none;
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* ── Settings Group ── */
  .settings-group {
    margin-bottom: 32px;
  }

  .group-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--vscode-fg-muted);
    margin: 0 0 4px;
  }

  .group-description {
    font-size: 13px;
    color: var(--vscode-fg-muted);
    margin: 0 0 20px;
  }

  /* ── Setting Row ── */
  .setting-row {
    padding: 16px 0;
    border-bottom: 1px solid var(--vscode-border);
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--vscode-active);
    margin-bottom: 2px;
  }

  .setting-description {
    font-size: 13px;
    color: var(--vscode-fg-muted);
    margin: 0 0 10px;
    line-height: 1.4;
  }

  .setting-description code {
    background: var(--vscode-input-bg);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: var(--vscode-link);
  }

  /* ── Input ── */
  .setting-control {
    position: relative;
  }

  .setting-control input {
    width: 100%;
    padding: 7px 10px;
    background: var(--vscode-input-bg);
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    color: var(--vscode-input-fg);
    font-size: 13px;
    font-family: 'Menlo', 'Consolas', 'Courier New', monospace;
    outline: none;
    transition: border-color 0.15s;
  }

  .setting-control input:focus {
    border-color: var(--vscode-input-focus-border);
  }

  .setting-control input:hover:not(:focus) {
    border-color: var(--vscode-fg-muted);
  }

  /* ── Save indicator ── */
  .save-indicator {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    min-height: 16px;
    transition: opacity 0.2s;
  }

  .save-indicator.idle {
    opacity: 0;
  }

  .save-indicator.saving {
    color: var(--vscode-fg-muted);
    opacity: 1;
  }

  .save-indicator.saved {
    color: var(--vscode-success);
    opacity: 1;
  }

  .save-indicator.error {
    color: var(--vscode-error);
    opacity: 1;
  }
</style>
