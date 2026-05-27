'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress, Alert, Chip } from '@mui/material';
import api from '@/services/api';

interface Invoice {
  id: string;
  doctorName: string;
  appointmentDate: string;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
}

export default function PatientBilling() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'PATIENT') {
      router.push('/login');
      return;
    }

    fetchInvoices();
  }, [isAuthenticated, user, router]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/invoices/me');
      setInvoices(response.data);
    } catch (err: any) {
      setError('Failed to fetch billing history');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    setError(null);
    setPaymentSuccess(null);
    try {
      await api.put(`/invoices/${invoiceId}/pay`);
      setPaymentSuccess("Payment successful! Thank you.");
      // Update local state to reflect payment
      setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'PAID' } : inv));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingId(null);
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
        Billing & Invoices
      </Typography>

      {paymentSuccess && <Alert severity="success" sx={{ mb: 3 }}>{paymentSuccess}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {invoices.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="textSecondary">
            You have no billing history at this time.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {invoices.map((inv) => (
            <Grid item xs={12} md={6} key={inv.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderColor: inv.status === 'UNPAID' || inv.status === 'OVERDUE' ? 'warning.main' : 'divider' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      ${inv.amount.toFixed(2)}
                    </Typography>
                    <Chip 
                      label={inv.status} 
                      color={inv.status === 'PAID' ? 'success' : (inv.status === 'OVERDUE' ? 'error' : 'warning')} 
                      size="small"
                      fontWeight="bold"
                    />
                  </Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Doctor:</strong> {inv.doctorName}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Appointment Date:</strong> {inv.appointmentDate}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontSize: '0.85rem' }}>
                    Issued: {inv.issuedDate} | Due: {inv.dueDate}
                  </Typography>
                  
                  {(inv.status === 'UNPAID' || inv.status === 'OVERDUE') && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      sx={{ mt: 3 }}
                      disabled={processingId === inv.id}
                      onClick={() => handlePay(inv.id)}
                    >
                      {processingId === inv.id ? 'Processing...' : 'Pay Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
