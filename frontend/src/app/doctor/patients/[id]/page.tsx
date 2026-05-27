'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';

const recordSchema = z.object({
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

export default function DoctorPatientView({ params }: { params: { id: string } }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'DOCTOR') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: RecordFormValues) => {
    setError(null);
    setSuccess(false);
    
    let uploadedUrl = null;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const uploadRes = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedUrl = uploadRes.data.url;
      } catch (err: any) {
        setUploading(false);
        setError(err.response?.data?.message || 'Failed to upload file');
        return;
      }
    }

    try {
      await api.post('/records/', {
        patientId: params.id,
        attachmentUrl: uploadedUrl,
        ...data
      });
      setSuccess(true);
      reset();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add medical record');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Add Medical Record
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Patient ID: {params.id}
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Medical record added successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Diagnosis"
            {...register('diagnosis')}
            error={!!errors.diagnosis}
            helperText={errors.diagnosis?.message}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Prescription"
            multiline
            rows={3}
            {...register('prescription')}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Additional Notes"
            multiline
            rows={4}
            {...register('notes')}
          />
          
          <Box mt={2} mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Attach File (X-Ray, Lab Result, etc.)
            </Typography>
            <input
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="raised-button-file">
              <Button variant="outlined" component="span" disabled={isSubmitting || uploading}>
                Choose File
              </Button>
            </label>
            {selectedFile && <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>{selectedFile.name}</Typography>}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={isSubmitting || uploading}
          >
            {isSubmitting || uploading ? 'Saving...' : 'Save Record'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
