<script lang="ts">
  import { onMount } from 'svelte';
  import type { Project } from '../../shared/types/project';
  import ProjectCard from './ProjectCard.svelte';

  let projects: Project[] = $state([]);
  let loading: boolean = $state(true);
  let error: string | null = $state(null);
  let activeTab: 'projects' | 'release' = $state('projects');
  let viewMode: 'grid' | 'list' = $state('grid');

  onMount(() => {
    fetchProjects();
  });

  async function fetchProjects() {
    loading = true;
    error = null;
    try {
      if (window.api?.project?.list) {
        projects = await window.api.project.list(false);
      } else {
        projects = [];
      }
    } catch (e: any) {
      error = e?.message ?? 'Failed to load projects';
      projects = [];
    } finally {
      loading = false;
    }
  }

  const projectCount = $derived(projects.length);
</script>

<!-- Top Bar -->
<div class="dashboard">
  <header class="topbar">
    <nav class="tabs">
      <button
        class="tab"
        class:tab-active={activeTab === 'projects'}
        onclick={() => (activeTab = 'projects')}
      >
        Projects
      </button>
      <button
        class="tab"
        class:tab-active={activeTab === 'release'}
        onclick={() => (activeTab = 'release')}
      >
        Release Server
      </button>
    </nav>
    <button class="btn-primary" onclick={() => console.log('[STUB] New Project')}>
      <i class="codicon codicon-add"></i>
      New Project
    </button>
  </header>

  <!-- Subheader -->
  <div class="subheader">
    <span class="project-count">
      <strong>{projectCount}</strong> {projectCount === 1 ? 'Project' : 'Projects'}
    </span>
    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:toggle-active={viewMode === 'grid'}
        onclick={() => (viewMode = 'grid')}
        title="Grid view"
      >
        <i class="codicon codicon-symbol-array"></i>
      </button>
      <button
        class="toggle-btn"
        class:toggle-active={viewMode === 'list'}
        onclick={() => (viewMode = 'list')}
        title="List view"
      >
        <i class="codicon codicon-list-flat"></i>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    {#if activeTab === 'projects'}
      {#if loading}
        <div class="grid">
          {#each Array(6) as _}
            <div class="skeleton-card">
              <div class="skeleton-row">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-badge"></div>
              </div>
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-subtitle"></div>
              <div class="skeleton-row" style="margin-top: auto">
                <div class="skeleton skeleton-date"></div>
                <div class="skeleton skeleton-date"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if error}
        <div class="empty-state">
          <div class="empty-icon error-icon">
            <i class="codicon codicon-warning"></i>
          </div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button class="btn-primary" onclick={fetchProjects}>
            <i class="codicon codicon-refresh"></i>
            Retry
          </button>
        </div>
      {:else if projectCount === 0}
        <div class="empty-state">
          <div class="empty-icon">
            <i class="codicon codicon-folder"></i>
          </div>
          <h2>No projects yet</h2>
          <p>Create your first project to get started with RisoTron Studio.</p>
          <button class="btn-primary" onclick={() => console.log('[STUB] New Project')}>
            <i class="codicon codicon-add"></i>
            Create New Project
          </button>
        </div>
      {:else}
        <div class="grid" class:list-mode={viewMode === 'list'}>
          {#each projects as project (project.id)}
            <ProjectCard {project} />
          {/each}
        </div>
      {/if}
    {:else}
      <div class="empty-state">
        <h2>Release Server</h2>
        <p>Coming soon...</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f8fafc;
    overflow: hidden;
  }

  /* ── Top Bar ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    height: 54px;
    background: #ffffff;
    border-bottom: 1px solid #e8eaed;
    flex-shrink: 0;
  }

  .tabs {
    display: flex;
    gap: 4px;
    height: 100%;
  }

  .tab {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab:hover {
    color: #3b82f6;
  }

  .tab-active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    font-weight: 600;
  }

  .btn-primary {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s, transform 0.1s;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    opacity: 0.92;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  }

  .btn-primary:active {
    transform: scale(0.97);
  }

  /* ── Subheader ── */
  .subheader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 28px;
    flex-shrink: 0;
  }

  .project-count {
    font-size: 14px;
    color: #475569;
  }

  .view-toggle {
    display: flex;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  .toggle-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 30px;
    cursor: pointer;
    color: #94a3b8;
    transition: background 0.15s, color 0.15s;
  }

  .toggle-btn:not(:last-child) {
    border-right: 1px solid #e2e8f0;
  }

  .toggle-btn:hover {
    background: #f8fafc;
    color: #64748b;
  }

  .toggle-active {
    background: #eef2ff;
    color: #6366f1;
  }

  .tab:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  .btn-primary:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .toggle-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  /* ── Content ── */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 0 28px 28px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .list-mode {
    grid-template-columns: 1fr;
  }

  /* ── Empty State ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-top: 100px;
    gap: 8px;
  }

  .empty-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    margin-bottom: 12px;
  }

  .empty-icon :global(.codicon) {
    font-size: 32px;
    color: #6366f1;
  }

  .error-icon {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
  }

  .error-icon :global(.codicon) {
    color: #ef4444;
  }

  .empty-state h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }

  .empty-state p {
    margin: 0 0 16px;
    font-size: 14px;
    color: #94a3b8;
    max-width: 340px;
  }

  /* ── Skeleton Loading ── */
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #fff;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 20px;
    min-height: 160px;
  }

  .skeleton-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .skeleton {
    border-radius: 6px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
  }

  .skeleton-badge {
    width: 72px;
    height: 22px;
  }

  .skeleton-title {
    width: 65%;
    height: 16px;
  }

  .skeleton-subtitle {
    width: 85%;
    height: 12px;
  }

  .skeleton-date {
    width: 90px;
    height: 12px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
