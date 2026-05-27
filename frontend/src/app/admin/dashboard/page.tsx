'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import api from '@/services/api';

interface AnalyticsData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  appointmentsToday: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Admin Analytics Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Overview of the hospital's operational metrics.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {analytics && (
        <Grid container spacing={3}>
          {/* Total Patients Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center', bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Total Patients</Typography>
              <Typography variant="h3" fontWeight="bold">{analytics.totalPatients}</Typography>
            </Paper>
          </Grid>

          {/* Total Doctors Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Total Doctors</Typography>
              <Typography variant="h3" fontWeight="bold">{analytics.totalDoctors}</Typography>
            </Paper>
          </Grid>

          {/* Total Appointments Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center', bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom align="center">All Appointments</Typography>
              <Typography variant="h3" fontWeight="bold">{analytics.totalAppointments}</Typography>
            </Paper>
          </Grid>

          {/* Appointments Today Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center', bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom align="center">Appointments Today</Typography>
              <Typography variant="h3" fontWeight="bold">{analytics.appointmentsToday}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
