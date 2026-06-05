<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CredentialListItem, UpdateCredentialArgs, UpdateCredentialResult, CredentialError } from '../../../shared/types/credential';

  export let item: CredentialListItem;

  const dispatch = createEventDispatcher<{
    credentialUpdated: CredentialListItem;
    cancelled: void;
  }>();

  let name = item.name;
  let tokenValue = '';
  let accessKeyId = '';
  let secretAccessKey = '';
  let submitting = false;
  let bannerError = '';
  let fieldErrors: Record<string, string> = {};

  function buildPayload(): UpdateCredentialArgs['payload'] {
    if (item.type === 'aws') {
      return { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() };
    }
    return { value: tokenValue.trim() };
  }

  async function handleSubmit() {
    fieldErrors = {};
    bannerError = '';
    submitting = true;
    try {
      const args: UpdateCredentialArgs = {
        id: item.id,
        name: name.trim(),
        type: item.type,
        payload: buildPayload(),
      };
      const result: UpdateCredentialResult = await window.api.credential.update(args);
      if (result.success) {
        dispatch('credentialUpdated', result.data);
      } else {
        const err: CredentialError = result.error;
        if (err.code === 'ENCRYPTION_UNAVAILABLE') {
          bannerError = err.message;
        } else if (err.field) {
          fieldErrors = { ...fieldErrors, [err.field]: err.message };
        } else {
          bannerError = err.message;
        }
      }
    } catch (e) {
      bannerError = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    dispatch('cancelled');
  }
</script>

<form id="edit-cred-form" class="edit-credential-form" on:submit|preventDefault={handleSubmit}>
  {#if bannerError}
    <div id="edit-cred-error" class="banner-error">{bannerError}</div>
  {/if}

  <div class="form-group">
    <span class="field-label">Type</span>
    <span class="type-readonly">{item.type}</span>
  </div>

  <div class="form-group">
    <label for="edit-cred-name">Name</label>
    <input id="edit-cred-name" type="text" bind:value={name} maxlength="100" />
    {#if fieldErrors['name']}<span class="field-error">{fieldErrors['name']}</span>{/if}
  </div>

  {#if item.type === 'aws'}
    <div class="form-group">
      <label for="edit-cred-value">New Access Key ID</label>
      <input id="edit-cred-value" type="password" bind:value={accessKeyId} placeholder="Enter new Access Key ID" />
      {#if fieldErrors['accessKeyId']}<span class="field-error">{fieldErrors['accessKeyId']}</span>{/if}
    </div>
    <div class="form-group">
      <label for="edit-cred-secret">New Secret Access Key</label>
      <input id="edit-cred-secret" type="password" bind:value={secretAccessKey} placeholder="Enter new Secret Access Key" />
      {#if fieldErrors['secretAccessKey']}<span class="field-error">{fieldErrors['secretAccessKey']}</span>{/if}
    </div>
  {:else}
    <div class="form-group">
      <label for="edit-cred-value">New Token Value</label>
      <input id="edit-cred-value" type="password" bind:value={tokenValue} placeholder="Enter new token value" />
      {#if fieldErrors['value']}<span class="field-error">{fieldErrors['value']}</span>{/if}
    </div>
  {/if}

  <div class="form-actions">
    <button id="edit-cred-cancel" type="button" class="btn-secondary" on:click={handleCancel} disabled={submitting}>
      Cancel
    </button>
    <button id="edit-cred-save" type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : 'Save Changes'}
    </button>
  </div>
</form>

<style>
  .edit-credential-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--vscode-sideBar-background, #1e1e1e);
    border-radius: 6px;
    border: 1px solid var(--vscode-focusBorder, #007fd4);
    margin-top: 8px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  label, .field-label {
    font-size: 12px;
    color: var(--vscode-foreground, #ccc);
    font-weight: 500;
  }
  .type-readonly {
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #888);
    font-family: monospace;
    padding: 4px 0;
  }
  input {
    padding: 6px 8px;
    background: var(--vscode-input-background, #3c3c3c);
    border: 1px solid var(--vscode-input-border, #555);
    color: var(--vscode-input-foreground, #d4d4d4);
    border-radius: 4px;
    font-size: 13px;
  }
  input:focus {
    outline: 1px solid var(--vscode-focusBorder, #007fd4);
  }
  .field-error {
    font-size: 11px;
    color: var(--vscode-inputValidation-errorForeground, #f85149);
  }
  .banner-error {
    padding: 8px 12px;
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
    border-radius: 4px;
    font-size: 12px;
    color: var(--vscode-inputValidation-errorForeground, #f85149);
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
  .btn-primary {
    padding: 6px 14px;
    background: var(--vscode-button-background, #0e639c);
    color: var(--vscode-button-foreground, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground, #1177bb);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-secondary {
    padding: 6px 14px;
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #ccc);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--vscode-button-secondaryHoverBackground, #45494e);
  }
  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
