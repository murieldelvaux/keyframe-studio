'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Atualiza as páginas públicas depois de uma alteração no estúdio. */
export async function revalidatePublic(videoId?: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) throw new Error('Não autorizado');
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/studio');
  if (videoId) {
    revalidatePath(`/work/${videoId}`);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
