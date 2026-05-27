'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, Grid, Divider, CircularProgress, Card, CardContent } from '@mui/material';
import api from '@/services/api';

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  bloodGroup: string;
  contactNumber: string;
  address: string;
}

interface MedicalRecord {
  id: string;
  doctorName: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  createdAt: string;
}

export default function PatientDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const profileRes = await api.get('/patients/me');
        setProfile(profileRes.data);

        if (profileRes.data.id) {
          const recordsRes = await api.get(`/records/patient/${profileRes.data.id}`);
          setRecords(recordsRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome, {user?.firstName}
      </Typography>

      <Grid container spacing={3}>
        {/* Personal Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Divider sx={{ mb: 2 }} />
            {profile ? (
              <Box>
                <Typography variant="body1"><strong>Email:</strong> {profile.email}</Typography>
                <Typography variant="body1"><strong>DOB:</strong> {profile.dateOfBirth || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Blood Group:</strong> {profile.bloodGroup || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Contact:</strong> {profile.contactNumber || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Address:</strong> {profile.address || 'N/A'}</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">Profile information not available. Please complete your registration.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Medical Records */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Medical History</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {records.length === 0 ? (
              <Typography variant="body1" color="textSecondary">No medical records found.</Typography>
            ) : (
              records.map((record) => (
                <Card key={record.id} sx={{ mb: 2, variant: 'outlined' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">{record.diagnosis}</Typography>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {new Date(record.createdAt).toLocaleDateString()} - {record.doctorName}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      <strong>Prescription:</strong> {record.prescription || 'None'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      <strong>Notes:</strong> {record.notes || 'None'}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
