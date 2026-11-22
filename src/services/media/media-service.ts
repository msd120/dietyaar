import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { ConsentPurpose, MediaPurpose, MediaState } from '@prisma/client';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import type { MediaStorage } from '@/services/media/media-storage';
import { SupabaseMediaStorage } from '@/services/media/supabase-media-storage';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function mediaFeatureAvailable() {
  return env.MEDIA_STORAGE_ENABLED;
}

function configuredStorage(): MediaStorage {
  if (
    !env.MEDIA_STORAGE_ENABLED ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.SUPABASE_STORAGE_BUCKET
  ) {
    throw new Error('FEATURE_DISABLED');
  }
  return new SupabaseMediaStorage({
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
  });
}

function consentPurpose(purpose: MediaPurpose) {
  return purpose === MediaPurpose.PLAN_IMAGE
    ? ConsentPurpose.PLAN_IMAGE
    : ConsentPurpose.MEAL_IMAGE;
}

async function requireConsent(userId: string, purpose: MediaPurpose) {
  const consent = await prisma.consent.findUnique({
    where: { userId_purpose: { userId, purpose: consentPurpose(purpose) } },
  });
  if (!consent?.grantedAt || consent.revokedAt) throw new Error('NO_CONSENT');
}

function hasValidMagic(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mimeType === 'image/png')
    return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (mimeType === 'image/webp')
    return (
      bytes.length >= 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
    );
  return false;
}

export async function createMediaUploadIntent(input: {
  userId: string;
  purpose: MediaPurpose;
  mimeType: string;
  byteSize: number;
  storage?: MediaStorage;
}) {
  if (!mediaFeatureAvailable() && !input.storage) throw new Error('FEATURE_DISABLED');
  if (!ALLOWED_MIME.has(input.mimeType) || input.byteSize < 1 || input.byteSize > MAX_BYTES) {
    throw new Error('MEDIA_INVALID');
  }
  await requireConsent(input.userId, input.purpose);
  const extension =
    input.mimeType === 'image/jpeg' ? 'jpg' : input.mimeType === 'image/png' ? 'png' : 'webp';
  const objectPath = `${input.userId}/${input.purpose.toLowerCase()}/${randomUUID()}.${extension}`;
  const asset = await prisma.mediaAsset.create({
    data: {
      userId: input.userId,
      bucket: env.SUPABASE_STORAGE_BUCKET ?? 'private-media',
      objectPath,
      purpose: input.purpose,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      retentionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  try {
    const signedUpload = await (input.storage ?? configuredStorage()).createSignedUpload(
      objectPath,
    );
    return { assetId: asset.id, ...signedUpload };
  } catch (error) {
    await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => undefined);
    throw error;
  }
}

export async function finalizeMediaUpload(input: {
  userId: string;
  assetId: string;
  storage?: MediaStorage;
}) {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: input.assetId, userId: input.userId, state: MediaState.PENDING_UPLOAD },
  });
  if (!asset) throw new Error('MEDIA_NOT_FOUND');
  await requireConsent(input.userId, asset.purpose);
  const downloaded = await (input.storage ?? configuredStorage()).download(asset.objectPath);
  const valid =
    downloaded.bytes.length === asset.byteSize &&
    downloaded.bytes.length <= MAX_BYTES &&
    hasValidMagic(downloaded.bytes, asset.mimeType) &&
    (!downloaded.contentType || downloaded.contentType === asset.mimeType);
  if (!valid) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { state: MediaState.INVALID },
    });
    throw new Error('MEDIA_INVALID');
  }
  return prisma.mediaAsset.update({
    where: { id: asset.id },
    data: {
      state: MediaState.READY,
      sha256: createHash('sha256').update(downloaded.bytes).digest('hex'),
    },
  });
}

export async function getOwnedMediaAccess(input: {
  userId: string;
  assetId: string;
  storage?: MediaStorage;
}) {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: input.assetId, userId: input.userId, state: MediaState.READY },
  });
  if (!asset) throw new Error('MEDIA_NOT_FOUND');
  const expiresInSeconds = 60;
  const url = await (input.storage ?? configuredStorage()).createSignedDownload(
    asset.objectPath,
    expiresInSeconds,
  );
  return { url, expiresInSeconds };
}

export async function deleteOwnedMedia(input: {
  userId: string;
  assetId: string;
  storage?: MediaStorage;
}) {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: input.assetId, userId: input.userId },
  });
  if (!asset) return;
  await prisma.mediaAsset.update({ where: { id: asset.id }, data: { state: MediaState.DELETING } });
  await (input.storage ?? configuredStorage()).remove(asset.objectPath);
  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { state: MediaState.DELETED, deletedAt: new Date() },
  });
}

export async function expireAbandonedMedia(now = new Date(), storage?: MediaStorage) {
  const assets = await prisma.mediaAsset.findMany({
    where: {
      retentionDeadline: { lte: now },
      state: { in: [MediaState.PENDING_UPLOAD, MediaState.UPLOADED, MediaState.READY] },
    },
    take: 50,
  });
  for (const asset of assets) {
    try {
      await (storage ?? configuredStorage()).remove(asset.objectPath);
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { state: MediaState.EXPIRED, deletedAt: now },
      });
    } catch {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { state: MediaState.DELETING },
      });
    }
  }
  return assets.length;
}
