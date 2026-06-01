<script lang="ts">
  import type { Project } from '../../shared/types/project';

  let { project }: { project: Project } = $props();

  const PALETTE = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#a855f7', '#e11d48',
  ];

  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  function getInitials(name: string): string {
    return name
      .split(/[\s_-]+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    } catch {
      return iso;
    }
  }

  const color = $derived(PALETTE[hashCode(project.name) % PALETTE.length]);
  const initials = $derived(getInitials(project.name));
  const templateLabel = $derived(project.template_id ?? 'No template');
  const createdFormatted = $derived(formatDate(project.created_at));
  const updatedFormatted = $derived(formatDate(project.updated_at));
</script>

<button class="card" type="button">
  <div class="card-header">
    <div class="avatar" style:background={color}>
      <span class="avatar-text">{initials}</span>
    </div>
    <span class="badge" class:badge-none={!project.template_id}>
      {templateLabel}
    </span>
  </div>

  <div class="card-body">
    <h3 class="card-title">{project.name}</h3>
    <p class="card-path" title={project.path}>{project.path}</p>
  </div>

  <div class="card-footer">
    <span class="date-item">
      <i class="codicon codicon-calendar"></i>
      Created {createdFormatted}
    </span>
    <span class="date-item">
      <i class="codicon codicon-history"></i>
      Updated {updatedFormatted}
    </span>
  </div>
</button>

<style>
  .card {
    all: unset;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
  }

  .card:hover {
    border-color: #cbd0d8;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .card:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .card:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .avatar-text {
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.5px;
  }

  .badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: #eef2ff;
    color: #6366f1;
    white-space: nowrap;
  }

  .badge-none {
    background: #f3f4f6;
    color: #9ca3af;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .card-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-path {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f1f5f9;
    padding-top: 12px;
    margin-top: auto;
  }

  .date-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #94a3b8;
  }

  .date-item :global(.codicon) {
    font-size: 12px;
  }
</style>
