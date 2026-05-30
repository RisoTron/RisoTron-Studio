// eslint-disable-next-line import/no-unresolved
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SqliteAdapter } from '../db/adapters/SqliteAdapter';
import { ProjectRepository } from './ProjectRepository';

const { getPath } = vi.hoisted(() => ({
  getPath: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath,
  },
}));

describe('ProjectRepository', () => {
  let db: SqliteAdapter;
  let repository: ProjectRepository;

  beforeEach(() => {
    getPath.mockReturnValue(':memory:');
    db = new SqliteAdapter(':memory:');
    db.initialize();
    repository = new ProjectRepository(db);
  });

  afterEach(() => {
    db.close();
    vi.clearAllMocks();
  });

  it('creates a project', () => {
    const project = repository.create({
      name: 'Launch Posters',
      path: '/tmp/launch-posters',
    });

    expect(project).toMatchObject({
      name: 'Launch Posters',
      path: '/tmp/launch-posters',
      is_archived: 0,
    });
    expect(project.id).toEqual(expect.any(String));
    expect(project.created_at).toEqual(expect.any(String));
    expect(project.updated_at).toEqual(expect.any(String));

    const row = db.queryOne<{
      id: string;
      name: string;
      path: string;
      is_archived: number;
    }>('SELECT id, name, path, is_archived FROM projects WHERE id = ?', [project.id]);

    expect(row).toEqual({
      id: project.id,
      name: 'Launch Posters',
      path: '/tmp/launch-posters',
      is_archived: 0,
    });
  });

  it('lists non-archived projects by default and archived projects when requested', () => {
    const active = repository.create({
      name: 'Active Project',
      path: '/tmp/active-project',
    });
    const archived = repository.create({
      name: 'Archived Project',
      path: '/tmp/archived-project',
    });

    repository.softDelete(archived.id);

    expect(repository.list()).toEqual([expect.objectContaining({ id: active.id })]);
    expect(repository.list(true)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: active.id, is_archived: 0 }),
        expect.objectContaining({ id: archived.id, is_archived: 1 }),
      ]),
    );
    expect(repository.list(true)).toHaveLength(2);
  });

  it('gets a project by id', () => {
    const project = repository.create({
      name: 'Lookup Project',
      path: '/tmp/lookup-project',
    });

    expect(repository.get(project.id)).toEqual(expect.objectContaining({ id: project.id }));
    expect(repository.get('missing-project')).toBeUndefined();
  });

  it('updates an existing project', () => {
    const project = repository.create({
      name: 'Original Project',
      path: '/tmp/original-project',
    });

    const updated = repository.update(project.id, {
      name: 'Updated Project',
      path: '/tmp/updated-project',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: project.id,
        name: 'Updated Project',
        path: '/tmp/updated-project',
        is_archived: 0,
      }),
    );
    expect(repository.get(project.id)).toEqual(
      expect.objectContaining({
        name: 'Updated Project',
        path: '/tmp/updated-project',
      }),
    );
    expect(repository.update('missing-project', { name: 'Missing Project' })).toBeUndefined();
  });

  it('soft deletes a project', () => {
    const project = repository.create({
      name: 'Archive Project',
      path: '/tmp/archive-project',
    });

    const deleted = repository.softDelete(project.id);

    expect(deleted).toEqual(expect.objectContaining({ id: project.id, is_archived: 1 }));
    expect(repository.list()).toEqual([]);
    expect(repository.list(true)).toEqual([expect.objectContaining({ id: project.id })]);
    expect(repository.softDelete('missing-project')).toBeUndefined();

    const row = db.queryOne<{ is_archived: number }>(
      'SELECT is_archived FROM projects WHERE id = ?',
      [project.id],
    );

    expect(row?.is_archived).toBe(1);
  });

  it('rejects duplicate project names', () => {
    repository.create({
      name: 'Duplicate Name',
      path: '/tmp/duplicate-name-a',
    });

    expect(() =>
      repository.create({
        name: 'Duplicate Name',
        path: '/tmp/duplicate-name-b',
      }),
    ).toThrow();
  });
});
