'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 6) {
      setMsg({ text: 'A senha deve ter no mínimo 6 caracteres.', error: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'As senhas não coincidem.', error: true });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (error) {
      setMsg({ text: error.message || 'Erro ao alterar senha.', error: true });
    } else {
      setMsg({ text: 'Senha atualizada com sucesso!', error: false });
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5, maxWidth: 400 }}>
      <TextField
        label="Nova Senha"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <TextField
        label="Confirmar Nova Senha"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      {msg && (
        <Typography variant="body2" color={msg.error ? 'error' : 'success.main'}>
          {msg.text}
        </Typography>
      )}

      <Box>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar Nova Senha'}
        </Button>
      </Box>
    </Box>
  );
}
