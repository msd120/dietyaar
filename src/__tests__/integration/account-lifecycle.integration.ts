import { randomUUID } from 'node:crypto';
import { JobType, PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { buildAccountExport } from '@/services/account/export-service';
import { deleteCurrentAccount, registerWithUsername } from '@/services/identity/identity-service';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('account lifecycle', () => {
  it('exports only the requested owner data and excludes identity secrets', async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    await prisma.user.createMany({
      data: [
        { id: userId, name: 'Export user', email: `${userId}@user.invalid` },
        { id: otherUserId, name: 'Other user', email: `${otherUserId}@user.invalid` },
      ],
    });
    try {
      await prisma.profile.createMany({
        data: [
          { userId, age: 30, preferredName: 'Export owner' },
          { userId: otherUserId, age: 31, preferredName: 'Must not leak' },
        ],
      });
      await prisma.recoveryCredential.create({
        data: { userId, codeHash: 'secret-recovery-hash' },
      });
      const archive = await buildAccountExport(userId);
      const serialized = JSON.stringify(archive);
      expect(archive).toMatchObject({
        manifest: { format: 'dietyaar-export', version: 1 },
        profile: { userId, preferredName: 'Export owner' },
      });
      expect(serialized).not.toContain(otherUserId);
      expect(serialized).not.toContain('Must not leak');
      expect(serialized).not.toContain('secret-recovery-hash');
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    }
  });

  it('reauthenticates and immediately deletes identity plus owned domain data', async () => {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const username = `delete_${suffix}`;
    const password = 'Delete-test-password-123!';
    const registration = await registerWithUsername({ username, password });
    expect(registration.ok).toBe(true);
    const cookies = registration.headers
      .getSetCookie()
      .map((value) => value.split(';', 1)[0])
      .join('; ');
    const user = await prisma.user.findUniqueOrThrow({ where: { username } });
    const otherUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: otherUserId,
        name: 'Unaffected user',
        email: `${otherUserId}@user.invalid`,
      },
    });
    try {
      await prisma.profile.create({ data: { userId: user.id, age: 30 } });
      await prisma.job.create({
        data: {
          userId: user.id,
          type: JobType.SUMMARY_REBUILD,
          payloadJson: { localDate: '2026-11-22' },
          idempotencyKey: `delete-test:${user.id}`,
        },
      });
      const response = await deleteCurrentAccount({
        headers: new Headers({ cookie: cookies, origin: 'http://localhost:3000' }),
        password,
      });
      expect(response.ok).toBe(true);
      expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
      expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(0);
      expect(await prisma.job.count({ where: { userId: user.id } })).toBe(0);
      expect(await prisma.user.count({ where: { id: otherUserId } })).toBe(1);
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [user.id, otherUserId] } } });
    }
  });
});
