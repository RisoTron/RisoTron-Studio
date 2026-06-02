import type { PipelineContext, IProvider } from '../../../../shared/types/pipeline';

/**
 * Stub provider for the CI/CD integration stage of the pipeline.
 */
export class CICDProvider implements IProvider {
  async execute(_context: PipelineContext): Promise<void> {
    console.log('[CICDProvider] Executing CI/CD stage');
  }
}
