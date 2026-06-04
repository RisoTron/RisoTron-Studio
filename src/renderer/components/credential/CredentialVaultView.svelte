<script lang="ts">
  import AddCredentialForm from './AddCredentialForm.svelte';
  import type { AddCredentialResult } from '../../../shared/types/credential';

  let showForm = false;
  let successMessage = '';

  function handleCredentialAdded(event: CustomEvent<AddCredentialResult>) {
    showForm = false;
    successMessage = `Credential "${event.detail.name}" saved successfully.`;
    setTimeout(() => (successMessage = ''), 4000);
  }
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

  <div class="credential-list-placeholder">
    <p>Saved credentials will appear here.</p>
  </div>
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
  .credential-list-placeholder {
    color: var(--vscode-descriptionForeground, #888);
    font-size: 13px;
    text-align: center;
    margin-top: 40px;
  }
</style>
