<script lang="ts">
  import type { ProjectTemplateId } from '../../../../shared/types/wizard';
  import { setStepValidity, wizardStore } from '../../../store/wizardStore.svelte';

  interface TemplateOption {
    id: ProjectTemplateId;
    name: string;
    icon: string;
    description: string;
    tags: string[];
  }

  const templates: TemplateOption[] = [
    {
      id: 'blank',
      name: 'Blank Project',
      icon: 'codicon-file',
      description: 'A clean workspace with the standard RisoTron project structure.',
      tags: ['Minimal', 'Flexible'],
    },
    {
      id: 'svelte-electron',
      name: 'Svelte + Electron',
      icon: 'codicon-window',
      description: 'Renderer, preload, and main process scaffolding for desktop apps.',
      tags: ['Desktop', 'UI'],
    },
    {
      id: 'desktop-tool',
      name: 'Desktop Tool',
      icon: 'codicon-tools',
      description: 'Menus, settings, local persistence, and release defaults included.',
      tags: ['Utility', 'Release-ready'],
    },
    {
      id: 'creative-suite',
      name: 'Creative Suite',
      icon: 'codicon-symbol-color',
      description: 'Asset folders, preview panes, and export-oriented project defaults.',
      tags: ['Creative', 'Assets'],
    },
  ];

  $effect(() => {
    setStepValidity(2, wizardStore.project.template.trim().length > 0);
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
        onclick={() => (wizardStore.project.template = template.id)}
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
            <span>{tag}</span>
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

  .template-card:hover,
  .template-card:focus-visible {
    border-color: #bfdbfe;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .template-card:active {
    transform: scale(0.99);
  }

  .template-card.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
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

  .selected .check {
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
</style>
