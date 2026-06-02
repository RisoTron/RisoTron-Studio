<script lang="ts">
  import type { Project } from '../../shared/types/project';
  import ProjectCard from './ProjectCard.svelte';

  interface Props {
    onNewProject?: () => void;
  }

  let { onNewProject }: Props = $props();

  let projects: Project[] = $state([]);
  let loading: boolean = $state(true);
  let error: string | null = $state(null);
  let viewMode: 'grid' | 'list' = $state('grid');
  let activeTab: 'projects' | 'release' = $state('projects');

  // ── Search & Filter state ──
  let searchQuery: string = $state('');
  let statusFilter: 'active' | 'archived' | 'all' = $state('active');
  let templateFilter: string = $state('all');

  // ── Derived: unique template options ──
  const availableTemplates = $derived(
    [...new Set(projects.map((p) => p.template_id))]
      .filter((id): id is string => id !== null)
      .sort()
  );

  const hasNullTemplate = $derived(projects.some((p) => p.template_id === null));

  // ── Derived: filtered list ──
  const filteredProjects = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      // Text search (null-safe: p.name / p.path may be null in SQLite)
      const name = (p.name || '').toLowerCase();
      const path = (p.path || '').toLowerCase();
      if (q && !name.includes(q) && !path.includes(q)) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && p.is_archived === 1) return false;
      if (statusFilter === 'archived' && p.is_archived === 0) return false;
      // Template filter
      if (templateFilter === '__none__' && p.template_id !== null) return false;
      if (templateFilter !== 'all' && templateFilter !== '__none__' && p.template_id !== templateFilter) {
        return false;
      }
      return true;
    });
  });

  const filtersActive = $derived(
    searchQuery.trim() !== '' || statusFilter !== 'active' || templateFilter !== 'all'
  );

  function clearFilters() {
    searchQuery = '';
    statusFilter = 'active';
    templateFilter = 'all';
  }

  $effect(() => {
    fetchProjects();
  });

  async function fetchProjects() {
    loading = true;
    error = null;
    try {
      projects = await window.api.project.list(true);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
      projects = [];
    } finally {
      loading = false;
    }
  }
</script>

