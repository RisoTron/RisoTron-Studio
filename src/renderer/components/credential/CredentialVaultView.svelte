<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import AddCredentialForm from './AddCredentialForm.svelte';
  import CredentialList from './CredentialList.svelte';
  import type { AddCredentialResult, CredentialListItem } from '../../../shared/types/credential';

  let showForm = false;
  let successMessage = '';
  let successTimer: ReturnType<typeof setTimeout> | null = null;
  let credentials: CredentialListItem[] = [];
  let listLoading = false;
  let listError = '';

  async function loadCredentials() {
    listLoading = true;
    listError = '';
    try {
      const result = await window.api.credential.list();
      if (result.success) {
        credentials = result.data;
      } else {
        listError = result.error?.message ?? 'Failed to load credentials.';
      }
    } catch (err) {
      listError = 'Unexpected error loading credentials.';
    } finally {
      listLoading = false;
    }
  }

  function handleCredentialAdded(event: CustomEvent<AddCredentialResult>) {
    showForm = false;
    successMessage = `Credential "${event.detail.name}" saved successfully.`;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => (successMessage = ''), 4000);
    loadCredentials();
  }

  onMount(() => {
    loadCredentials();
  });

  onDestroy(() => {
    if (successTimer) clearTimeout(successTimer);
  });
</script>

<div class="credential-vault-view">
  <div class="vault-header">
    <h2>Credential Vault</h2>
    <button class="btn-add" on:click={() => { showForm = !showForm; successMessage = ''; }}>
      {showForm ? 'Cancel' : '+ Add Credential'}
    </button>
  </div>

  {#if successMessage}
    <div class="success-banner">{successMessage}</div>
  {/if}

  {#if showForm}
    <AddCredentialForm on:credentialAdded={handleCredentialAdded} />
  {/if}

  {#if listLoading}
    <div class="list-status">Loading credentials…</div>
  {:else if listError}
    <div class="list-error">{listError}</div>
  {:else if credentials.length === 0}
    <div id="cred-list-empty" class="empty-state">
      <p>No credentials yet.</p>
      <button id="cred-list-add-first" class="btn-add-first" on:click={() => { showForm = true; }}>
        Add your first credential
      </button>
    </div>
  {:else}
    <CredentialList items={credentials} />
  {/if}
</div>

<style>
  .credential-vault-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }
  .vault-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground, #ccc);
  }
  .btn-add {
    padding: 5px 12px;
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
  .success-banner {
    padding: 8px 12px;
    background: var(--vscode-testing-passBadgeBackground, #388a34);
    color: var(--vscode-testing-passBadgeForeground, #fff);
    border-radius: 4px;
    font-size: 12px;
  }
  .list-status {
    color: var(--vscode-descriptionForeground, #888);
    font-size: 13px;
    text-align: center;
    margin-top: 40px;
  }
  .list-error {
    color: var(--vscode-errorForeground, #f14c4c);
    font-size: 13px;
    padding: 8px 12px;
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border-radius: 4px;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 60px;
    color: var(--vscode-descriptionForeground, #888);
    font-size: 13px;
  }
  .btn-add-first {
    padding: 6px 16px;
    background: var(--vscode-button-background, #0e639c);
    color: var(--vscode-button-foreground, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  .btn-add-first:hover {
    background: var(--vscode-button-hoverBackground, #1177bb);
  }
</style>
