'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { signOut } from '@/app/studio/actions';

export default function StudioNav() {
  return (
    <Box
      component="nav"
      sx={{ display: 'flex', gap: 3, alignItems: 'center', borderBottom: 1,
        borderColor: 'divider', pb: 2, mb: 4 }}
    >
      <Link component={NextLink} href="/studio">Vídeos</Link>
      <Link component={NextLink} href="/studio/videos/new">Novo vídeo</Link>
      <Link component={NextLink} href="/studio/about">Sobre</Link>
      <Link component={NextLink} href="/studio/password">Segurança</Link>
      <Box component="form" action={signOut} sx={{ ml: 'auto' }}>
        <Button type="submit" size="small">Sair</Button>
      </Box>
    </Box>
  );
}
