<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CredentialListItem } from '../../../shared/types/credential';
  import EditCredentialForm from './EditCredentialForm.svelte';

  export let items: CredentialListItem[];

  const dispatch = createEventDispatcher<{ credentialUpdated: CredentialListItem }>();

  let editingId: number | null = null;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function handleCredentialUpdated(event: CustomEvent<CredentialListItem>) {
    const updated = event.detail;
    items = items.map((c) => (c.id === updated.id ? updated : c));
    editingId = null;
    dispatch('credentialUpdated', updated);
  }

  function handleCancelled() {
    editingId = null;
  }
</script>

<div id="cred-list" class="cred-list">
  {#each items as item (item.id)}
    <div id="cred-list-item-{item.id}" class="cred-row">
      <div class="cred-main">
        <span class="cred-name">{item.name}</span>
        <button
          id="cred-edit-btn-{item.id}"
          class="btn-edit"
          on:click={() => { editingId = editingId === item.id ? null : item.id; }}
        >
          {editingId === item.id ? 'Cancel' : 'Edit'}
        </button>
        <span class="cred-type-badge" data-type={item.type}>{item.type}</span>
      </div>
      <div class="cred-meta">
        <span class="cred-masked-value">{item.masked}</span>
        <span class="cred-server-count">Used by {item.linked_server_count} server{item.linked_server_count !== 1 ? 's' : ''}</span>
        <span class="cred-date">{formatDate(item.created_at)}</span>
      </div>
      {#if editingId === item.id}
        <EditCredentialForm {item} on:credentialUpdated={handleCredentialUpdated} on:cancelled={handleCancelled} />
      {/if}
    </div>
  {/each}
</div>

<style>
  .cred-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cred-row {
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1px solid var(--vscode-panel-border, #333);
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cred-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cred-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground, #ccc);
    flex: 1;
  }
  .btn-edit {
    padding: 2px 10px;
    font-size: 11px;
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-edit:hover {
    background: var(--vscode-button-secondaryHoverBackground, #45494e);
  }
  .cred-type-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--vscode-badge-background, #4d4d4d);
    color: var(--vscode-badge-foreground, #fff);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .cred-type-badge[data-type="github-pat"] {
    background: #238636;
    color: #fff;
  }
  .cred-type-badge[data-type="aws"] {
    background: #e47911;
    color: #fff;
  }
  .cred-type-badge[data-type="generic-token"] {
    background: #0e639c;
    color: #fff;
  }
  .cred-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #888);
  }
  .cred-masked-value {
    font-family: monospace;
    letter-spacing: 0.05em;
  }
  .cred-server-count {
    background: var(--vscode-badge-background, #4d4d4d);
    color: var(--vscode-badge-foreground, #fff);
    border-radius: 8px;
    padding: 1px 7px;
    font-size: 11px;
  }
  .cred-date {
    margin-left: auto;
  }
</style>
