'use client';
import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const FRAME = 1 / 30; // passo aproximado de 1 frame (30 fps)

type Props = {
  /** URL local (blob:) do vídeo — evita canvas "tainted" por CORS. */
  src: string;
  onCapture: (blob: Blob) => void;
};

export default function FrameCapture({ src, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  function step(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
  }

  async function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    v.pause();

    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    if (!blob) return;

    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
    onCapture(blob);
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
          style={{ width: '100%', maxHeight: 520, display: 'block' }}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" onClick={() => step(-FRAME)}>◀ 1 frame</Button>
        <Button size="small" onClick={() => step(FRAME)}>1 frame ▶</Button>
        <Button onClick={capture} disabled={!paused}>Capturar capa</Button>
      </Box>
      {!paused && (
        <Typography variant="body2" color="text.secondary">
          Pause o vídeo no frame desejado para capturar.
        </Typography>
      )}

      {preview && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Capa selecionada
          </Typography>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Capa capturada" style={{ width: 320, display: 'block' }} />
        </Box>
      )}
    </Box>
  );
}
