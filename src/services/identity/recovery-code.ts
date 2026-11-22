import 'server-only';
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { prisma } from '@/lib/prisma';

const RECOVERY_CODE_BYTES = 16;

export function createRecoveryCode() {
  const compact = randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase();
  return compact.match(/.{1,4}/g)?.join('-') ?? compact;
}

export async function createRecoveryCredential(userId: string, code: string) {
  const codeHash = await hashPassword(code.replaceAll('-', '').trim().toUpperCase());
  await prisma.recoveryCredential.create({ data: { userId, codeHash } });
}

export async function recoverWithCode(input: {
  username: string;
  code: string;
  newPassword: string;
}) {
  const normalizedCode = input.code.replaceAll('-', '').trim().toUpperCase();
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    include: { recovery: true },
  });
  const recovery = user?.recovery;
  if (!user || !recovery) return null;

  const codeMatches = await verifyPassword({
    hash: recovery.codeHash,
    password: normalizedCode,
  });
  if (!codeMatches) return null;

  const [nextCode, nextPasswordHash] = await Promise.all([
    Promise.resolve(createRecoveryCode()),
    hashPassword(input.newPassword),
  ]);
  // Hash the exact code returned to the caller, never a separately generated value.
  const replacementCodeHash = await hashPassword(nextCode.replaceAll('-', ''));

  const recovered = await prisma.$transaction(async (tx) => {
    const rotated = await tx.recoveryCredential.updateMany({
      where: { userId: user.id, version: recovery.version },
      data: {
        codeHash: replacementCodeHash,
        version: { increment: 1 },
        lastRotatedAt: new Date(),
      },
    });
    if (rotated.count !== 1) return false;

    const passwordUpdated = await tx.account.updateMany({
      where: { userId: user.id, providerId: 'credential' },
      data: { password: nextPasswordHash },
    });
    if (passwordUpdated.count !== 1) throw new Error('Credential account is unavailable');

    await tx.session.deleteMany({ where: { userId: user.id } });
    return true;
  });

  return recovered ? { replacementCode: nextCode, userId: user.id } : null;
}
