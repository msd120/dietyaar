import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { MediaStorage, SignedUpload } from '@/services/media/media-storage';

export class SupabaseMediaStorage implements MediaStorage {
  private readonly bucket;

  constructor(input: { url: string; serviceRoleKey: string; bucket: string }) {
    const client = createClient(input.url, input.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = client.storage.from(input.bucket);
  }

  async createSignedUpload(objectPath: string): Promise<SignedUpload> {
    const { data, error } = await this.bucket.createSignedUploadUrl(objectPath);
    if (error) throw new Error('MEDIA_PROVIDER_UNAVAILABLE');
    return { url: data.signedUrl, token: data.token, expiresInSeconds: 120 };
  }

  async createSignedDownload(objectPath: string, expiresInSeconds: number) {
    const { data, error } = await this.bucket.createSignedUrl(objectPath, expiresInSeconds);
    if (error) throw new Error('MEDIA_PROVIDER_UNAVAILABLE');
    return data.signedUrl;
  }

  async download(objectPath: string) {
    const { data, error } = await this.bucket.download(objectPath);
    if (error) throw new Error('MEDIA_NOT_FOUND');
    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      contentType: data.type || null,
    };
  }

  async remove(objectPath: string) {
    const { error } = await this.bucket.remove([objectPath]);
    if (error) throw new Error('MEDIA_DELETE_FAILED');
  }
}
