import Typography from '@mui/material/Typography';
import ChangePasswordForm from '@/components/studio/ChangePasswordForm';

export const metadata = { title: 'Alterar Senha — Estúdio' };

export default function PasswordPage() {
  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>Alterar Senha</Typography>
      <ChangePasswordForm />
    </>
  );
}
