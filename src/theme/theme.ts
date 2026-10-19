'use client';
import { createTheme, type Shadows } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0a0a', paper: '#0a0a0a' },
    text: { primary: '#f2f2f2', secondary: '#8a8a8a' },
    primary: { main: '#f2f2f2' },
    divider: '#262626',
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: 'var(--font-inter), Helvetica, Arial, sans-serif',
    h1: { fontWeight: 300, fontSize: '2.4rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 300, fontSize: '1.8rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 400, letterSpacing: '0.02em' },
    body1: { lineHeight: 1.75 },
    button: { textTransform: 'none', letterSpacing: '0.04em', fontWeight: 400 },
  },
  // Sem sombras em nenhum nível de elevação.
  shadows: Array(25).fill('none') as Shadows,
  components: {
    MuiButton: { defaultProps: { disableElevation: true, variant: 'outlined' } },
    MuiPaper: { defaultProps: { elevation: 0, square: true } },
    MuiCard: { defaultProps: { elevation: 0, square: true } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiLink: { defaultProps: { underline: 'hover', color: 'inherit' } },
  },
});

export default theme;
