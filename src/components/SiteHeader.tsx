'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 2, md: 5 },
        py: 3,
      }}
    >
      <Link component={NextLink} href="/" underline="none">
        <Typography variant="h6" component="span">
          Lucas Henrique
        </Typography>
      </Link>
      <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Link component={NextLink} href="/">Trabalhos</Link>
        <Link component={NextLink} href="/about">Sobre</Link>
        <Link
          href="https://www.instagram.com/lucashhenrique/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de Lucas Henrique"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            opacity: 0.85,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}
        >
          <InstagramIcon size={19} />
        </Link>
      </Box>
    </Box>
  );
}
