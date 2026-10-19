'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function SiteHeader() {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        px: { xs: 2, md: 5 },
        py: 3,
      }}
    >
      <Link component={NextLink} href="/" underline="none">
        <Typography variant="h6" component="span">
          Lucas Henrique
        </Typography>
      </Link>
      <Box component="nav" sx={{ display: 'flex', gap: 3 }}>
        <Link component={NextLink} href="/">Trabalhos</Link>
        <Link component={NextLink} href="/about">Sobre</Link>
      </Box>
    </Box>
  );
}
