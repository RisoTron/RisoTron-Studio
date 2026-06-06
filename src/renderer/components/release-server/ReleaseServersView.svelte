<script lang="ts">
  import { onMount } from 'svelte';
  import { PROVIDER_TYPES } from '../../../shared/constants/providers';
  import type { ReleaseServer } from '../../../shared/types/release-server';
  import ReleaseServerForm from './ReleaseServerForm.svelte';

  let servers: ReleaseServer[] = $state([]);
  let loading = $state(true);
  let showForm = $state(false);

  onMount(() => {
    loadServers();
  });

  async function loadServers() {
    loading = true;
    try {
      const result = await window.api.releaseServer.list();
      if (result.success) {
        servers = result.data;
      }
    } catch (e) {
      console.error('Failed to load release servers', e);
    } finally {
      loading = false;
    }
  }

  function handleServerAdded(server: ReleaseServer) {
    servers = [server, ...servers];
    showForm = false;
  }
</script>

<div class="release-servers-view">
  <div class="view-header">
    <h2>Release Servers</h2>
    <button class="btn-add" onclick={() => (showForm = !showForm)}>
      <i class="codicon {showForm ? 'codicon-chevron-up' : 'codicon-add'}"></i>
      {showForm ? 'Cancel' : 'Add Server'}
    </button>
  </div>

  {#if showForm}
    <ReleaseServerForm onServerAdded={handleServerAdded} />
  {/if}

  {#if loading}
    <div class="empty-state">Loading…</div>
  {:else if servers.length === 0}
    <div class="empty-state">
      <i class="codicon codicon-server-environment"></i>
      <p>No release servers configured yet.</p>
      {#if !showForm}
        <button class="btn-link" onclick={() => (showForm = true)}>Add your first server</button>
      {/if}
    </div>
  {:else}
    <div class="server-list">
      {#each servers as server (server.id)}
        <div class="server-card">
          <div class="server-icon">
            <i class="codicon {PROVIDER_TYPES[server.provider_type]?.icon ?? 'codicon-server'}"></i>
          </div>
          <div class="server-info">
            <strong>{server.name}</strong>
            <span class="server-meta">
              {PROVIDER_TYPES[server.provider_type]?.label ?? server.provider_type}
              · Credential: {server.credential_name}
            </span>
            <span class="server-config">
              {#each Object.entries(server.config) as [key, val] (key)}
                <code>{key}: {val}</code>
              {/each}
            </span>
          </div>
          <span class="server-date">{server.created_at}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .release-servers-view {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .view-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--vscode-foreground, #ccc);
  }
  .btn-add {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--vscode-button-background, #0e639c);
    color: var(--vscode-button-foreground, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  .btn-add:hover {
    background: var(--vscode-button-hoverBackground, #1177bb);
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px;
    color: var(--vscode-descriptionForeground, #888);
    font-size: 14px;
  }
  .empty-state .codicon {
    font-size: 36px;
    opacity: 0.5;
  }
  .btn-link {
    background: none;
    border: none;
    color: var(--vscode-textLink-foreground, #3794ff);
    cursor: pointer;
    font-size: 13px;
    text-decoration: underline;
  }
  .server-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .server-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--vscode-sideBar-background, #1e1e1e);
    border: 1px solid var(--vscode-panel-border, #333);
    border-radius: 6px;
  }
  .server-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: var(--vscode-badge-background, #333);
    color: var(--vscode-badge-foreground, #fff);
    font-size: 18px;
  }
  .server-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .server-info strong {
    font-size: 13px;
    color: var(--vscode-foreground, #ccc);
  }
  .server-meta {
    font-size: 11px;
    color: var(--vscode-descriptionForeground, #888);
  }
  .server-config {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .server-config code {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--vscode-textCodeBlock-background, #2a2a2a);
    border-radius: 3px;
    color: var(--vscode-foreground, #ccc);
  }
  .server-date {
    font-size: 11px;
    color: var(--vscode-descriptionForeground, #888);
    white-space: nowrap;
  }
</style>
