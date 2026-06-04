<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CredentialType, AddCredentialArgs, AddCredentialResult, CredentialError } from '../../../shared/types/credential';

  const dispatch = createEventDispatcher<{ credentialAdded: AddCredentialResult }>();

  let type: CredentialType = 'github-pat';
  let name = '';
  let tokenValue = '';
  let accessKeyId = '';
  let secretAccessKey = '';
  let submitting = false;

  // Clear irrelevant secret fields when type changes to avoid retaining secrets
  $: if (type) {
    if (type !== 'aws') {
      accessKeyId = '';
      secretAccessKey = '';
    } else {
      tokenValue = '';
    }
  }

  let bannerError = '';
  let fieldErrors: Record<string, string> = {};

  function reset() {
    name = '';
    tokenValue = '';
    accessKeyId = '';
    secretAccessKey = '';
    bannerError = '';
    fieldErrors = {};
    submitting = false;
  }

  function buildPayload(): AddCredentialArgs['payload'] {
    if (type === 'aws') {
      return { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() };
    }
    return { value: tokenValue.trim() };
  }

  async function handleSubmit() {
    fieldErrors = {};
    bannerError = '';
    submitting = true;
    try {
      const args: AddCredentialArgs = { name: name.trim(), type, payload: buildPayload() };
      const result = await (window as any).api.credential.add(args);
      if (result.success) {
        dispatch('credentialAdded', result.data);
        reset();
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
</script>

<form class="add-credential-form" on:submit|preventDefault={handleSubmit}>
  {#if bannerError}
    <div class="banner-error">{bannerError}</div>
  {/if}

  <div class="form-group">
    <label for="cred-type">Type</label>
    <select id="cred-type" bind:value={type}>
      <option value="github-pat">GitHub PAT</option>
      <option value="aws">AWS Access Keys</option>
      <option value="generic-token">Generic Token</option>
    </select>
  </div>

  <div class="form-group">
    <label for="cred-name">Name</label>
    <input id="cred-name" type="text" bind:value={name} placeholder="e.g. My GitHub PAT" maxlength="100" />
    {#if fieldErrors['name']}<span class="field-error">{fieldErrors['name']}</span>{/if}
  </div>

  {#if type === 'aws'}
    <div class="form-group">
      <label for="cred-access-key-id">Access Key ID</label>
      <input id="cred-access-key-id" type="text" bind:value={accessKeyId} placeholder="AKIA..." />
      {#if fieldErrors['accessKeyId']}<span class="field-error">{fieldErrors['accessKeyId']}</span>{/if}
    </div>
    <div class="form-group">
      <label for="cred-secret">Secret Access Key</label>
      <input id="cred-secret" type="password" bind:value={secretAccessKey} placeholder="••••••••" />
      {#if fieldErrors['secretAccessKey']}<span class="field-error">{fieldErrors['secretAccessKey']}</span>{/if}
    </div>
  {:else}
    <div class="form-group">
      <label for="cred-token">Token Value</label>
      <input id="cred-token" type="password" bind:value={tokenValue} placeholder="••••••••" />
      {#if fieldErrors['value']}<span class="field-error">{fieldErrors['value']}</span>{/if}
    </div>
  {/if}

  <div class="form-actions">
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : 'Save Credential'}
    </button>
  </div>
</form>

<style>
  .add-credential-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--vscode-sideBar-background, #1e1e1e);
    border-radius: 6px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  label {
    font-size: 12px;
    color: var(--vscode-foreground, #ccc);
    font-weight: 500;
  }
  input, select {
    padding: 6px 8px;
    background: var(--vscode-input-background, #3c3c3c);
    border: 1px solid var(--vscode-input-border, #555);
    color: var(--vscode-input-foreground, #d4d4d4);
    border-radius: 4px;
    font-size: 13px;
  }
  input:focus, select:focus {
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
</style>
