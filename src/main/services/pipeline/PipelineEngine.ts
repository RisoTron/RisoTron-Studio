import type { PipelineContext, IProvider, ProgressCallback } from '../../../shared/types/pipeline';

/**
 * Sequential pipeline engine that runs registered providers in order.
 * Providers execute one at a time; a failure in any provider halts the pipeline.
 */
export class PipelineEngine {
  private providers: IProvider[] = [];

  /**
   * Append a provider to the end of the pipeline.
   */
  registerProvider(provider: IProvider): void {
    this.providers.push(provider);
  }

  /**
   * Execute all registered providers sequentially.
   * If any provider throws, the error is logged and re-thrown immediately
   * without running subsequent providers.
   *
   * @param onProgress — optional callback invoked before each stage and
   *                      once more after the last stage completes.
   */
  async run(context: PipelineContext, onProgress?: ProgressCallback): Promise<void> {
    const total = this.providers.length;

    for (let i = 0; i < total; i++) {
      const provider = this.providers[i];

      if (onProgress) {
        onProgress({
          stageIndex: i,
          totalStages: total,
          currentStageName: provider.name || 'Processing...',
        });
      }

      try {
        await provider.execute(context);
      } catch (error) {
        console.error('[PipelineEngine] Provider failed:', error);
        throw error;
      }
    }

    // Final "Done" event after all stages complete.
    if (onProgress) {
      onProgress({
        stageIndex: total,
        totalStages: total,
        currentStageName: 'Done',
      });
    }
  }
}
