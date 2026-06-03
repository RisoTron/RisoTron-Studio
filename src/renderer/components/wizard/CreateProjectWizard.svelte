<script lang="ts">
  import { onDestroy } from 'svelte';
  import { wizardStore } from '../../store/wizardStore.svelte';
  import Step1Info from './steps/Step1Info.svelte';
  import Step2Template from './steps/Step2Template.svelte';
  import Step3Release from './steps/Step3Release.svelte';
  import Step4CICD from './steps/Step4CICD.svelte';
  import Step5Review from './steps/Step5Review.svelte';
  import type { PipelineProgress } from '../../../shared/types/pipeline';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  let isSubmitting = $state(false);
  let errorMsg = $state<string | null>(null);
  let scaffoldProgress = $state<PipelineProgress | null>(null);
  let scaffoldPct = $derived(scaffoldProgress && scaffoldProgress.totalStages > 0
    ? Math.round((scaffoldProgress.stageIndex / scaffoldProgress.totalStages) * 100)
    : 0);

  let cleanupProgress: (() => void) | undefined;

  const stepLabels = [
    'Project Info',
    'Template',
    'Release',
    'CI/CD',
    'Review',
  ];

  const totalSteps = stepLabels.length;

  const isLastStep = $derived(wizardStore.currentStep === totalSteps);
  const isFirstStep = $derived(wizardStore.currentStep === 1);

  function handleBack() {
    if (!isFirstStep) {
      wizardStore.currentStep--;
    }
  }

  async function handleNext() {
    if (isLastStep) {
      if (isSubmitting) return;
      isSubmitting = true;
      errorMsg = null;
      scaffoldProgress = null;
      try {
        // Subscribe to progress before kicking off the create call.
        if (cleanupProgress) cleanupProgress();
        cleanupProgress = window.api.project.onScaffoldProgress((progress: PipelineProgress) => {
          scaffoldProgress = progress;
        });

        const payload = wizardStore.submit();
        const ipcPayload = {
          name: payload.name,
          path: payload.path,
          template_id: payload.template,
          providers: payload.releaseProvider !== 'none' ? [payload.releaseProvider] : []
        };
        const res = await window.api.project.create(ipcPayload);
        if (!res.success) {
          console.error('Failed to create project:', res.error);
          errorMsg = res.error || 'Failed to create project.';
          return;
        }
        await new Promise(r => setTimeout(r, 600));
        wizardStore.reset();
        onClose();
      } catch (err) {
        console.error('Error creating project:', err);
        errorMsg = err instanceof Error ? err.message : String(err);
      } finally {
        isSubmitting = false;
        if (cleanupProgress) {
          cleanupProgress();
          cleanupProgress = undefined;
        }
      }
    } else {
      wizardStore.currentStep++;
    }
  }

  function handleCancel() {
    wizardStore.reset();
    onClose();
  }

  function handleStepClick(step: number) {
    // Allow clicking only on completed or current steps
    if (step <= wizardStore.currentStep) {
      wizardStore.currentStep = step;
    }
  }

  onDestroy(() => {
    if (cleanupProgress) {
      cleanupProgress();
      cleanupProgress = undefined;
    }
  });
</script>

