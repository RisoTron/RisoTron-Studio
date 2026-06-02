<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  /** Local reactive copies of each setting. */
  let defaultTemplate = '';
  let defaultPath = '';
  let preferredIDE = '';

  /** UI state flags. */
  let loading = true;
  let loaded = false;
  let loadError = false;
  let saveStatus: Record<string, 'idle' | 'saving' | 'saved' | 'error'> = {
    defaultTemplate: 'idle',
    defaultPath: 'idle',
    preferredIDE: 'idle',
  };

  onMount(async () => {
    try {
      const settings = await window.api.settings.getAll();
      defaultTemplate = settings.defaultTemplate;
      defaultPath = settings.defaultPath;
      preferredIDE = settings.preferredIDE || '';
      loaded = true;
      loadError = false;
    } catch (err) {
      console.error('Failed to load settings', err);
      loadError = true;
    } finally {
      loading = false;
    }
  });

  /** Debounce timers keyed by setting name. */
  const timers: Record<string, ReturnType<typeof setTimeout>> = {};
  const statusTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  function handleChange(key: 'defaultTemplate' | 'defaultPath' | 'preferredIDE', value: string) {
    if (!loaded || loadError) return;

    // Immediately update local state
    if (key === 'defaultTemplate') defaultTemplate = value;
    if (key === 'defaultPath') defaultPath = value;
    if (key === 'preferredIDE') preferredIDE = value;

    // Debounce the save
    if (timers[key]) clearTimeout(timers[key]);
    if (statusTimers[key]) clearTimeout(statusTimers[key]);

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
        statusTimers[key] = setTimeout(() => {
          saveStatus[key] = 'idle';
          saveStatus = { ...saveStatus };
        }, 2000);
      } catch (err) {
        console.error(`Failed to save setting "${key}"`, err);
        saveStatus[key] = 'error';
        saveStatus = { ...saveStatus };
        statusTimers[key] = setTimeout(() => {
          saveStatus[key] = 'idle';
          saveStatus = { ...saveStatus };
        }, 2000);
      }
    }, 400);
  }

  onDestroy(() => {
    Object.values(timers).forEach(clearTimeout);
    Object.values(statusTimers).forEach(clearTimeout);
  });
</script>

