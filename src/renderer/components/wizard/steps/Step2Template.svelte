<script lang="ts">
  import type { ProjectTemplateId } from '../../../../shared/types/wizard';
  import { setStepValidity, wizardStore } from '../../../store/wizardStore.svelte';

  interface TemplateOption {
    id: ProjectTemplateId;
    name: string;
    icon: string;
    description: string;
    tags: string[];
    disabled?: boolean;
  }

  const templates: TemplateOption[] = [
    {
      id: 'electron-vanilla',
      name: 'Electron Vanilla',
      icon: 'codicon-window',
      description: 'Plain Electron Forge (webpack) with no UI framework. Full control, minimal setup.',
      tags: ['Default', 'Minimal'],
    },
    {
      id: 'electron-svelte',
      name: 'Electron + Svelte',
      icon: 'codicon-symbol-color',
      description: 'Electron Forge with Svelte renderer. Reactive UI, fast compilation, small bundle.',
      tags: ['Svelte', 'Coming Soon'],
      disabled: true,
    },
    {
      id: 'electron-react',
      name: 'Electron + React',
      icon: 'codicon-symbol-namespace',
      description: 'Electron Forge with React renderer. Familiar ecosystem, broad community support.',
      tags: ['React', 'Coming Soon'],
      disabled: true,
    },
    {
      id: 'risotron',
      name: 'RisoTron',
      icon: 'codicon-layers',
      description: 'Scaffold from the RisoTron framework with auto-update pre-configured.',
      tags: ['RisoTron', 'Coming Soon'],
      disabled: true,
    },
  ];

  $effect(() => {
    // Step is valid if a non-disabled template is selected
    const selected = templates.find((t) => t.id === wizardStore.project.template);
    setStepValidity(2, !!selected && !selected.disabled);
  });
</script>

<section class="wizard-step">
  <div class="step-header">
    <span class="eyebrow">Template</span>
    <h2>Choose a starting point</h2>
    <p>Pick the scaffold that best matches this project.</p>
  </div>

  <div class="template-grid">
    {#each templates as template (template.id)}
      <button
        type="button"
        class="template-card"
        class:selected={wizardStore.project.template === template.id}
        class:disabled={template.disabled}
        onclick={() => { if (!template.disabled) wizardStore.project.template = template.id; }}
        aria-disabled={template.disabled}
      >
        <div class="template-top">
          <span class="template-icon">
            <i class={`codicon ${template.icon}`}></i>
          </span>
          <span class="check">
            <i class="codicon codicon-check"></i>
          </span>
        </div>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <div class="tags">
          {#each template.tags as tag}
            <span class:coming-soon={tag === 'Coming Soon'}>{tag}</span>
          {/each}
        </div>
      </button>
    {/each}
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

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
  }

  .template-card {
    all: unset;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 218px;
    padding: 20px;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }

  .template-card:not(.disabled):hover,
  .template-card:not(.disabled):focus-visible {
    border-color: #bfdbfe;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .template-card:not(.disabled):active {
    transform: scale(0.99);
  }

  .template-card.selected:not(.disabled) {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
  }

  /* Disabled / Coming Soon cards */
  .template-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .template-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .template-icon,
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .template-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: #eef2ff;
    color: #6366f1;
  }

  .template-icon :global(.codicon) {
    font-size: 22px;
  }

  .check {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #6366f1;
    color: #fff;
    opacity: 0;
  }

  .selected:not(.disabled) .check {
    opacity: 1;
  }

  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 16px;
  }

  .template-card p {
    line-height: 1.5;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }

  .tags span {
    padding: 4px 8px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }

  .tags span.coming-soon {
    background: #fef9c3;
    color: #92400e;
  }
</style>
