export type Bucket = 'videos' | 'thumbnails' | 'profile';

/** URL pública de um objeto do Storage (buckets públicos). */
export function publicUrl(bucket: Bucket, path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Limite por arquivo do plano Free do Supabase. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
