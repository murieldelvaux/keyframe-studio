'use client';
import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const FRAME = 1 / 30; // passo aproximado de 1 frame (30 fps)

type Props = {
  /** URL local (blob:) do vídeo — evita canvas "tainted" por CORS. */
  src: string;
  onSetCover: (blob: Blob) => void;
  onAddFrame: (blob: Blob) => void;
};

export default function FrameCapture({ src, onSetCover, onAddFrame }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  function step(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
  }

  /** Desenha o frame atual em um canvas e devolve um JPEG. */
  async function grab(): Promise<Blob | null> {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    v.pause();
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }

  async function capture(kind: 'cover' | 'frame') {
    const blob = await grab();
    if (!blob) return;
    (kind === 'cover' ? onSetCover : onAddFrame)(blob);
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ bgcolor: '#000' }}>
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          style={{ width: '100%', maxHeight: 520, display: 'block' }}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" onClick={() => step(-FRAME)}>◀ 1 frame</Button>
        <Button size="small" onClick={() => step(FRAME)}>1 frame ▶</Button>
        <Button onClick={() => capture('cover')} disabled={!paused}>Definir como capa</Button>
        <Button onClick={() => capture('frame')} disabled={!paused}>Adicionar aos frames</Button>
      </Box>
      {!paused && (
        <Typography variant="body2" color="text.secondary">
          Pause o vídeo no frame desejado para capturar.
        </Typography>
      )}
    </Box>
  );
}
