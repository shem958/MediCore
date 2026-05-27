'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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
  
  // Payment Modal State
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod('MPESA');
    setPhoneNumber('');
    setOpenPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setOpenPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    
    setProcessingPayment(true);
    setError(null);
    setPaymentSuccess(null);
    
    try {
      if (paymentMethod === 'MPESA') {
        if (!phoneNumber) {
          setError("Phone number is required for M-Pesa");
          setProcessingPayment(false);
          return;
        }
        await api.post(`/invoices/mpesa/stk-push`, {
          invoiceId: selectedInvoice.id,
          phoneNumber: phoneNumber
        });
        setPaymentSuccess("M-Pesa payment processed successfully!");
      } else {
        // Fallback to simulate regular payment for other methods (mock)
        await api.put(`/invoices/${selectedInvoice.id}/pay`);
        setPaymentSuccess(`Payment via ${paymentMethod} successful!`);
      }
      
      setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'PAID' } : inv));
      handleClosePaymentModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
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
                      KES {inv.amount.toFixed(2)}
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
                      onClick={() => handleOpenPaymentModal(inv)}
                    >
                      Pay Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Payment Modal */}
      <Dialog open={openPaymentModal} onClose={handleClosePaymentModal}>
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are paying KES {selectedInvoice?.amount.toFixed(2)} for your appointment on {selectedInvoice?.appointmentDate}.
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="MPESA">M-Pesa (STK Push)</MenuItem>
              <MenuItem value="CASH">Cash at Reception</MenuItem>
              <MenuItem value="INSURANCE">Insurance Claim</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
            </Select>
          </FormControl>

          {paymentMethod === 'MPESA' && (
            <TextField
              autoFocus
              margin="dense"
              label="Safaricom Phone Number"
              type="tel"
              fullWidth
              variant="outlined"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              helperText="You will receive an STK prompt on your phone to enter your PIN."
            />
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentModal} disabled={processingPayment}>Cancel</Button>
          <Button onClick={handleProcessPayment} variant="contained" color="success" disabled={processingPayment}>
            {processingPayment ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
