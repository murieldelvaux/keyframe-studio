import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import EditVideoForm from '@/components/studio/EditVideoForm';
import type { Video } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditVideoPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = await createClient();
  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!video) {
    notFound();
  }

  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Editar vídeo
      </Typography>
      <EditVideoForm video={video as Video} />
    </>
  );
}
