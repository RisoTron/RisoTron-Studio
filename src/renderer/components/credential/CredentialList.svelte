<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CredentialListItem } from '../../../shared/types/credential';
  import EditCredentialForm from './EditCredentialForm.svelte';

  export let items: CredentialListItem[];

  const dispatch = createEventDispatcher<{ credentialUpdated: CredentialListItem; credentialDeleted: { id: number; name: string } }>();

  let editingId: number | null = null;
  let deletingId: number | null = null;
  let deleteError = '';
  let errorItemId: number | null = null;
  let isDeleting = false;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function handleEdit(id: number) {
    editingId = id;
  }

  function handleUpdated(event: CustomEvent<CredentialListItem>) {
    const updated = event.detail;
    items = items.map(i => i.id === updated.id ? updated : i);
    editingId = null;
    dispatch('credentialUpdated', updated);
  }

  function handleCancelled() {
    editingId = null;
  }

  function handleDelete(id: number) {
    deleteError = '';
    deletingId = null;
    errorItemId = null;
    const item = items.find(i => i.id === id);
    if (item && item.linked_server_count > 0) {
      errorItemId = id;
      deleteError = `Cannot delete "${item.name}": used by ${item.linked_server_count} server(s). Remove those servers first.`;
      return;
    }
    deletingId = id;
  }

  async function confirmDelete(id: number) {
    deleteError = '';
    errorItemId = null;
    isDeleting = true;
    try {
      const result = await window.api.credential.delete({ id });
      if (result.success) {
        deletingId = null;
        dispatch('credentialDeleted', { id, name: items.find(i => i.id === id)?.name ?? '' });
      } else {
        deleteError = result.error.message;
        errorItemId = id;
      }
    } catch {
      deleteError = 'An unexpected error occurred.';
      errorItemId = id;
    } finally {
      isDeleting = false;
    }
  }

  function cancelDelete() {
    deletingId = null;
    deleteError = '';
    errorItemId = null;
  }
</script>

<div id="cred-list" class="cred-list">
  {#each items as item (item.id)}
    <div id="cred-list-item-{item.id}" class="cred-row">
      <div class="cred-main">
        <span class="cred-name">{item.name}</span>
        <span class="cred-type-badge" data-type={item.type}>{item.type}</span>
        <button
          id="cred-edit-btn-{item.id}"
          class="btn-edit"
          on:click={() => handleEdit(item.id)}
          aria-label="Edit {item.name}"
        >
          Edit
        </button>
        <button
          id="cred-delete-btn-{item.id}"
          class="btn-delete"
          on:click={() => handleDelete(item.id)}
          aria-label="Delete {item.name}"
          disabled={deletingId === item.id || editingId === item.id}
        >
          Delete
        </button>
      </div>
      <div class="cred-meta">
        <span class="cred-masked-value">{item.masked}</span>
        <span class="cred-server-count">Used by {item.linked_server_count} server{item.linked_server_count !== 1 ? 's' : ''}</span>
        <span class="cred-date">{formatDate(item.created_at)}</span>
      </div>
      {#if deletingId === item.id}
        <div id="cred-delete-confirm-{item.id}" class="delete-confirm">
          <span>Delete "{item.name}"? This cannot be undone.</span>
          <button id="cred-delete-confirm-yes-{item.id}" class="btn-confirm-delete" on:click={() => confirmDelete(item.id)} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
          <button id="cred-delete-confirm-cancel-{item.id}" class="btn-secondary-sm" on:click={cancelDelete}>Cancel</button>
        </div>
      {/if}
      {#if deleteError && (deletingId === item.id || errorItemId === item.id)}
        <div class="delete-error">{deleteError}</div>
      {/if}
      {#if editingId === item.id}
        <EditCredentialForm
          {item}
          on:credentialUpdated={handleUpdated}
          on:cancelled={handleCancelled}
        />
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
  .btn-edit {
    padding: 2px 10px;
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #ccc);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  }
  .btn-edit:hover {
    background: var(--vscode-button-secondaryHoverBackground, #45494e);
  }
  .btn-delete {
    padding: 2px 10px;
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-errorForeground, #f14c4c);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  }
  .btn-delete:hover {
    background: var(--vscode-button-secondaryHoverBackground, #45494e);
  }
  .btn-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .delete-confirm {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 12px;
    color: var(--vscode-foreground, #ccc);
  }
  .btn-confirm-delete {
    padding: 3px 10px;
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    color: var(--vscode-errorForeground, #f14c4c);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
  }
  .btn-confirm-delete:hover {
    background: var(--vscode-errorForeground, #f14c4c);
    color: #fff;
  }
  .btn-confirm-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary-sm {
    padding: 3px 10px;
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #ccc);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  }
  .btn-secondary-sm:hover {
    background: var(--vscode-button-secondaryHoverBackground, #45494e);
  }
  .delete-error {
    color: var(--vscode-errorForeground, #f14c4c);
    font-size: 12px;
    padding: 4px 0;
  }
</style>
