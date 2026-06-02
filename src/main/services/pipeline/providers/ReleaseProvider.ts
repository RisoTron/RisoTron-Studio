import type { PipelineContext, IProvider } from '../../../../shared/types/pipeline';

/**
 * Stub provider for the release-packaging stage of the pipeline.
 */
export class ReleaseProvider implements IProvider {
  async execute(context: PipelineContext): Promise<void> {
    console.log('[ReleaseProvider] Executing release stage');
  }
}
