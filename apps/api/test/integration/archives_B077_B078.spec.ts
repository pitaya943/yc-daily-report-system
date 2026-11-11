import {
  integrationEnabled,
  requireIntegration,
} from './setup';
import { createTestApp } from './test-app';
import { ArchivesService } from '../../src/archives/archives.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-077 B-078 archives', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let archives: ArchivesService;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    archives = app.get(ArchivesService);
  });

  afterAll(() => app.close());

  it('automatic archive is idempotent per date', async () => {
    const actor = {
      id: 'b0000001-0001-4000-8000-000000000002',
      displayName: '種子管理員',
      role: 'ADMIN' as const,
      authUserId: 'a0000001-0001-4000-8000-000000000002',
    };
    const date = '2026-11-05';
    const first = await archives.generateDaily(actor, date, 'AUTOMATIC');
    const second = await archives.generateDaily(actor, date, 'AUTOMATIC');
    expect(second.duplicate).toBe(true);
    expect(first.id).toBe(second.id);
  });

  it('B-077 download signed URLs expire in 3600s', async () => {
    const actor = {
      id: 'b0000001-0001-4000-8000-000000000002',
      displayName: '種子管理員',
      role: 'ADMIN' as const,
      authUserId: 'a0000001-0001-4000-8000-000000000002',
    };
    const date = '2026-11-04';
    const created = await archives.generateDaily(actor, date, 'MANUAL');
    const dl = await archives.download(actor, created.id as string);
    expect(dl.expiresIn).toBe(3600);
    expect(dl.links.xlsx).toMatch(/^https?:/);
    expect(dl.links.pdf).toMatch(/^https?:/);
    await archives.remove(actor, created.id as string);
  });
});
