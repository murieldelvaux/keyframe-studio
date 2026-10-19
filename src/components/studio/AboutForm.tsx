'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/client';
import { publicUrl } from '@/lib/storage';
import type { About } from '@/lib/types';
import { revalidatePublic } from '@/app/studio/actions';

export default function AboutForm({ about }: { about: About }) {
  const router = useRouter();
  const [name, setName] = useState(about.name);
  const [headline, setHeadline] = useState(about.headline ?? '');
  const [bio, setBio] = useState(about.bio ?? '');
  const [email, setEmail] = useState(about.email ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPath, setPhotoPath] = useState(about.photo_path);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const localPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const current = localPreview ?? publicUrl('profile', photoPath);

  async function save() {
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    try {
      let path = photoPath;
      if (photo) {
        const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        path = `profile-${Date.now()}.${ext}`;
        const up = await supabase.storage.from('profile').upload(path, photo, {
          contentType: photo.type,
        });
        if (up.error) throw up.error;
        if (photoPath) await supabase.storage.from('profile').remove([photoPath]);
      }

      const { error } = await supabase
        .from('about')
        .update({
          name,
          headline: headline || null,
          bio: bio || null,
          email: email || null,
          photo_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw error;

      setPhotoPath(path);
      setPhoto(null);
      await revalidatePublic();
      router.refresh();
      setMsg('Salvo.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, maxWidth: 620 }}>
      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="Foto de perfil" style={{ width: 240, display: 'block' }} />
      )}
      <Box>
        <Button component="label">
          {current ? 'Trocar foto' : 'Escolher foto'}
          <input hidden type="file" accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </Button>
      </Box>
      <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Subtítulo" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      <TextField label="Texto" value={bio} multiline minRows={8}
        onChange={(e) => setBio(e.target.value)} />
      <TextField label="E-mail de contato" value={email} onChange={(e) => setEmail(e.target.value)} />
      {msg && <Typography variant="body2">{msg}</Typography>}
      <Box>
        <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
      </Box>
    </Box>
  );
}
