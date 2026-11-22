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

    expect(rows).toEqual(
      [
        '20261118000000_foundation',
        '20261121090000_better_auth',
        '20261121110000_manual_core_foundation',
        '20261121120000_manual_meal_draft_items',
        '20261121130000_auth_throttles_and_audit_events',
        '20261122110000_recovery_credentials',
        '20261122120000_onboarding_profile_preferences',
        '20261122130000_plan_versions',
        '20261122140000_meal_idempotency_plan_link',
        '20261122150000_weights_reflections',
        '20261122160000_manual_lifecycle',
        '20261122170000_media_jobs_domain_completion',
        '20261122180000_nutrition_catalog_and_slots',
      ].map((migration_name) =>
        expect.objectContaining({
          migration_name,
          finished_at: expect.any(Date),
        }),
      ),
    );
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
