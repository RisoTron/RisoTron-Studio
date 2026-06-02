import type { PipelineContext, IProvider } from '../../../shared/types/pipeline';

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
   */
  async run(context: PipelineContext): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.execute(context);
      } catch (error) {
        console.error('[PipelineEngine] Provider failed:', error);
        throw error;
      }
    }
  }
}
