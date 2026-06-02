<script lang="ts">
  import type { TargetPlatform } from '../../../../shared/types/wizard';
  import {
    setStepValidity,
    toggleTargetPlatform,
    wizardStore,
  } from '../../../store/wizardStore.svelte';

  interface PlatformOption {
    id: TargetPlatform;
    name: string;
    icon: string;
    description: string;
  }

  const platforms: PlatformOption[] = [
    {
      id: 'macos',
      name: 'macOS',
      icon: 'codicon-device-desktop',
      description: 'Build DMG and ZIP packages.',
    },
    {
      id: 'windows',
      name: 'Windows',
      icon: 'codicon-window',
      description: 'Build installer and portable artifacts.',
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: 'codicon-terminal-linux',
      description: 'Build DEB, RPM, and archive packages.',
    },
  ];

  const isStepValid = $derived(
    wizardStore.project.targetPlatforms.length > 0 &&
    (!wizardStore.project.codeSigning.enabled || (
      (!wizardStore.project.targetPlatforms.includes('macos') || wizardStore.project.codeSigning.macCertificateName.trim().length > 0) &&
      (!wizardStore.project.targetPlatforms.includes('windows') || wizardStore.project.codeSigning.windowsCertificatePath.trim().length > 0) &&
      wizardStore.project.codeSigning.certificatePasswordEnvVar.trim().length > 0
    ))
  );

  $effect(() => {
    setStepValidity(4, isStepValid);
  });
</script>

<section class="wizard-step">
  <div class="step-header">
    <span class="eyebrow">CI/CD</span>
    <h2>Choose build targets</h2>
    <p>Select the platforms and signing settings this project should prepare.</p>
  </div>

  <div class="platform-grid">
    {#each platforms as platform (platform.id)}
      <button
        type="button"
        class="platform-card"
        class:selected={wizardStore.project.targetPlatforms.includes(platform.id)}
        onclick={() => toggleTargetPlatform(platform.id)}
      >
        <i class={`codicon ${platform.icon}`}></i>
        <span>
          <strong>{platform.name}</strong>
          <small>{platform.description}</small>
        </span>
        <span class="checkbox">
          <i class="codicon codicon-check"></i>
        </span>
      </button>
    {/each}
  </div>

  <div class="settings-panel">
    <label class="switch-row">
      <span>
        <strong>Enable code signing</strong>
        <small>Prepare signing fields for release automation.</small>
      </span>
      <input type="checkbox" bind:checked={wizardStore.project.codeSigning.enabled} />
    </label>

    {#if wizardStore.project.codeSigning.enabled}
      <div class="form-grid">
        <label class="field">
          <span>Mac certificate name</span>
          <input
            type="text"
            bind:value={wizardStore.project.codeSigning.macCertificateName}
            placeholder="Developer ID Application"
          />
        </label>
        <label class="field">
          <span>Windows certificate path</span>
          <input
            type="text"
            bind:value={wizardStore.project.codeSigning.windowsCertificatePath}
            placeholder="./certs/windows.pfx"
          />
        </label>
        <label class="field wide">
          <span>Password environment variable</span>
          <input
            type="text"
            bind:value={wizardStore.project.codeSigning.certificatePasswordEnvVar}
            placeholder="CSC_KEY_PASSWORD"
          />
        </label>
        <label class="inline-check wide">
          <input type="checkbox" bind:checked={wizardStore.project.codeSigning.notarizeMac} />
          <span>Enable macOS notarization</span>
        </label>
      </div>
    {/if}

    <div class="secondary-options">
      <label>
        <input type="checkbox" bind:checked={wizardStore.project.initializeGit} />
        <span>Initialize Git repository</span>
      </label>
      <label>
        <input type="checkbox" bind:checked={wizardStore.project.installDependencies} />
        <span>Install dependencies after creation</span>
      </label>
    </div>
  </div>
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

  .platform-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .platform-card {
    all: unset;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: flex-start;
    padding: 18px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .platform-card:hover,
  .platform-card:focus-visible {
    border-color: #bfdbfe;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .platform-card.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
  }

  .platform-card :global(.codicon) {
    color: #6366f1;
    font-size: 22px;
  }

  .platform-card span {
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

  .checkbox {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #6366f1;
    opacity: 0;
  }

  .checkbox :global(.codicon) {
    color: #fff;
    font-size: 14px;
  }

  .selected .checkbox {
    opacity: 1;
  }

  .settings-panel {
    display: grid;
    gap: 18px;
    max-width: 860px;
    padding: 20px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
  }

  .switch-row {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .switch-row > span {
    display: grid;
    gap: 6px;
  }

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: #6366f1;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
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

  input[type='text'] {
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

  input[type='text']:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  .inline-check,
  .secondary-options label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }

  .secondary-options {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    border-top: 1px solid #e8eaed;
    padding-top: 18px;
  }

  @media (max-width: 720px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
