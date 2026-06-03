import fs from 'node:fs';
import path from 'node:path';
import type { PipelineContext, IProvider } from '../../../../shared/types/pipeline';
import type { CreateProjectPayload, Project } from '../../../../shared/types/project';
import type { ProjectRepository } from '../../ProjectRepository';

/**
 * Scaffolding provider — creates the project directory, writes
 * `risotron.json`, and persists the project row via ProjectRepository.
 *
 * Reads from context:
 *   - `createPayload` (CreateProjectPayload)
 *   - `projectRepo`   (ProjectRepository)
 *
 * Writes to context:
 *   - `project` (Project) — the newly created project record.
 */
export class BaseProjectProvider implements IProvider {
  readonly name = 'Scaffolding Base';

  async execute(context: PipelineContext): Promise<void> {
    const payload = context['createPayload'] as CreateProjectPayload;
    const projectRepo = context['projectRepo'] as ProjectRepository;

    if (!payload || !projectRepo) {
      throw new Error('[BaseProjectProvider] Missing createPayload or projectRepo in context');
    }

    fs.mkdirSync(payload.path, { recursive: true });
    fs.writeFileSync(
      path.join(payload.path, 'risotron.json'),
      JSON.stringify(payload, null, 2),
    );

    const project: Project = projectRepo.create(payload);
    context['project'] = project;
  }
}
