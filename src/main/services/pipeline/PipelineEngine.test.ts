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
    const templateProvider = makeProvider('template', vi.fn().mockResolvedValue(undefined));
    const releaseProvider = makeProvider('release', vi.fn().mockResolvedValue(undefined));
    const cicdProvider = makeProvider('cicd', vi.fn().mockResolvedValue(undefined));

    const engine = new PipelineEngine();
    engine.registerProvider(templateProvider);
    engine.registerProvider(releaseProvider);
    engine.registerProvider(cicdProvider);

    await engine.run(makeConfig());

    expect(templateProvider.execute).toHaveBeenCalledOnce();
    expect(releaseProvider.execute).toHaveBeenCalledOnce();
    expect(cicdProvider.execute).toHaveBeenCalledOnce();
    expect(templateProvider.execute).toHaveBeenCalledBefore(releaseProvider.execute);
    expect(releaseProvider.execute).toHaveBeenCalledBefore(cicdProvider.execute);
  });

  it('fails fast and never executes subsequent providers when a provider throws', async () => {
    const error = new Error('Release provider failed');
    const templateProvider = makeProvider('template', vi.fn().mockResolvedValue(undefined));
    const releaseProvider = makeProvider('release', vi.fn().mockRejectedValue(error));
    const cicdProvider = makeProvider('cicd', vi.fn().mockResolvedValue(undefined));

    const engine = new PipelineEngine();
    engine.registerProvider(templateProvider);
    engine.registerProvider(releaseProvider);
    engine.registerProvider(cicdProvider);

    await expect(engine.run(makeConfig())).rejects.toThrow(error);

    expect(templateProvider.execute).toHaveBeenCalledOnce();
    expect(releaseProvider.execute).toHaveBeenCalledOnce();
    expect(cicdProvider.execute).not.toHaveBeenCalled();
  });
});
