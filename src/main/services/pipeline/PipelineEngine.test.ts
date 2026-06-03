// eslint-disable-next-line import/no-unresolved
import { describe, expect, it, vi } from 'vitest';
import { PipelineEngine } from './PipelineEngine';
import type { IProvider, PipelineContext, ProgressCallback } from '../../../shared/types/pipeline';

const makeProvider = (id: string, execute = vi.fn(), name: string | null = id) =>
  ({
    id,
    ...(name === null ? {} : { name }),
    execute,
  }) as unknown as IProvider;

const makeConfig = (): PipelineContext => ({
  projectName: 'Sequential Pipeline',
  targetPath: '/tmp/sequential-pipeline',
});

describe('PipelineEngine', () => {
  it('executes providers in the exact stage order', async () => {
    const templateExecute = vi.fn().mockResolvedValue(undefined);
    const releaseExecute = vi.fn().mockResolvedValue(undefined);
    const cicdExecute = vi.fn().mockResolvedValue(undefined);

    const templateProvider = makeProvider('template', templateExecute);
    const releaseProvider = makeProvider('release', releaseExecute);
    const cicdProvider = makeProvider('cicd', cicdExecute);

    const engine = new PipelineEngine();
    engine.registerProvider(templateProvider);
    engine.registerProvider(releaseProvider);
    engine.registerProvider(cicdProvider);

    const config = makeConfig();
    await engine.run(config);

    expect(templateExecute).toHaveBeenCalledOnce();
    expect(templateExecute).toHaveBeenCalledWith(config);
    expect(releaseExecute).toHaveBeenCalledOnce();
    expect(releaseExecute).toHaveBeenCalledWith(config);
    expect(cicdExecute).toHaveBeenCalledOnce();
    expect(cicdExecute).toHaveBeenCalledWith(config);
    expect(templateExecute).toHaveBeenCalledBefore(releaseExecute);
    expect(releaseExecute).toHaveBeenCalledBefore(cicdExecute);
  });

  it('handles empty pipeline without throwing', async () => {
    const engine = new PipelineEngine();
    await expect(engine.run(makeConfig())).resolves.toBeUndefined();
  });

  it('emits progress before each provider and Done after completion', async () => {
    const templateExecute = vi.fn().mockResolvedValue(undefined);
    const releaseExecute = vi.fn().mockResolvedValue(undefined);
    const cicdExecute = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();

    const templateProvider = makeProvider('template', templateExecute, 'Template setup');
    const releaseProvider = makeProvider('release', releaseExecute, null);
    const cicdProvider = makeProvider('cicd', cicdExecute, 'CI/CD setup');

    const engine = new PipelineEngine();
    engine.registerProvider(templateProvider);
    engine.registerProvider(releaseProvider);
    engine.registerProvider(cicdProvider);

    const config = makeConfig();
    await (
      engine.run as (
        context: PipelineContext,
        onProgress: ProgressCallback,
      ) => Promise<void>
    )(config, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(4);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      stageIndex: 0,
      totalStages: 3,
      currentStageName: 'Template setup',
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      stageIndex: 1,
      totalStages: 3,
      currentStageName: 'Processing...',
    });
    expect(onProgress).toHaveBeenNthCalledWith(3, {
      stageIndex: 2,
      totalStages: 3,
      currentStageName: 'CI/CD setup',
    });
    expect(onProgress).toHaveBeenNthCalledWith(4, {
      stageIndex: 3,
      totalStages: 3,
      currentStageName: 'Done',
    });
    expect(onProgress).toHaveBeenCalledBefore(templateExecute);
    expect(templateExecute).toHaveBeenCalledBefore(releaseExecute);
    expect(releaseExecute).toHaveBeenCalledBefore(cicdExecute);
    expect(onProgress.mock.invocationCallOrder[3]).toBeGreaterThan(
      cicdExecute.mock.invocationCallOrder[0],
    );
  });

  it('fails fast and never executes subsequent providers when a provider throws', async () => {
    const error = new Error('Release provider failed');
    const templateExecute = vi.fn().mockResolvedValue(undefined);
    const releaseExecute = vi.fn().mockRejectedValue(error);
    const cicdExecute = vi.fn().mockResolvedValue(undefined);

    const templateProvider = makeProvider('template', templateExecute);
    const releaseProvider = makeProvider('release', releaseExecute);
    const cicdProvider = makeProvider('cicd', cicdExecute);

    const engine = new PipelineEngine();
    engine.registerProvider(templateProvider);
    engine.registerProvider(releaseProvider);
    engine.registerProvider(cicdProvider);

    await expect(engine.run(makeConfig())).rejects.toThrow(error);

    expect(templateExecute).toHaveBeenCalledOnce();
    expect(releaseExecute).toHaveBeenCalledOnce();
    expect(cicdExecute).not.toHaveBeenCalled();
  });
});
