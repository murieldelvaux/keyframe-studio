import Typography from '@mui/material/Typography';
import NewVideoForm from '@/components/studio/NewVideoForm';

export default function NewVideoPage() {
  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>Novo vídeo</Typography>
      <NewVideoForm />
    </>
  );
}
