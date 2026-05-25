<script lang="ts">
  import { onMount } from 'svelte';

  let appInfo: AppInfo | null = null;
  let pinging = false;
  let pingResult: string | null = null;
  let pingError = false;

  onMount(async () => {
    if (window.api && window.api.getAppInfo) {
      appInfo = await window.api.getAppInfo();
    }
  });

  async function handlePing() {
    if (pinging) return;
    pinging = true;
    pingResult = null;
    pingError = false;
    try {
      const response = await window.api.ping();
      pingResult = response;
    } catch (err: unknown) {
      pingResult = `Error: ${err instanceof Error ? err.message : String(err)}`;
      pingError = true;
    } finally {
      pinging = false;
    }
  }
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
    <div class="ping-section">
      <button id="ping-btn" on:click={handlePing} disabled={pinging}>
        {pinging ? 'Pinging…' : '🏓 Ping'}
      </button>
      {#if pingResult !== null}
        <p class="ping-result" class:ping-error={pingError}>
          {pingResult}
        </p>
      {/if}
    </div>
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

  .ping-section {
    margin-top: 2rem;
  }

  .ping-section button {
    padding: 0.6rem 1.4rem;
    font-size: 1rem;
    border: none;
    border-radius: 6px;
    background: #4f8cff;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .ping-section button:hover:not(:disabled) {
    opacity: 0.85;
  }

  .ping-section button:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .ping-section button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ping-result {
    margin-top: 0.75rem;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .ping-error {
    color: #ff5555;
  }
</style>