<div class="wizard-shell">
  <!-- ── Header ── -->
  <header class="wizard-header">
    <div class="wizard-header-left">
      <button class="wizard-close" onclick={handleCancel} title="Close wizard">
        <i class="codicon codicon-close"></i>
      </button>
      <h1 class="wizard-title">Create New Project</h1>
    </div>
  </header>

  <!-- ── Step Indicator ── -->
  <nav class="step-indicator" aria-label="Wizard progress">
    {#each stepLabels as label, i}
      {@const stepNum = i + 1}
      {@const isCurrent = wizardStore.currentStep === stepNum}
      {@const isCompleted = wizardStore.currentStep > stepNum}
      {@const isClickable = stepNum <= wizardStore.currentStep}

      {#if i > 0}
        <div class="step-connector" class:step-connector-active={isCompleted}></div>
      {/if}

      <button
        class="step-node"
        class:step-current={isCurrent}
        class:step-completed={isCompleted}
        disabled={!isClickable}
        onclick={() => handleStepClick(stepNum)}
        aria-current={isCurrent ? 'step' : undefined}
        title={label}
      >
        <span class="step-circle">
          {#if isCompleted}
            <i class="codicon codicon-check"></i>
          {:else}
            {stepNum}
          {/if}
        </span>
        <span class="step-label">{label}</span>
      </button>
    {/each}
  </nav>

  <!-- ── Step Content ── -->
  <div class="wizard-content">
    {#if isSubmitting && scaffoldProgress}
      <div class="scaffold-progress">
        <div class="scaffold-progress-icon">
          {#if scaffoldProgress.currentStageName === 'Done'}
            <i class="codicon codicon-check"></i>
          {:else}
            <i class="codicon codicon-loading codicon-modifier-spin"></i>
          {/if}
        </div>
        <p class="scaffold-progress-stage">{scaffoldProgress.currentStageName}</p>
        <div class="scaffold-progress-bar-track">
          <div
            class="scaffold-progress-bar-fill"
            style="width: {scaffoldPct}%"
          ></div>
        </div>
        <p class="scaffold-progress-pct">
          {scaffoldPct}%
        </p>
      </div>
    {:else if isSubmitting}
      <div class="scaffold-progress">
        <div class="scaffold-progress-icon">
          <i class="codicon codicon-loading codicon-modifier-spin"></i>
        </div>
        <p class="scaffold-progress-stage">Preparing...</p>
      </div>
    {:else if wizardStore.currentStep === 1}
      <Step1Info />
    {:else if wizardStore.currentStep === 2}
      <Step2Template />
    {:else if wizardStore.currentStep === 3}
      <Step3Release />
    {:else if wizardStore.currentStep === 4}
      <Step4CICD />
    {:else if wizardStore.currentStep === 5}
      <Step5Review />
    {/if}
  </div>

  {#if errorMsg}
    <div class="wizard-error">
      <i class="codicon codicon-error"></i>
      <span>{errorMsg}</span>
    </div>
  {/if}

  <!-- ── Bottom Navigation ── -->
  <footer class="wizard-footer">
    <button class="btn-ghost" onclick={handleCancel}>
      Cancel
    </button>
    <div class="wizard-footer-right">
      <button class="btn-outline" onclick={handleBack} disabled={isFirstStep}>
        <i class="codicon codicon-arrow-left"></i>
        Back
      </button>
      <button
        class="btn-primary"
        onclick={handleNext}
        disabled={!wizardStore.isCurrentStepValid || isSubmitting}
      >
        {#if isLastStep}
          <i class="codicon codicon-check"></i>
          Create Project
        {:else}
          Next
          <i class="codicon codicon-arrow-right"></i>
        {/if}
      </button>
    </div>
  </footer>
</div>

<style>
  /* ── Shell ── */
  .wizard-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8fafc;
    overflow: hidden;
  }

  /* ── Header ── */
  .wizard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 54px;
    background: #ffffff;
    border-bottom: 1px solid #e8eaed;
    flex-shrink: 0;
  }

  .wizard-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wizard-close {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .wizard-close:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .wizard-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.01em;
  }

  /* ── Step Indicator ── */
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 24px 48px 20px;
    flex-shrink: 0;
  }

  .step-connector {
    flex: 0 0 48px;
    height: 2px;
    background: #e2e8f0;
    border-radius: 1px;
    transition: background 0.3s ease;
  }

  .step-connector-active {
    background: linear-gradient(90deg, #3b82f6, #6366f1);
  }

  .step-node {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    opacity: 0.45;
    transition: opacity 0.2s ease;
  }

  .step-node:not(:disabled) {
    opacity: 0.65;
  }

  .step-node:not(:disabled):hover {
    opacity: 1;
  }

  .step-current {
    opacity: 1 !important;
  }

  .step-completed {
    opacity: 0.85 !important;
  }

  .step-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.25s ease;
  }

  .step-current .step-circle {
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  }

  .step-completed .step-circle {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
  }

  .step-completed .step-circle :global(.codicon) {
    font-size: 14px;
  }

  .step-label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  .step-current .step-label {
    color: #3b82f6;
  }

  .step-completed .step-label {
    color: #10b981;
  }

  /* ── Content ── */
  .wizard-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 48px 32px;
    display: flex;
    flex-direction: column;
  }

  /* ── Footer ── */
  .wizard-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #ffffff;
    border-top: 1px solid #e8eaed;
    flex-shrink: 0;
  }

  .wizard-footer-right {
    display: flex;
    gap: 10px;
  }

  .wizard-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #fef2f2;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
    border-top: 1px solid #fee2e2;
  }

  /* ── Buttons ── */
  .btn-primary {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s, transform 0.1s;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.92;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  }

  .btn-primary:active:not(:disabled) {
    transform: scale(0.97);
  }

  .btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  .btn-outline {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  .btn-outline:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-ghost {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
  }

  .btn-ghost:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  /* ── Scaffold Progress ── */
  .scaffold-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex: 1;
    padding: 48px 0;
  }

  .scaffold-progress-icon {
    font-size: 32px;
    color: #3b82f6;
  }

  .scaffold-progress-icon :global(.codicon-check) {
    color: #10b981;
  }

  .scaffold-progress-stage {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .scaffold-progress-bar-track {
    width: 320px;
    max-width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
  }

  .scaffold-progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #6366f1);
    border-radius: 3px;
    transition: width 0.35s ease;
  }

  .scaffold-progress-pct {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    margin: 0;
  }
</style>
