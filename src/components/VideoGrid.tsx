'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { Video } from '@/lib/types';
import { publicUrl } from '@/lib/storage';

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<Video | null>(null);
  const activeSrc = active ? publicUrl('videos', active.video_path) : null;

  if (videos.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ px: { xs: 2, md: 5 } }}>
        Nenhum trabalho publicado ainda.
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          px: { xs: 2, md: 5 },
          pb: 8,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {videos.map((v) => {
          const thumb = publicUrl('thumbnails', v.thumbnail_path);
          return (
            <Box
              key={v.id}
              component="button"
              onClick={() => setActive(v)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'block',
                '&:hover img': { opacity: 0.8 },
              }}
            >
              <Box sx={{ aspectRatio: '16 / 9', bgcolor: '#f2f2f2', overflow: 'hidden' }}>
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={v.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'opacity .25s',
                    }}
                  />
                )}
              </Box>
              <Typography sx={{ mt: 1 }}>{v.title}</Typography>
              {v.year && (
                <Typography variant="body2" color="text.secondary">
                  {v.year}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Dialog open={!!active} onClose={() => setActive(null)} maxWidth="lg" fullWidth>
        {active && (
          <Box sx={{ bgcolor: '#000' }}>
            {activeSrc ? (
              <video src={activeSrc} controls autoPlay style={{ width: '100%', display: 'block' }} />
            ) : (
              <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Typography sx={{ mb: 2 }}>{active.title}</Typography>
                <Button href={active.external_url ?? '#'} target="_blank" rel="noopener noreferrer">
                  Assistir
                </Button>
              </Box>
            )}
          </Box>
        )}
        {active?.description && (
          <Typography sx={{ p: 3 }} color="text.secondary">
            {active.description}
          </Typography>
        )}
      </Dialog>
    </>
  );
}
