'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip } from '@mui/material';
import api from '@/services/api';

interface Invoice {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  amount: number;
  status: string;
  dueDate: string;
}

export default function AdminBillingDefaulters() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchUnpaidInvoices = async () => {
      try {
        const res = await api.get('/invoices/unpaid');
        setInvoices(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load unpaid invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchUnpaidInvoices();
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
      <Typography variant="h4" gutterBottom fontWeight="bold" color="error.main">
        Defaulter Tracking
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        List of all patients with unpaid or overdue invoices.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell><strong>Patient Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Amount Owed</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="success.main">
                      Great news! There are no unpaid invoices.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell>{inv.patientName}</TableCell>
                    <TableCell>{inv.patientEmail}</TableCell>
                    <TableCell>${inv.amount.toFixed(2)}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <Chip 
                        label={inv.status} 
                        color={inv.status === 'OVERDUE' ? 'error' : 'warning'} 
                        size="small"
                        fontWeight="bold"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
