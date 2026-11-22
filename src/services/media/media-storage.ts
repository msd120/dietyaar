import 'server-only';

export type SignedUpload = { url: string; token: string; expiresInSeconds: number };

export interface MediaStorage {
  createSignedUpload(objectPath: string): Promise<SignedUpload>;
  createSignedDownload(objectPath: string, expiresInSeconds: number): Promise<string>;
  download(objectPath: string): Promise<{ bytes: Uint8Array; contentType: string | null }>;
  remove(objectPath: string): Promise<void>;
}
