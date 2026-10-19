'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }
    router.push('/studio');
    router.refresh();
  }

  return (
    <Box
      component="main"
      sx={{ maxWidth: 360, mx: 'auto', mt: 8, px: 2, display: 'grid', gap: 2 }}
    >
      <Typography variant="h2">Entrar</Typography>
      <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2 }}>
        <TextField label="E-mail" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <TextField label="Senha" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
      </Box>
    </Box>
  );
}
