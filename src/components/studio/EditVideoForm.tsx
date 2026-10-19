'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import { createClient } from '@/lib/supabase/client';
import { MAX_UPLOAD_BYTES, publicUrl } from '@/lib/storage';
import { revalidatePublic } from '@/app/studio/actions';
import type { Video } from '@/lib/types';
import FrameCapture from './FrameCapture';

type FrameItem =
  | {
      id: string;
      type: 'existing';
      path: string;
      url: string;
    }
  | {
      id: string;
      type: 'new';
      blob: Blob;
      url: string;
    };

type CoverState =
  | {
      type: 'existing';
      path: string;
      url: string;
    }
  | {
      type: 'new';
      blob: Blob;
      url: string;
    };

export default function EditVideoForm({ video }: { video: Video }) {
  const router = useRouter();

  // Dados básicos
  const [title, setTitle] = useState(video.title);
  const [year, setYear] = useState(video.year ? String(video.year) : '');
  const [description, setDescription] = useState(video.description ?? '');
  const [externalUrl, setExternalUrl] = useState(video.external_url ?? '');
  const [published, setPublished] = useState(video.published);

  // Vídeo
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(
    video.video_path ? publicUrl('videos', video.video_path) : null
  );

  // Capa
  const [cover, setCover] = useState<CoverState | null>(
    video.thumbnail_path
      ? {
          type: 'existing',
          path: video.thumbnail_path,
          url: publicUrl('thumbnails', video.thumbnail_path)!,
        }
      : null
  );

  // Frames existentes e novos
  const [frames, setFrames] = useState<FrameItem[]>(
    (video.frame_paths ?? []).map((path, idx) => ({
      id: `existing-${idx}-${path}`,
      type: 'existing',
      path,
      url: publicUrl('thumbnails', path)!,
    }))
  );

  // Paths de frames existentes que foram excluídos e devem ser limpos do Storage ao salvar
  const [deletedStoragePaths, setDeletedStoragePaths] = useState<string[]>([]);

  // Estados de salvamento e feedback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Troca de vídeo
  function pickNewVideo(f: File | null) {
    if (newVideoFile && videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    setNewVideoFile(f);
    if (f) {
      setVideoSrc(URL.createObjectURL(f));
    } else {
      setVideoSrc(video.video_path ? publicUrl('videos', video.video_path) : null);
    }
  }

  // Definir capa com blob
  function setCoverBlob(blob: Blob) {
    if (cover && cover.type === 'new') {
      URL.revokeObjectURL(cover.url);
    }
    setCover({
      type: 'new',
      blob,
      url: URL.createObjectURL(blob),
    });
  }

  // Definir capa a partir de upload de imagem
  function pickCoverImage(f: File | null) {
    if (!f) return;
    setCoverBlob(f);
  }

  // Adicionar novo frame capturado do vídeo
  function addFrameFromBlob(blob: Blob) {
    const newItem: FrameItem = {
      id: crypto.randomUUID(),
      type: 'new',
      blob,
      url: URL.createObjectURL(blob),
    };
    setFrames((fs) => [...fs, newItem]);
  }

  // Adicionar frames por upload de imagens
  function addFramesFromImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newItems: FrameItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      type: 'new',
      blob: f,
      url: URL.createObjectURL(f),
    }));
    setFrames((fs) => [...fs, ...newItems]);
  }

  // Remover frame
  function removeFrame(id: string) {
    setFrames((fs) => {
      const item = fs.find((f) => f.id === id);
      if (item) {
        if (item.type === 'existing') {
          setDeletedStoragePaths((paths) => [...paths, item.path]);
        } else {
          URL.revokeObjectURL(item.url);
        }
      }
      return fs.filter((f) => f.id !== id);
    });
  }

  // Reordenar frames
  function moveFrame(index: number, dir: -1 | 1) {
    setFrames((fs) => {
      const j = index + dir;
      if (j < 0 || j >= fs.length) return fs;
      const copy = [...fs];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  }

  // Definir um dos frames como a capa principal
  async function makeFrameCover(frame: FrameItem) {
    if (frame.type === 'new') {
      setCoverBlob(frame.blob);
    } else {
      try {
        const res = await fetch(frame.url);
        const blob = await res.blob();
        setCoverBlob(blob);
      } catch {
        setError('Não foi possível carregar a imagem deste frame como capa.');
      }
    }
  }

  const isTooBig = !!newVideoFile && newVideoFile.size > MAX_UPLOAD_BYTES;
  const newSizeMb = newVideoFile ? (newVideoFile.size / 1024 / 1024).toFixed(1) : null;

  async function save() {
    setError(null);
    if (!title.trim()) return setError('Informe o título.');
    if (!cover) return setError('O vídeo precisa de uma capa.');
    if (isTooBig && !externalUrl.trim()) {
      return setError('O arquivo passa de 50 MB: informe o link externo do vídeo.');
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // 1. Atualizar capa se for nova
      let thumbnailPath = video.thumbnail_path ?? `${video.id}.jpg`;
      if (cover.type === 'new') {
        const up = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailPath, cover.blob, { contentType: 'image/jpeg', upsert: true });
        if (up.error) throw up.error;
      }

      // 2. Fazer upload de novos frames
      const finalFramePaths: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame.type === 'existing') {
          finalFramePaths.push(frame.path);
        } else {
          // Novo frame capturado ou enviado
          const path = `${video.id}/frame-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
          const up = await supabase.storage
            .from('thumbnails')
            .upload(path, frame.blob, { contentType: 'image/jpeg', upsert: true });
          if (up.error) throw up.error;
          finalFramePaths.push(path);
        }
      }

      // 3. Atualizar arquivo de vídeo se um novo arquivo foi escolhido
      let videoPath = video.video_path;
      if (newVideoFile && !isTooBig) {
        const ext = newVideoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const newPath = `${video.id}.${ext}`;
        const v = await supabase.storage
          .from('videos')
          .upload(newPath, newVideoFile, { contentType: newVideoFile.type, upsert: true });
        if (v.error) throw v.error;
        if (video.video_path && video.video_path !== newPath) {
          await supabase.storage.from('videos').remove([video.video_path]);
        }
        videoPath = newPath;
      }

      // 4. Limpar frames excluídos do Storage
      if (deletedStoragePaths.length > 0) {
        await supabase.storage.from('thumbnails').remove(deletedStoragePaths);
      }

      // 5. Atualizar tabela de vídeos no banco
      const { error: dbError } = await supabase
        .from('videos')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          year: year ? Number(year) : null,
          video_path: videoPath,
          external_url: externalUrl.trim() || null,
          thumbnail_path: thumbnailPath,
          frame_paths: finalFramePaths,
          published,
        })
        .eq('id', video.id);

      if (dbError) throw dbError;

      // 6. Revalidar rotas públicas e estúdio
      await revalidatePublic(video.id);

      router.push('/studio');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar alterações.');
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, maxWidth: 840 }}>
      {/* Botões de Ação Topo */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Button component={Link} href="/studio" variant="text" size="small">
          ← Voltar para a lista
        </Button>
        <Button component={Link} href={`/work/${video.id}`} target="_blank" size="small">
          Ver página pública ↗
        </Button>
      </Box>

      {/* Seção de Vídeo e Player de Captura */}
      <Box sx={{ border: 1, borderColor: 'divider', p: 2.5, borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Vídeo e Captura de Frames
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <Button component="label" variant="outlined" size="small">
            {newVideoFile ? 'Trocar arquivo selecionado' : 'Substituir arquivo de vídeo'}
            <input
              hidden
              type="file"
              accept="video/*"
              onChange={(e) => pickNewVideo(e.target.files?.[0] ?? null)}
            />
          </Button>
          {newVideoFile && (
            <Typography variant="body2" color="text.secondary">
              Novo arquivo: {newVideoFile.name} ({newSizeMb} MB)
            </Typography>
          )}
        </Box>

        {videoSrc ? (
          <FrameCapture
            src={videoSrc}
            onSetCover={setCoverBlob}
            onAddFrame={addFrameFromBlob}
          />
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Este vídeo não possui arquivo hospedado no Storage (usa link externo). Se desejar capturar novos frames a partir do vídeo, selecione o arquivo de vídeo do seu computador acima ou envie imagens de frames abaixo.
          </Alert>
        )}
      </Box>

      {/* Capa Atual */}
      <Box sx={{ border: 1, borderColor: 'divider', p: 2.5, borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Capa Principal (Thumbnail da Galeria)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Esta é a imagem exibida na grade da página inicial e no poster do player.
        </Typography>

        {cover ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt="Capa do vídeo"
              style={{
                width: 280,
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid #333',
                display: 'block',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button component="label" size="small">
                Subir outra imagem de capa
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickCoverImage(e.target.files?.[0] ?? null)}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Dica: Você também pode clicar em &quot;Definir como capa&quot; no player acima ou em qualquer frame abaixo.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary">Nenhuma capa definida.</Typography>
        )}
      </Box>

      {/* Gerenciamento de Frames Extras */}
      <Box sx={{ border: 1, borderColor: 'divider', p: 2.5, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6">
              Frames da Página do Vídeo ({frames.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aparecem em sequência abaixo do player na página do projeto. Apague, reordene ou adicione novos.
            </Typography>
          </Box>

          <Button component="label" size="small" variant="outlined">
            + Adicionar imagens como frames
            <input
              hidden
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => addFramesFromImageFiles(e.target.files)}
            />
          </Button>
        </Box>

        {frames.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              mt: 2,
            }}
          >
            {frames.map((frame, index) => (
              <Box
                key={frame.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#121212',
                }}
              >
                <Box sx={{ position: 'relative', aspectRatio: '16 / 9', bgcolor: '#000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.url}
                    alt={`Frame ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {frame.type === 'new' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        bgcolor: 'primary.main',
                        color: '#000',
                        fontSize: 10,
                        fontWeight: 'bold',
                        px: 0.8,
                        py: 0.2,
                        borderRadius: 0.5,
                      }}
                    >
                      NOVO
                    </Box>
                  )}
                </Box>

                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 24 }}>
                    #{index + 1}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1, justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      aria-label="Mover para trás"
                      disabled={index === 0}
                      onClick={() => moveFrame(index, -1)}
                    >
                      ←
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Mover para frente"
                      disabled={index === frames.length - 1}
                      onClick={() => moveFrame(index, 1)}
                    >
                      →
                    </IconButton>
                  </Box>

                  <Button
                    size="small"
                    sx={{ fontSize: 10, minWidth: 'auto', px: 0.8 }}
                    onClick={() => makeFrameCover(frame)}
                  >
                    Capa
                  </Button>

                  <IconButton
                    size="small"
                    aria-label="Remover frame"
                    color="error"
                    onClick={() => removeFrame(frame.id)}
                  >
                    ✕
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            Nenhum frame extra. Use o player acima ou o botão &quot;Adicionar imagens como frames&quot;.
          </Typography>
        )}
      </Box>

      {/* Detalhes do Vídeo */}
      <Box sx={{ border: 1, borderColor: 'divider', p: 2.5, borderRadius: 1, display: 'grid', gap: 2.5 }}>
        <Typography variant="h6">Detalhes e Metadados</Typography>

        <TextField
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="Ano"
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Ex: 2026"
          fullWidth
        />

        <TextField
          label="Descrição"
          value={description}
          multiline
          minRows={3}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />

        <TextField
          label="Link externo do vídeo (YouTube, Vimeo, etc.)"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://vimeo.com/... ou https://youtube.com/..."
          fullWidth
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
          }
          label="Publicado na galeria principal"
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {saving && <LinearProgress />}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button onClick={save} disabled={saving} variant="contained" size="large">
          {saving ? 'Salvando alterações…' : 'Salvar alterações'}
        </Button>
        <Button component={Link} href="/studio" disabled={saving}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}
