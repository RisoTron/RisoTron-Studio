<script lang="ts">
  import { wizardStore } from '../../../store/wizardStore.svelte';

  const templateLabel = $derived(
    {
      blank: 'Blank Project',
      'svelte-electron': 'Svelte + Electron',
      'desktop-tool': 'Desktop Tool',
      'creative-suite': 'Creative Suite',
    }[wizardStore.project.template]
  );

  const releaseProviderLabel = $derived(
    {
      none: 'None',
      github: 'GitHub Releases',
      s3: 'Amazon S3',
    }[wizardStore.project.releaseProvider]
  );

  const platformsLabel = $derived(
    wizardStore.project.targetPlatforms.length > 0
      ? wizardStore.project.targetPlatforms.join(', ')
      : 'No platforms selected'
  );

</script>

<section class="wizard-step">
  <div class="step-header">
    <span class="eyebrow">Review</span>
    <h2>Confirm project setup</h2>
    <p>Review the choices before creating the project.</p>
  </div>

  <div class="summary-grid">
    <article class="summary-card">
      <h3>Project</h3>
      <dl>
        <div>
          <dt>Name</dt>
          <dd>{wizardStore.project.name || 'Untitled project'}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{wizardStore.project.path || 'Not set'}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{wizardStore.project.author || 'Not set'}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{wizardStore.project.description || 'No description'}</dd>
        </div>
      </dl>
    </article>

    <article class="summary-card">
      <h3>Template</h3>
      <dl>
        <div>
          <dt>Selected template</dt>
          <dd>{templateLabel}</dd>
        </div>
      </dl>
    </article>

    <article class="summary-card">
      <h3>Release</h3>
      <dl>
        <div>
          <dt>Provider</dt>
          <dd>{releaseProviderLabel}</dd>
        </div>
        {#if wizardStore.project.releaseProvider === 'github'}
          <div>
            <dt>Repository</dt>
            <dd>{wizardStore.project.github.owner}/{wizardStore.project.github.repository}</dd>
          </div>
          <div>
            <dt>Token</dt>
            <dd>{wizardStore.project.github.tokenEnvVar}</dd>
          </div>
        {:else if wizardStore.project.releaseProvider === 's3'}
          <div>
            <dt>Bucket</dt>
            <dd>{wizardStore.project.s3.bucket}</dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>{wizardStore.project.s3.region}</dd>
          </div>
          <div>
            <dt>Prefix</dt>
            <dd>{wizardStore.project.s3.prefix || 'No prefix'}</dd>
          </div>
        {/if}
      </dl>
    </article>

    <article class="summary-card">
      <h3>Builds</h3>
      <dl>
        <div>
          <dt>Platforms</dt>
          <dd>{platformsLabel}</dd>
        </div>
        <div>
          <dt>Code signing</dt>
          <dd>{wizardStore.project.codeSigning.enabled ? 'Enabled' : 'Disabled'}</dd>
        </div>
        {#if wizardStore.project.codeSigning.enabled}
          <div>
            <dt>macOS notarization</dt>
            <dd>{wizardStore.project.codeSigning.notarizeMac ? 'Enabled' : 'Disabled'}</dd>
          </div>
        {/if}
        <div>
          <dt>Git</dt>
          <dd>{wizardStore.project.initializeGit ? 'Initialize repository' : 'Skip initialization'}</dd>
        </div>
        <div>
          <dt>Dependencies</dt>
          <dd>{wizardStore.project.installDependencies ? 'Install after creation' : 'Skip install'}</dd>
        </div>
      </dl>
    </article>
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

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .summary-card {
    padding: 20px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
  }

  h3 {
    margin: 0 0 16px;
    color: #1e293b;
    font-size: 16px;
  }

  dl {
    display: grid;
    gap: 14px;
    margin: 0;
  }

  dl div {
    display: grid;
    gap: 4px;
  }

  dt {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    color: #1e293b;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  @media (max-width: 860px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
