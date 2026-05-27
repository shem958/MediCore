'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress, Alert, TextField } from '@mui/material';
import api from '@/services/api';

interface DoctorSchedule {
  id: string;
  doctorName: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export default function BookAppointment() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  
  // State for the selected slot and the reason
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'PATIENT') {
      router.push('/login');
      return;
    }

    fetchSchedules();
  }, [isAuthenticated, user, router]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/schedules/available');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedScheduleId) return;
    
    setBookingError(null);
    setBookingSuccess(null);
    
    try {
      await api.post('/appointments/book', {
        scheduleId: selectedScheduleId,
        reasonForVisit: reasonForVisit
      });
      
      setBookingSuccess("Appointment booked successfully!");
      setSelectedScheduleId(null);
      setReasonForVisit('');
      
      // Refresh available slots
      fetchSchedules();
    } catch (error: any) {
      setBookingError(error.response?.data?.message || 'Failed to book appointment');
    }
  };

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
        Book an Appointment
      </Typography>

      {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
      {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}

      <Grid container spacing={4}>
        {/* Available Slots */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Available Time Slots</Typography>
            
            {schedules.length === 0 ? (
              <Typography variant="body1" color="textSecondary">
                No available appointments at this time. Please check back later.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {schedules.map((slot) => (
                  <Grid item xs={12} sm={6} key={slot.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        borderColor: selectedScheduleId === slot.id ? 'primary.main' : 'divider',
                        borderWidth: selectedScheduleId === slot.id ? 2 : 1,
                        bgcolor: selectedScheduleId === slot.id ? 'action.hover' : 'background.paper'
                      }}
                      onClick={() => setSelectedScheduleId(slot.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" color="primary">{slot.doctorName}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Date:</strong> {slot.availableDate}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Confirm Booking</Typography>
            
            {!selectedScheduleId ? (
              <Typography variant="body2" color="textSecondary">
                Please select an available time slot from the left to proceed.
              </Typography>
            ) : (
              <Box component="form" noValidate sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Reason for Visit (Optional)"
                  multiline
                  rows={4}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="E.g., Follow-up checkup, recurring headache..."
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, py: 1.5 }}
                  onClick={handleBook}
                >
                  Confirm Appointment
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
