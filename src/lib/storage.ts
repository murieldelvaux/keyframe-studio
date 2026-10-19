export type Bucket = 'videos' | 'thumbnails' | 'profile';

/** URL pública de um objeto do Storage (buckets públicos). */
export function publicUrl(bucket: Bucket, path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Limite por arquivo do plano Free do Supabase. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Converte links do YouTube/Vimeo em URL de embed. Retorna null para outros links. */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    /* URL inválida */
  }
  return null;
}
