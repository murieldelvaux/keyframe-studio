import { createClient } from '@/lib/supabase/server';
import VideoList from '@/components/studio/VideoList';
import type { Video } from '@/lib/types';

export default async function StudioHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('videos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return <VideoList videos={(data ?? []) as Video[]} />;
}
