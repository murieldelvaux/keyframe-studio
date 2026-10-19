'use client';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { createClient } from '@/lib/supabase/client';
import { MAX_UPLOAD_BYTES } from '@/lib/storage';
import { revalidatePublic } from '@/app/studio/actions';
import FrameCapture from './FrameCapture';

type Picked = { key: string; blob: Blob; url: string };

function pick(blob: Blob): Picked {
  return { key: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) };
}

export default function NewVideoForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [cover, setCover] = useState<Picked | null>(null);
  const [frames, setFrames] = useState<Picked[]>([]);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File | null) {
    setLocalUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
    setFile(f);
    [cover, ...frames].forEach((p) => p && URL.revokeObjectURL(p.url));
    setCover(null);
    setFrames([]);
  }

  function setCoverBlob(blob: Blob) {
    if (cover) URL.revokeObjectURL(cover.url);
    setCover(pick(blob));
  }

  function removeFrame(key: string) {
    setFrames((fs) => {
      fs.filter((f) => f.key === key).forEach((f) => URL.revokeObjectURL(f.url));
      return fs.filter((f) => f.key !== key);
    });
  }

  function moveFrame(index: number, dir: -1 | 1) {
    setFrames((fs) => {
      const j = index + dir;
      if (j < 0 || j >= fs.length) return fs;
      const copy = [...fs];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  }

  const tooBig = !!file && file.size > MAX_UPLOAD_BYTES;
  const sizeMb = file ? (file.size / 1024 / 1024).toFixed(1) : null;

  async function save() {
    setError(null);
    if (!file || !cover) return setError('Escolha o vídeo e capture a capa.');
    if (!title.trim()) return setError('Informe o título.');
    if (tooBig && !externalUrl.trim())
      return setError('O arquivo passa de 50 MB: informe o link externo do vídeo.');

    setSaving(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const thumbPath = `${id}.jpg`;

    try {
      const up = await supabase.storage
        .from('thumbnails')
        .upload(thumbPath, cover.blob, { contentType: 'image/jpeg', upsert: true });
      if (up.error) throw up.error;

      // Frames extras: thumbnails/<id>/frame-<n>.jpg, na ordem escolhida.
      const framePaths: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const path = `${id}/frame-${String(i + 1).padStart(2, '0')}.jpg`;
        const f = await supabase.storage
          .from('thumbnails')
          .upload(path, frames[i].blob, { contentType: 'image/jpeg', upsert: true });
        if (f.error) throw f.error;
        framePaths.push(path);
      }

      let videoPath: string | null = null;
      if (!tooBig) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        videoPath = `${id}.${ext}`;
        const v = await supabase.storage
          .from('videos')
          .upload(videoPath, file, { contentType: file.type, upsert: false });
        if (v.error) throw v.error;
      }

      const { error: dbError } = await supabase.from('videos').insert({
        id,
        title: title.trim(),
        description: description.trim() || null,
        year: year ? Number(year) : null,
        video_path: videoPath,
        external_url: externalUrl.trim() || null,
        thumbnail_path: thumbPath,
        frame_paths: framePaths,
        published,
      });
      if (dbError) throw dbError;

      await revalidatePublic();
      router.push('/studio');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, maxWidth: 820 }}>
      <Box>
        <Button component="label">
          {file ? 'Trocar vídeo' : 'Escolher vídeo'}
          <input
            hidden
            type="file"
            accept="video/*"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </Button>
        {file && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {file.name} — {sizeMb} MB
          </Typography>
        )}
      </Box>

      {localUrl && (
        <FrameCapture src={localUrl} onSetCover={setCoverBlob}
          onAddFrame={(b) => setFrames((fs) => [...fs, pick(b)])} />
      )}

      {cover && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Capa (miniatura da galeria)
          </Typography>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt="Capa" style={{ width: 320, display: 'block' }} />
        </Box>
      )}

      {frames.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Frames da página do vídeo ({frames.length}) — aparecem nesta ordem
          </Typography>
          <Box sx={{ display: 'grid', gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {frames.map((f, i) => (
              <Box key={f.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Frame ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {i + 1}
                  </Typography>
                  <IconButton size="small" aria-label="Mover para cima"
                    disabled={i === 0} onClick={() => moveFrame(i, -1)}>←</IconButton>
                  <IconButton size="small" aria-label="Mover para baixo"
                    disabled={i === frames.length - 1} onClick={() => moveFrame(i, 1)}>→</IconButton>
                  <IconButton size="small" aria-label="Remover frame"
                    onClick={() => removeFrame(f.key)}>✕</IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {tooBig && (
        <Typography variant="body2">
          Este arquivo tem mais de 50 MB (limite do plano gratuito) e não será enviado ao
          Storage. Hospede em outro lugar (Vimeo, YouTube…) e cole o link abaixo — a capa
          capturada ainda vai para o Supabase.
        </Typography>
      )}

      <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <TextField label="Ano" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
      <TextField label="Descrição" value={description} multiline minRows={3}
        onChange={(e) => setDescription(e.target.value)} />
      <TextField
        label={tooBig ? 'Link externo do vídeo (obrigatório)' : 'Link externo (opcional)'}
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
      />
      <FormControlLabel
        control={<Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} />}
        label="Publicar na galeria"
      />

      {error && <Typography color="error" variant="body2">{error}</Typography>}
      {saving && <LinearProgress />}
      <Box>
        <Button onClick={save} disabled={saving || !file || !cover}>Salvar</Button>
      </Box>
    </Box>
  );
}
