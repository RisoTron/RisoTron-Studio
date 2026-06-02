<script lang="ts">
  import type { Project } from '../../shared/types/project';

  interface Props {
    project: Project;
    onBack: () => void;
  }

  let { project, onBack }: Props = $props();

  const createdDate = $derived.by(() => {
    try {
      const d = new Date(project.created_at);
      if (Number.isNaN(d.getTime())) return project.created_at;
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return project.created_at;
    }
  });

  const updatedDate = $derived.by(() => {
    try {
      const d = new Date(project.updated_at);
      if (Number.isNaN(d.getTime())) return project.updated_at;
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return project.updated_at;
    }
  });

  const statusLabel = $derived(project.is_archived === 1 ? 'Archived' : 'Active');
  const statusClass = $derived(project.is_archived === 1 ? 'badge-archived' : 'badge-active');
  async function openInIDE() {
    const res = await window.api.os.openInIDE(project.path);
    if (!res?.success) {
      console.error('Failed to open in IDE:', res?.error);
      alert('Could not open project in VS Code: ' + (res?.error || 'Unknown error'));
    }
  }

  async function openInFinder() {
    const res = await window.api.os.showItemInFolder(project.path);
    if (!res?.success) {
      console.error('Failed to open in Finder/Explorer:', res?.error);
      alert('Could not open folder: ' + (res?.error || 'Unknown error'));
    }
  }
</script>

<div class="detail-page">
  <!-- Header -->
  <header class="detail-header">
    <button class="btn-back" type="button" onclick={onBack}>
      <i class="codicon codicon-arrow-left"></i>
      Back to Dashboard
    </button>

    <div class="header-content">
      <div class="header-title-row">
        <h1 class="project-name">{project.name}</h1>
        <span class="badge {statusClass}">{statusLabel}</span>
      </div>
      <p class="project-path">{project.path}</p>
      {#if project.template_id}
        <span class="badge badge-template">{project.template_id}</span>
      {:else}
        <span class="badge badge-none">No template</span>
      {/if}
    </div>
  </header>

  <!-- Quick Actions -->
  <section class="quick-actions">
    <button class="action-btn" type="button" onclick={openInIDE}>
      <i class="codicon codicon-code"></i>
      Open in VS Code
    </button>
    <button class="action-btn" type="button" onclick={openInFinder}>
      <i class="codicon codicon-folder-opened"></i>
      Open in Finder
    </button>
  </section>

  <!-- Detail Card -->
  <section class="detail-card">
    <h2 class="card-section-title">Project Details</h2>

    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">
          <i class="codicon codicon-calendar"></i>
          Created
        </span>
        <span class="detail-value">{createdDate}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">
          <i class="codicon codicon-history"></i>
          Updated
        </span>
        <span class="detail-value">{updatedDate}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">
          <i class="codicon codicon-symbol-enum"></i>
          Status
        </span>
        <span class="badge {statusClass}">{statusLabel}</span>
      </div>

      <div class="detail-item detail-item-full">
        <span class="detail-label">
          <i class="codicon codicon-extensions"></i>
          Providers
        </span>
        <div class="providers-list">
          {#if project.providers.length > 0}
            {#each project.providers as provider}
              <span class="badge badge-provider">{provider}</span>
            {/each}
          {:else}
            <span class="text-muted">No providers configured</span>
          {/if}
        </div>
      </div>

      <div class="detail-item detail-item-full">
        <span class="detail-label">
          <i class="codicon codicon-key"></i>
          Project ID
        </span>
        <code class="project-id">{project.id}</code>
      </div>
    </div>
  </section>
</div>

<style>
  .detail-page {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 32px 48px;
    max-width: 800px;
    margin: 0 auto;
    height: 100vh;
    overflow-y: auto;
    animation: fadeIn 0.35s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .detail-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .btn-back {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--fg-muted, #969696);
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: color 0.15s, background 0.15s;
    align-self: flex-start;
  }

  .btn-back:hover {
    color: var(--fg, #cccccc);
    background: rgba(128, 128, 128, 0.1);
  }

  .btn-back:focus-visible {
    outline: 2px solid var(--vscode-focusBorder, #007fd4);
    outline-offset: 2px;
  }

  .btn-back :global(.codicon) {
    font-size: 14px;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .project-name {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--fg, #cccccc);
    line-height: 1.2;
  }

  .project-path {
    margin: 0;
    font-size: 13px;
    color: var(--fg-muted, #969696);
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    word-break: break-all;
  }

  /* ── Badges ── */
  .badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .badge-active {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }

  .badge-archived {
    background: rgba(128, 128, 128, 0.15);
    color: var(--fg-muted, #969696);
  }

  .badge-template {
    background: var(--vscode-badge-bg, #4d4d4d);
    color: var(--vscode-badge-fg, #ffffff);
  }

  .badge-none {
    background: rgba(128, 128, 128, 0.15);
    color: var(--fg-muted, #969696);
  }

  .badge-provider {
    background: rgba(14, 99, 156, 0.2);
    color: var(--vscode-focusBorder, #007fd4);
  }

  /* ── Quick Actions ── */
  .quick-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-btn {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 8px;
    background: var(--vscode-input-bg, #3c3c3c);
    border: 1px solid var(--border, #3c3c3c);
    color: var(--fg, #cccccc);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
  }

  .action-btn:hover {
    border-color: var(--vscode-focusBorder, #007fd4);
    background: rgba(14, 99, 156, 0.08);
  }

  .action-btn:active {
    transform: scale(0.97);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--vscode-focusBorder, #007fd4);
    outline-offset: 2px;
  }

  .action-btn :global(.codicon) {
    font-size: 16px;
  }

  /* ── Detail Card ── */
  .detail-card {
    background: var(--vscode-input-bg, #3c3c3c);
    border: 1px solid var(--border, #3c3c3c);
    border-radius: 12px;
    padding: 24px;
  }

  .card-section-title {
    margin: 0 0 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--fg, #cccccc);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-item-full {
    grid-column: 1 / -1;
  }

  .detail-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--fg-muted, #969696);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .detail-label :global(.codicon) {
    font-size: 12px;
  }

  .detail-value {
    font-size: 14px;
    color: var(--fg, #cccccc);
  }

  .providers-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .text-muted {
    font-size: 13px;
    color: var(--fg-muted, #969696);
    font-style: italic;
  }

  .project-id {
    font-size: 12px;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    color: var(--fg-muted, #969696);
    background: rgba(128, 128, 128, 0.08);
    padding: 6px 10px;
    border-radius: 6px;
    word-break: break-all;
    user-select: all;
  }

</style>