<section class="dashboard">
  <!-- ── Top Bar ── -->
  <header class="topbar">
    <nav class="tabs">
      <button
        class="tab"
        class:active={activeTab === 'projects'}
        onclick={() => (activeTab = 'projects')}
      >
        Projects
      </button>
      <button
        class="tab"
        class:active={activeTab === 'release'}
        onclick={() => (activeTab = 'release')}
      >
        Release Server
      </button>
    </nav>
    <button class="btn-primary" id="new-project-btn" onclick={() => onNewProject?.()}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      New Project
    </button>
  </header>

  <!-- ── Subheader ── -->
  <div class="subheader">
    <p class="project-count">
      <strong>{filteredProjects.length}</strong>
      {filteredProjects.length === 1 ? 'Project' : 'Projects'}
      {#if filtersActive && filteredProjects.length !== projects.length}
        <span class="count-total">(of {projects.length})</span>
      {/if}
    </p>
    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:active={viewMode === 'grid'}
        onclick={() => (viewMode = 'grid')}
        title="Grid view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1.5"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5"/>
        </svg>
      </button>
      <button
        class="toggle-btn"
        class:active={viewMode === 'list'}
        onclick={() => (viewMode = 'list')}
        title="List view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2.5" rx="1"/>
          <rect x="1" y="6.75" width="14" height="2.5" rx="1"/>
          <rect x="1" y="11.5" width="14" height="2.5" rx="1"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- ── Filters Bar ── -->
  <div class="filters-bar">
    <div class="search-input-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11.5 11.5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Search projects…"
        bind:value={searchQuery}
        id="search-projects-input"
      />
      {#if searchQuery}
        <button class="search-clear" onclick={() => (searchQuery = '')} title="Clear search">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      {/if}
    </div>

    <select
      class="filter-select"
      bind:value={statusFilter}
      id="status-filter-select"
    >
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="archived">Archived</option>
    </select>

    <select
      class="filter-select"
      bind:value={templateFilter}
      id="template-filter-select"
    >
      <option value="all">All Templates</option>
      {#if hasNullTemplate}
        <option value="__none__">No template</option>
      {/if}
      {#each availableTemplates as tmpl}
        <option value={tmpl}>{tmpl}</option>
      {/each}
    </select>

    {#if filtersActive}
      <button class="btn-clear-filters" onclick={clearFilters} id="clear-filters-btn">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Clear
      </button>
    {/if}
  </div>

  <!-- ── Content ── -->
  {#if activeTab === 'projects'}
  <div class="content">
    {#if loading}
      <div class="skeleton-grid">
        {#each Array(6) as _}
          <div class="skeleton-card">
            <div class="sk-icon"></div>
            <div class="sk-line w60"></div>
            <div class="sk-line w40"></div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-title">Failed to load projects</p>
        <p class="error-msg">{error}</p>
        <button class="btn-primary" onclick={fetchProjects}>Try Again</button>
      </div>
    {:else if projects.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="48" height="40" rx="6" stroke="var(--fg-muted)" stroke-width="2" fill="none"/>
            <path d="M24 32h16M32 24v16" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="empty-title">No projects yet</h2>
        <p class="empty-subtitle">Create your first project to get started with RisoTron Studio</p>
        <button class="btn-primary btn-lg" id="empty-create-btn" onclick={() => onNewProject?.()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Create New Project
        </button>
      </div>
    {:else if filteredProjects.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="18" stroke="var(--fg-muted)" stroke-width="2" fill="none"/>
            <path d="M42 42l12 12" stroke="var(--fg-muted)" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M22 28h12" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="empty-title">No matching projects</h2>
        <p class="empty-subtitle">No projects match your current search or filter criteria</p>
        <button class="btn-primary btn-lg" onclick={clearFilters} id="empty-clear-filters-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Clear Filters
        </button>
      </div>
    {:else}
      <div class="project-grid" class:list-view={viewMode === 'list'}>
        {#each filteredProjects as proj (proj.id)}
          <ProjectCard project={proj} />
        {/each}
      </div>
    {/if}
  </div>
  {/if}
</section>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 32px 32px;
    overflow-y: auto;
  }

  /* ── Top Bar ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0 16px;
    border-bottom: 1px solid var(--border, #3c3c3c);
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg, #1e1e1e);
  }

  .tabs {
    display: flex;
    gap: 4px;
  }

  .tab {
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--fg-muted, #969696);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    transition: color 0.15s, background 0.15s;
  }

  .tab:hover {
    background: rgba(128, 128, 128, 0.08);
  }

  .tab.active {
    color: var(--accent, #0e639c);
    font-weight: 600;
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -17px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: var(--accent, #0e639c);
    border-radius: 1px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: var(--accent, #0e639c);
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
  }

  .btn-primary:hover {
    opacity: 0.88;
  }

  .btn-primary:active {
    transform: scale(0.97);
  }

  .btn-lg {
    padding: 12px 28px;
    font-size: 15px;
    border-radius: 10px;
  }

  /* ── Subheader ── */
  .subheader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0 12px;
  }

  .project-count {
    font-size: 14px;
    color: var(--fg-muted, #969696);
  }

  .project-count strong {
    color: var(--fg, #cccccc);
    font-weight: 700;
  }

  .view-toggle {
    display: flex;
    gap: 2px;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 8px;
    padding: 2px;
  }

  .toggle-btn {
    background: none;
    border: none;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--fg-muted, #969696);
    transition: color 0.15s, background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    color: var(--fg, #cccccc);
  }

  .toggle-btn.active {
    background: var(--vscode-input-bg, #3c3c3c);
    color: var(--fg, #cccccc);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  /* ── Filters Bar ── */
  .filters-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    flex-wrap: wrap;
  }

  .search-input-wrap {
    position: relative;
    flex: 1;
    min-width: 180px;
    max-width: 320px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--fg-muted, #969696);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 7px 32px 7px 30px;
    font-size: 13px;
    border: 1px solid var(--border, #3c3c3c);
    border-radius: 8px;
    background: var(--input-bg, #3c3c3c);
    color: var(--fg, #cccccc);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-input::placeholder {
    color: var(--fg-muted, #969696);
  }

  .search-input:focus {
    border-color: var(--vscode-focusBorder, #007fd4);
    box-shadow: 0 0 0 3px rgba(0, 127, 212, 0.25);
  }

  .search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--fg-muted, #969696);
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .search-clear:hover {
    color: var(--fg, #cccccc);
  }

  .filter-select {
    padding: 7px 28px 7px 10px;
    font-size: 13px;
    border: 1px solid var(--border, #3c3c3c);
    border-radius: 8px;
    background: var(--input-bg, #3c3c3c);
    color: var(--fg, #cccccc);
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239e9e9e' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .filter-select option {
    background-color: var(--vscode-editor, #1e1e1e);
    color: var(--fg, #cccccc);
  }

  .filter-select:focus {
    border-color: var(--vscode-focusBorder, #007fd4);
    box-shadow: 0 0 0 3px rgba(0, 127, 212, 0.25);
  }

  .btn-clear-filters {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid var(--border, #3c3c3c);
    border-radius: 8px;
    background: none;
    color: var(--fg-muted, #969696);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .btn-clear-filters:hover {
    color: var(--fg, #cccccc);
    border-color: var(--fg-muted, #969696);
    background: rgba(128, 128, 128, 0.1);
  }

  .count-total {
    font-weight: 400;
    color: var(--fg-muted, #969696);
    font-size: 12px;
  }

  /* ── Content ── */
  .content {
    flex: 1;
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    animation: fadeIn 0.3s ease;
  }

  .project-grid.list-view {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Empty state ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    text-align: center;
    animation: fadeIn 0.4s ease;
  }

  .empty-icon {
    margin-bottom: 24px;
    opacity: 0.5;
  }

  .empty-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--fg, #cccccc);
  }

  .empty-subtitle {
    font-size: 14px;
    color: var(--fg-muted, #969696);
    margin-bottom: 28px;
    max-width: 340px;
    line-height: 1.5;
  }

  /* ── Error state ── */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 0;
    text-align: center;
    animation: fadeIn 0.3s ease;
  }

  .error-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .error-msg {
    font-size: 13px;
    color: var(--fg-muted);
    margin-bottom: 20px;
  }

  /* ── Skeleton ── */
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .skeleton-card {
    background: var(--sk-bg, rgba(128, 128, 128, 0.06));
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: pulse 1.2s ease-in-out infinite;
  }

  .sk-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(128, 128, 128, 0.12);
  }

  .sk-line {
    height: 12px;
    border-radius: 6px;
    background: rgba(128, 128, 128, 0.1);
  }

  .sk-line.w60 { width: 60%; }
  .sk-line.w40 { width: 40%; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }

  /* ── Accessibility: focus-visible ── */
  .tab:focus-visible, .toggle-btn:focus-visible { outline: 2px solid var(--vscode-focusBorder, #007fd4); outline-offset: -2px; }
  .btn-primary:focus-visible { outline: 2px solid var(--vscode-focusBorder, #007fd4); outline-offset: 2px; }
</style>
