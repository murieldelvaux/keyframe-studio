import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import { createClient } from '@/lib/supabase/server';
import StudioNav from '@/components/studio/StudioNav';

export const metadata = { title: 'Estúdio', robots: { index: false, follow: false } };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/login');

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, pb: 10 }}>
      <StudioNav />
      {children}
    </Box>
  );
}
