import { createClient } from '@/lib/supabase/server';
import VideoGrid from '@/components/VideoGrid';
import type { Video } from '@/lib/types';

export const metadata = { title: 'Trabalhos — Keyframe Studio' };

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .not('thumbnail_path', 'is', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <main>
      <VideoGrid videos={(data ?? []) as Video[]} />
    </main>
  );
}
