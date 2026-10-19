import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import { publicUrl } from '@/lib/storage';

function toEmbedUrl(url: string | null | undefined): string | null {
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
  } catch {}
  return null;
}
import type { Video } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

async function getVideo(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('videos').select('*').eq('id', id).maybeSingle();
  return data as Video | null;
}

export async function generateMetadata({ params }: Props) {
  const v = await getVideo((await params).id);
  return { title: v ? `${v.title} — Keyframe Studio` : 'Keyframe Studio' };
}

export default async function WorkPage({ params }: Props) {
  const video = await getVideo((await params).id);
  if (!video) notFound();

  const src = publicUrl('videos', video.video_path);
  const embed = toEmbedUrl(video.external_url);
  const frames = (video.frame_paths ?? []).map((p) => publicUrl('thumbnails', p)!);

  return (
    <Box component="main" sx={{ px: { xs: 2, md: 3 }, pb: 10 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: 5 }}>
        <Typography variant="h2" component="h1">{video.title}</Typography>
        {video.year && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>{video.year}</Typography>
        )}
        {video.description && (
          <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            {video.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {src ? (
          <video src={src} controls playsInline preload="metadata"
            poster={publicUrl('thumbnails', video.thumbnail_path) ?? undefined}
            style={{ width: '100%', display: 'block', background: '#000' }} />
        ) : embed ? (
          <Box sx={{ aspectRatio: '16 / 9', bgcolor: '#000' }}>
            <iframe src={embed} title={video.title} allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
          </Box>
        ) : (
          video.external_url && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Button href={video.external_url} target="_blank" rel="noopener noreferrer">
                Assistir
              </Button>
            </Box>
          )
        )}

        {frames.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt={`${video.title} — frame ${i + 1}`}
            loading="lazy" style={{ width: '100%', display: 'block' }} />
        ))}
      </Box>
    </Box>
  );
}
