<script lang="ts">
  import { onMount } from 'svelte';
  import { PROVIDER_TYPES, PROVIDER_TYPE_KEYS } from '../../../shared/constants/providers';
  import type { ProviderTypeKey } from '../../../shared/constants/providers';
  import type { AddReleaseServerArgs, ReleaseServer, ReleaseServerError } from '../../../shared/types/release-server';
  import type { CredentialListItem } from '../../../shared/types/credential';

  interface Props {
    onServerAdded?: (server: ReleaseServer) => void;
  }

  let { onServerAdded }: Props = $props();

  let providerType: ProviderTypeKey = $state('github-releases');
  let name = $state('');
  let credentialId: number | null = $state(null);
  let configValues: Record<string, string> = $state({});
  let submitting = $state(false);
  let bannerError = $state('');
  let fieldErrors: Record<string, string> = $state({});

  let credentials: CredentialListItem[] = $state([]);
  let loadingCredentials = $state(true);

  const providerDef = $derived(PROVIDER_TYPES[providerType]);
  const requiredCredType = $derived(providerDef.requiredCredential);
  const filteredCredentials = $derived(
    credentials.filter((c) => c.type === requiredCredType)
  );

  onMount(() => {
    loadCredentials();
  });

  $effect(() => {
    // Reset credential and config when provider changes
    if (providerType) {
      credentialId = null;
      configValues = {};
      fieldErrors = {};
      bannerError = '';
    }
  });

  async function loadCredentials() {
    loadingCredentials = true;
    try {
      const result = await window.api.credential.list();
      if (result.success) {
        credentials = result.data;
      }
    } catch (e) {
      console.error('Failed to load credentials', e);
    } finally {
      loadingCredentials = false;
    }
  }

  function reset() {
    name = '';
    credentialId = null;
    configValues = {};
    bannerError = '';
    fieldErrors = {};
    submitting = false;
  }

  async function handleSubmit() {
    fieldErrors = {};
    bannerError = '';
    submitting = true;

    if (!credentialId) {
      fieldErrors = { credential_id: 'Please select a credential' };
      submitting = false;
      return;
    }

    try {
      const args: AddReleaseServerArgs = {
        name: name.trim(),
        provider_type: providerType,
        credential_id: credentialId,
        config: { ...configValues },
      };
      const result = await window.api.releaseServer.add(args);
      if (result.success) {
        onServerAdded?.(result.data);
        reset();
      } else {
        const err: ReleaseServerError = result.error;
        if (err.field) {
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

<form class="release-server-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  {#if bannerError}
    <div class="banner-error">{bannerError}</div>
  {/if}

  <div class="form-group">
    <label for="rs-provider">Provider Type</label>
    <select id="rs-provider" bind:value={providerType}>
      {#each PROVIDER_TYPE_KEYS as key (key)}
        <option value={key}>{PROVIDER_TYPES[key].label}</option>
      {/each}
    </select>
  </div>

  <div class="form-group">
    <label for="rs-name">Server Name</label>
    <input id="rs-name" type="text" bind:value={name} placeholder="e.g. Production GitHub" maxlength={100} />
    {#if fieldErrors['name']}<span class="field-error">{fieldErrors['name']}</span>{/if}
  </div>

  <div class="form-group">
    <label for="rs-credential">Credential ({providerDef.requiredCredential})</label>
    {#if loadingCredentials}
      <span class="hint">Loading…</span>
    {:else if filteredCredentials.length === 0}
      <span class="hint">No {providerDef.requiredCredential} credentials found. Add one in Credential Vault first.</span>
    {:else}
      <select id="rs-credential" bind:value={credentialId}>
        <option value={null}>— Select credential —</option>
        {#each filteredCredentials as cred (cred.id)}
          <option value={cred.id}>{cred.name} ({cred.masked})</option>
        {/each}
      </select>
    {/if}
    {#if fieldErrors['credential_id']}<span class="field-error">{fieldErrors['credential_id']}</span>{/if}
  </div>

  {#each providerDef.configFields as field (field.key)}
    <div class="form-group">
      <label for="rs-cfg-{field.key}">{field.label}</label>
      <input
        id="rs-cfg-{field.key}"
        type="text"
        value={configValues[field.key] ?? ''}
        oninput={(e) => { configValues = { ...configValues, [field.key]: (e.target as HTMLInputElement).value }; }}
        placeholder={field.placeholder}
      />
      {#if fieldErrors[field.key]}<span class="field-error">{fieldErrors[field.key]}</span>{/if}
    </div>
  {/each}

  <div class="form-actions">
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : 'Add Release Server'}
    </button>
  </div>
</form>

<style>
  .release-server-form {
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
  .hint {
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #888);
    font-style: italic;
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
