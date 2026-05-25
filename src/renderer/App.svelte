<script lang="ts">
  import { onMount } from 'svelte';

  let appInfo: any = null;

  onMount(async () => {
    if (window.api && window.api.getAppInfo) {
      appInfo = await window.api.getAppInfo();
    }
  });
</script>

<main>
  <div class="welcome">
    <h1>Welcome to RisoTron Studio</h1>
    <p>AI-powered creative studio platform</p>
    {#if appInfo}
      <div class="info">
        <p><strong>Version:</strong> {appInfo.version}</p>
        <p><strong>Window State:</strong></p>
        <pre>{JSON.stringify(appInfo.state, null, 2)}</pre>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }

  .welcome h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .welcome p {
    font-size: 1.1rem;
    opacity: 0.7;
  }

  .info {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 8px;
    text-align: left;
    font-size: 0.9rem;
  }

  .info pre {
    margin-top: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
