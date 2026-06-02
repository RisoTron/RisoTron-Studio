<script lang="ts">
  import { setStepValidity, wizardStore } from '../../../store/wizardStore.svelte';

  const isStepValid = $derived(
    wizardStore.project.name.trim().length > 0 &&
    wizardStore.project.path.trim().length > 0 &&
    (wizardStore.project.path.trim().startsWith('/') || /^[a-zA-Z]:\\/.test(wizardStore.project.path.trim())) &&
    !wizardStore.project.path.includes('..')
  );

  $effect(() => {
    setStepValidity(1, isStepValid);
  });
</script>

<section class="wizard-step">
  <div class="step-header">
    <span class="eyebrow">Project details</span>
    <h2>Name the workspace</h2>
    <p>Set the project identity and local destination.</p>
  </div>

  <div class="form-grid">
    <label class="field">
      <span>Name</span>
      <input
        type="text"
        bind:value={wizardStore.project.name}
        placeholder="My RisoTron Project"
        autocomplete="off"
      />
    </label>

    <label class="field">
      <span>Author</span>
      <input
        type="text"
        bind:value={wizardStore.project.author}
        placeholder="Studio or maintainer name"
        autocomplete="off"
      />
    </label>

    <label class="field wide">
      <span>Project path</span>
      <input
        type="text"
        bind:value={wizardStore.project.path}
        placeholder="/Users/name/Projects/my-risotron-project"
        autocomplete="off"
      />
    </label>

    <label class="field wide">
      <span>Description</span>
      <textarea
        bind:value={wizardStore.project.description}
        placeholder="Short summary for dashboards and release notes"
        rows="5"
      ></textarea>
    </label>
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    max-width: 820px;
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

  input,
  textarea {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #1e293b;
    font: inherit;
    font-weight: 400;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  textarea {
    resize: vertical;
    min-height: 118px;
  }

  input:focus,
  textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  @media (max-width: 720px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
