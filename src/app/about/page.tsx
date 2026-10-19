import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import { publicUrl } from '@/lib/storage';
import type { About } from '@/lib/types';

export const metadata = { title: 'Sobre — Keyframe Studio' };

export default async function AboutPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('about').select('*').eq('id', 1).single();
  const about = data as About | null;
  const photo = publicUrl('profile', about?.photo_path);

  return (
    <Box
      component="main"
      sx={{
        display: 'grid',
        gap: { xs: 4, md: 8 },
        px: { xs: 2, md: 5 },
        pb: 10,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        alignItems: 'start',
      }}
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={about?.name ?? 'Foto'} style={{ width: '100%', display: 'block' }} />
      )}
      <Box>
        <Typography variant="h1" sx={{ mb: 1 }}>{about?.name}</Typography>
        {about?.headline && (
          <Typography color="text.secondary" sx={{ mb: 4 }}>{about.headline}</Typography>
        )}
        <Typography sx={{ whiteSpace: 'pre-line', mb: 4 }}>{about?.bio}</Typography>
        {about?.email && (
          <Typography component="a" href={`mailto:${about.email}`} sx={{ color: 'inherit' }}>
            {about.email}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
