<script lang="ts">
  import { onMount } from 'svelte';
  import type { ReleaseProvider } from '../../../../shared/types/wizard';
  import type { ReleaseServer } from '../../../../shared/types/release-server';
  import { PROVIDER_TYPES } from '../../../../shared/constants/providers';
  import { setStepValidity, wizardStore } from '../../../store/wizardStore.svelte';

  type ExtendedProvider = ReleaseProvider | 'saved';

  interface ProviderOption {
    id: ExtendedProvider;
    name: string;
    icon: string;
    description: string;
  }

  const providers: ProviderOption[] = [
    {
      id: 'saved',
      name: 'Saved Server',
      icon: 'codicon-server-environment',
      description: 'Pick a pre-configured release server.',
    },
    {
      id: 'github',
      name: 'GitHub Releases',
      icon: 'codicon-github',
      description: 'Publish builds and release notes to a repository.',
    },
    {
      id: 's3',
      name: 'Amazon S3',
      icon: 'codicon-cloud-upload',
      description: 'Upload generated artifacts to an S3 bucket.',
    },
    {
      id: 'none',
      name: 'Configure later',
      icon: 'codicon-circle-slash',
      description: 'Create the project without release publishing.',
    },
  ];

  let selectedMode: ExtendedProvider = $state(wizardStore.project.releaseServerId ? 'saved' : (wizardStore.project.releaseProvider ?? 'none'));
  let savedServers: ReleaseServer[] = $state([]);
  let loadingServers = $state(true);

  onMount(async () => {
    try {
      const result = await window.api.releaseServer.list();
      if (result.success) {
        savedServers = result.data;
      }
    } catch (e) {
      console.error('Failed to load release servers', e);
    } finally {
      loadingServers = false;
    }
  });

  function selectMode(mode: ExtendedProvider) {
    selectedMode = mode;
    if (mode === 'saved') {
      wizardStore.project.releaseProvider = 'none';
    } else {
      wizardStore.project.releaseProvider = mode;
      wizardStore.project.releaseServerId = undefined;
    }
  }

  function selectSavedServer(serverId: number) {
    wizardStore.project.releaseServerId = serverId;
  }

  const isStepValid = $derived(
    selectedMode === 'none' ||
      (selectedMode === 'saved' && wizardStore.project.releaseServerId != null) ||
      (selectedMode === 'github' &&
        /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(wizardStore.project.github.owner.trim()) &&
        /^[a-zA-Z0-9_.-]+$/.test(wizardStore.project.github.repository.trim()) &&
        wizardStore.project.github.tokenEnvVar.trim().length > 0) ||
      (selectedMode === 's3' &&
        /^[a-z0-9.-]{3,63}$/.test(wizardStore.project.s3.bucket.trim()) &&
        /^[a-z0-9-]+$/.test(wizardStore.project.s3.region.trim()))
  );

  $effect(() => {
    setStepValidity(3, isStepValid);
  });
</script>

<section class="wizard-step">
  <div class="step-header">
    <span class="eyebrow">Release</span>
    <h2>Set up publishing</h2>
    <p>Choose where packaged builds should be sent.</p>
  </div>

  <div class="provider-grid">
    {#each providers as provider (provider.id)}
      <button
        type="button"
        class="provider-card"
        class:selected={selectedMode === provider.id}
        onclick={() => selectMode(provider.id)}
      >
        <i class={`codicon ${provider.icon}`}></i>
        <span>
          <strong>{provider.name}</strong>
          <small>{provider.description}</small>
        </span>
      </button>
    {/each}
  </div>

  {#if selectedMode === 'saved'}
    <div class="config-panel">
      {#if loadingServers}
        <p class="hint wide">Loading saved servers…</p>
      {:else if savedServers.length === 0}
        <p class="hint wide">No saved servers yet. Add one from the Release Servers view first, or choose a manual option above.</p>
      {:else}
        <div class="server-picker wide">
          {#each savedServers as server (server.id)}
            <button
              type="button"
              class="server-option"
              class:selected={wizardStore.project.releaseServerId === server.id}
              onclick={() => selectSavedServer(server.id)}
            >
              <i class={`codicon ${PROVIDER_TYPES[server.provider_type]?.icon ?? 'codicon-server'}`}></i>
              <div class="server-option-info">
                <strong>{server.name}</strong>
                <small>{PROVIDER_TYPES[server.provider_type]?.label ?? server.provider_type} · {server.credential_name}</small>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else if selectedMode === 'github'}
    <div class="config-panel">
      <label class="field">
        <span>Owner</span>
        <input type="text" bind:value={wizardStore.project.github.owner} placeholder="organization" />
      </label>
      <label class="field">
        <span>Repository</span>
        <input type="text" bind:value={wizardStore.project.github.repository} placeholder="repository" />
      </label>
      <label class="field wide">
        <span>Token environment variable</span>
        <input type="text" bind:value={wizardStore.project.github.tokenEnvVar} placeholder="GITHUB_TOKEN" />
      </label>
    </div>
  {:else if selectedMode === 's3'}
    <div class="config-panel">
      <label class="field">
        <span>Bucket</span>
        <input type="text" bind:value={wizardStore.project.s3.bucket} placeholder="release-artifacts" />
      </label>
      <label class="field">
        <span>Region</span>
        <input type="text" bind:value={wizardStore.project.s3.region} placeholder="us-east-1" />
      </label>
      <label class="field wide">
        <span>Prefix</span>
        <input type="text" bind:value={wizardStore.project.s3.prefix} placeholder="apps/risotron" />
      </label>
    </div>
  {/if}
</section>

<style>
  .wizard-step {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .step-header {
    display: grid;
    gap: 8px;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6366f1;
  }

  h2 {
    margin: 0;
    font-size: 28px;
    color: #1e293b;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }

  .provider-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .provider-card {
    all: unset;
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 18px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .provider-card:hover,
  .provider-card:focus-visible {
    border-color: #bfdbfe;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .provider-card.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
  }

  .provider-card :global(.codicon) {
    color: #6366f1;
    font-size: 22px;
  }

  .provider-card span {
    display: grid;
    gap: 6px;
  }

  strong {
    color: #1e293b;
    font-size: 14px;
  }

  small {
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }

  .config-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    max-width: 820px;
    padding: 20px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
  }

  .field {
    display: grid;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .wide {
    grid-column: 1 / -1;
  }

  .hint {
    color: #64748b;
    font-size: 13px;
    font-style: italic;
  }

  input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #1e293b;
    font: inherit;
    font-weight: 400;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  .server-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .server-option {
    all: unset;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .server-option:hover {
    border-color: #bfdbfe;
    background: #f8fafc;
  }

  .server-option.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
    background: #f5f3ff;
  }

  .server-option :global(.codicon) {
    color: #6366f1;
    font-size: 18px;
    flex-shrink: 0;
  }

  .server-option-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .server-option-info strong {
    font-size: 13px;
    color: #1e293b;
  }

  .server-option-info small {
    font-size: 12px;
    color: #64748b;
  }

  @media (max-width: 720px) {
    .config-panel {
      grid-template-columns: 1fr;
    }
  }
</style>