{#if loading}
  <div class="settings-loading">
    <div class="spinner"></div>
    <p>Loading settings…</p>
  </div>
{:else if loadError}
  <div class="settings-loading">
    <p>Failed to load settings. Please restart the app.</p>
  </div>
{:else}
  <div class="settings-root">
    <!-- Search bar -->
    <div class="settings-search">
      <input
        id="settings-search-input"
        type="text"
        placeholder="Search Settings"
        on:input={(e) => {}}
      />
    </div>

    <!-- Settings content -->
    <div class="settings-body">
      <!-- Project Defaults group -->
      <section class="settings-group" aria-labelledby="group-project-defaults">
        <h2 id="group-project-defaults" class="group-title">Project Defaults</h2>

        <!-- Default Template -->
        <div class="setting-row">
          <div class="setting-label-area">
            <label for="setting-defaultTemplate" class="setting-label">
              Project: <strong>Default Template</strong>
            </label>
            <p class="setting-description">
              The project template to use by default (e.g. <code>electron-forge-vite</code>).
            </p>
          </div>
          <div class="setting-control">
            <input
              id="setting-defaultTemplate"
              type="text"
              bind:value={defaultTemplate}
              on:input={() => handleChange('defaultTemplate', defaultTemplate)}
            />
            <span class="save-indicator {saveStatus.defaultTemplate}">
              {#if saveStatus.defaultTemplate === 'saving'}
                Saving…
              {:else if saveStatus.defaultTemplate === 'saved'}
                ✓
              {:else if saveStatus.defaultTemplate === 'error'}
                ✗
              {/if}
            </span>
          </div>
        </div>

        <!-- Default Path -->
        <div class="setting-row">
          <div class="setting-label-area">
            <label for="setting-defaultPath" class="setting-label">
              Project: <strong>Default Path</strong>
            </label>
            <p class="setting-description">
              Filesystem path where new projects are created.
            </p>
          </div>
          <div class="setting-control">
            <input
              id="setting-defaultPath"
              type="text"
              bind:value={defaultPath}
              on:input={() => handleChange('defaultPath', defaultPath)}
            />
            <span class="save-indicator {saveStatus.defaultPath}">
              {#if saveStatus.defaultPath === 'saving'}
                Saving…
              {:else if saveStatus.defaultPath === 'saved'}
                ✓
              {:else if saveStatus.defaultPath === 'error'}
                ✗
              {/if}
            </span>
          </div>
        </div>

        <!-- Preferred IDE Command -->
        <div class="setting-row">
          <div class="setting-label-area">
            <label for="setting-preferredIDE" class="setting-label">
              Project: <strong>Preferred IDE Command</strong>
            </label>
            <p class="setting-description">
              Command to open project in IDE (e.g. <code>code</code>, <code>cursor</code>, <code>open -a "Antigravity IDE"</code>).
            </p>
          </div>
          <div class="setting-control">
            <select
              id="setting-preferredIDE"
              bind:value={preferredIDE}
              on:change={() => handleChange('preferredIDE', preferredIDE)}
            >
              <option value="code">Visual Studio Code (code)</option>
              <option value="cursor">Cursor (cursor)</option>
              <option value="open -a &quot;Antigravity IDE&quot;">Antigravity IDE</option>
              <option value="webstorm">WebStorm (webstorm)</option>
              <option value="idea">IntelliJ IDEA (idea)</option>
              <option value="subl">Sublime Text (subl)</option>
            </select>
            <span class="save-indicator {saveStatus.preferredIDE}">
              {#if saveStatus.preferredIDE === 'saving'}
                Saving…
              {:else if saveStatus.preferredIDE === 'saved'}
                ✓
              {:else if saveStatus.preferredIDE === 'error'}
                ✗
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
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: var(--vscode-fg);
  }

  /* ── Loading state ── */
  .settings-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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

  /* ── Search ── */
  .settings-search {
    padding: 10px 20px;
    border-bottom: 1px solid var(--vscode-border);
    background: var(--vscode-editor);
  }

  .settings-search input {
    width: 100%;
    max-width: 600px;
    padding: 6px 10px;
    background: var(--vscode-input-bg);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    color: var(--vscode-fg);
    font-size: 13px;
    outline: none;
  }

  .settings-search input:focus {
    border-color: var(--vscode-input-focus-border);
  }

  .settings-body {
    padding: 20px;
    overflow-y: auto;
    flex-grow: 1;
  }

  /* ── Settings Group ── */
  .settings-group {
    margin-bottom: 32px;
  }

  .group-title {
    font-size: 20px;
    font-weight: 400;
    color: var(--vscode-active);
    margin: 0 0 16px;
  }

  /* ── Setting Row ── */
  .setting-row {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 400;
    color: var(--vscode-active);
    margin-bottom: 4px;
  }

  .setting-label strong {
    font-weight: 600;
  }

  .setting-description {
    font-size: 13px;
    color: var(--vscode-fg-muted);
    margin: 0 0 8px;
    line-height: 1.4;
  }

  .setting-description code {
    background: var(--vscode-input-bg);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 12px;
    color: var(--vscode-link);
  }

  /* ── Input ── */
  .setting-control {
    position: relative;
    display: flex;
    align-items: center;
  }

  .setting-control input,
  .setting-control select {
    width: 300px;
    padding: 4px 6px;
    background: var(--vscode-input-bg);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    color: var(--vscode-input-fg);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }

  .setting-control input:focus,
  .setting-control select:focus {
    border-color: var(--vscode-input-focus-border);
  }

  .setting-control input:hover:not(:focus),
  .setting-control select:hover:not(:focus) {
    border-color: var(--vscode-fg-muted);
  }

  /* ── Save indicator ── */
  .save-indicator {
    display: inline-block;
    margin-left: 8px;
    font-size: 14px;
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
