'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';

const scheduleSchema = z.object({
  availableDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function DoctorSchedule() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'DOCTOR') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: ScheduleFormValues) => {
    setError(null);
    setSuccess(false);
    
    // Ensure times include seconds for LocalTime backend parsing (HH:mm:ss)
    const payload = {
      availableDate: data.availableDate,
      startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
      endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
    };

    try {
      await api.post('/schedules/', payload);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add schedule slot');
    }
  };

  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Manage Schedule
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add available time slots for patients to book appointments.
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Schedule slot added successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            type="date"
            label="Available Date"
            InputLabelProps={{ shrink: true }}
            {...register('availableDate')}
            error={!!errors.availableDate}
            helperText={errors.availableDate?.message}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              required
              fullWidth
              type="time"
              label="Start Time"
              InputLabelProps={{ shrink: true }}
              {...register('startTime')}
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
            />
            <TextField
              required
              fullWidth
              type="time"
              label="End Time"
              InputLabelProps={{ shrink: true }}
              {...register('endTime')}
              error={!!errors.endTime}
              helperText={errors.endTime?.message}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 4, py: 1.5 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Add Slot'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
