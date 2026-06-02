/**
 * Shared context object passed through each stage of a pipeline run.
 * Providers read from and write to this record to share data between stages.
 */
export type PipelineContext = Record<string, any>;

/**
 * Contract for a single pipeline stage provider.
 * Each provider executes one stage of the pipeline.
 */
export interface IProvider {
  execute(context: PipelineContext): Promise<void>;
}
