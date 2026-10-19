'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Video } from '@/lib/types';
import { publicUrl } from '@/lib/storage';

export default function VideoGrid({ videos }: { videos: Video[] }) {
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
              component={NextLink}
              href={`/work/${v.id}`}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'block',
                '&:hover img': { opacity: 0.8 },
              }}
            >
              <Box sx={{ aspectRatio: '16 / 9', bgcolor: '#161616', overflow: 'hidden' }}>
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

    </>
  );
}
