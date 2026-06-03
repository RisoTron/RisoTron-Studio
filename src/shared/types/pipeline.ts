/**
 * Shared context object passed through each stage of a pipeline run.
 * Providers read from and write to this record to share data between stages.
 */
export type PipelineContext = Record<string, unknown>;

/**
 * Progress snapshot emitted before each pipeline stage executes.
 */
export interface PipelineProgress {
  stageIndex: number;
  totalStages: number;
  currentStageName: string;
}

/**
 * Callback signature for receiving pipeline progress updates.
 */
export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Contract for a single pipeline stage provider.
 * Each provider executes one stage of the pipeline.
 */
export interface IProvider {
  /** Optional human-readable name shown in progress UI. */
  name?: string;
  execute(context: PipelineContext): Promise<void>;
}
