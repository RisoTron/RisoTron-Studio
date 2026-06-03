import type { PipelineContext, IProvider } from '../../../../shared/types/pipeline';

/**
 * Stub provider for the release-packaging stage of the pipeline.
 */
export class ReleaseProvider implements IProvider {
  readonly name = 'Release Packaging';

  async execute(_context: PipelineContext): Promise<void> {
    console.log('[ReleaseProvider] Executing release stage');
  }
}
