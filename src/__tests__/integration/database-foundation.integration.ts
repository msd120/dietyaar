import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database foundation', () => {
  it('applies every committed migration successfully', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY migration_name
    `;

    expect(rows).toEqual([
      expect.objectContaining({
        migration_name: '20261118000000_foundation',
        finished_at: expect.any(Date),
      }),
    ]);
  });

  it('enforces PostgreSQL constraints without leaving test data behind', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        CREATE TEMPORARY TABLE constraint_probe (
          id integer PRIMARY KEY,
          positive_value integer NOT NULL CHECK (positive_value > 0)
        ) ON COMMIT DROP
      `);
      await tx.$executeRawUnsafe('INSERT INTO constraint_probe (id, positive_value) VALUES (1, 1)');

      await tx.$executeRawUnsafe('SAVEPOINT before_invalid_constraint_probe');
      try {
        await expect(
          tx.$executeRawUnsafe('INSERT INTO constraint_probe (id, positive_value) VALUES (2, 0)'),
        ).rejects.toMatchObject({ code: 'P2010' });
      } finally {
        await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT before_invalid_constraint_probe');
      }

      const rows = await tx.$queryRawUnsafe<Array<{ positive_value: number }>>(
        'SELECT positive_value FROM constraint_probe ORDER BY id',
      );
      expect(rows).toEqual([{ positive_value: 1 }]);
    });
  });
});
