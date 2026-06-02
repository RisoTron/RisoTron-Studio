// eslint-disable-next-line import/no-unresolved
import { describe, expect, it, vi } from 'vitest';
import { PipelineEngine } from './PipelineEngine';
import type { IProvider, PipelineContext } from '../../../shared/types/pipeline';

const makeProvider = (id: string, execute = vi.fn()) =>
  ({
    id,
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
