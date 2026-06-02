<script lang="ts">
  import type { ReleaseProvider } from '../../../../shared/types/wizard';
  import { setStepValidity, wizardStore } from '../../../store/wizardStore.svelte';

  interface ProviderOption {
    id: ReleaseProvider;
    name: string;
    icon: string;
    description: string;
  }

  const providers: ProviderOption[] = [
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

  const isStepValid = $derived(
    wizardStore.project.releaseProvider === 'none' ||
      (wizardStore.project.releaseProvider === 'github' &&
        /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(wizardStore.project.github.owner.trim()) &&
        /^[a-zA-Z0-9_.-]+$/.test(wizardStore.project.github.repository.trim()) &&
        wizardStore.project.github.tokenEnvVar.trim().length > 0) ||
      (wizardStore.project.releaseProvider === 's3' &&
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
        class:selected={wizardStore.project.releaseProvider === provider.id}
        onclick={() => (wizardStore.project.releaseProvider = provider.id)}
      >
        <i class={`codicon ${provider.icon}`}></i>
        <span>
          <strong>{provider.name}</strong>
          <small>{provider.description}</small>
        </span>
      </button>
    {/each}
  </div>

  {#if wizardStore.project.releaseProvider === 'github'}
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
  {:else if wizardStore.project.releaseProvider === 's3'}
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

  @media (max-width: 720px) {
    .config-panel {
      grid-template-columns: 1fr;
    }
  }
</style>
