'use client';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/client';
import { publicUrl } from '@/lib/storage';
import type { Video } from '@/lib/types';
import { revalidatePublic } from '@/app/studio/actions';

export default function VideoList({ videos }: { videos: Video[] }) {
  const router = useRouter();

  async function togglePublished(v: Video) {
    await createClient().from('videos').update({ published: !v.published }).eq('id', v.id);
    await revalidatePublic();
    router.refresh();
  }

  async function remove(v: Video) {
    if (!confirm(`Remover "${v.title}"?`)) return;
    const supabase = createClient();
    if (v.video_path) await supabase.storage.from('videos').remove([v.video_path]);
    if (v.thumbnail_path) await supabase.storage.from('thumbnails').remove([v.thumbnail_path]);
    await supabase.from('videos').delete().eq('id', v.id);
    await revalidatePublic();
    router.refresh();
  }

  if (videos.length === 0) {
    return <Typography color="text.secondary">Nenhum vídeo ainda.</Typography>;
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {videos.map((v) => {
        const thumb = publicUrl('thumbnails', v.thumbnail_path);
        return (
          <Box key={v.id} sx={{ display: 'flex', gap: 2, alignItems: 'center',
            borderBottom: 1, borderColor: 'divider', pb: 2 }}>
            <Box sx={{ width: 160, aspectRatio: '16 / 9', bgcolor: '#f2f2f2', flexShrink: 0 }}>
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography>{v.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {v.published ? 'Publicado' : 'Rascunho'}{v.year ? ` · ${v.year}` : ''}
              </Typography>
            </Box>
            <Button size="small" onClick={() => togglePublished(v)}>
              {v.published ? 'Despublicar' : 'Publicar'}
            </Button>
            <Button size="small" onClick={() => remove(v)}>Remover</Button>
          </Box>
        );
      })}
    </Box>
  );
}
