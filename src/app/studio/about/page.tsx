import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import AboutForm from '@/components/studio/AboutForm';
import type { About } from '@/lib/types';

export default async function StudioAboutPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('about').select('*').eq('id', 1).single();

  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>Sobre</Typography>
      <AboutForm about={data as About} />
    </>
  );
}
