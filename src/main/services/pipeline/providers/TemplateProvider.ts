import type { PipelineContext, IProvider } from '../../../../shared/types/pipeline';

/**
 * Stub provider for the template-generation stage of the pipeline.
 */
export class TemplateProvider implements IProvider {
  async execute(context: PipelineContext): Promise<void> {
    console.log('[TemplateProvider] Executing template stage');
  }
}
