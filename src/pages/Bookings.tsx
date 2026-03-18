import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Avatar, 
  Stack, 
  Chip,
  useTheme,
  alpha,
  Paper,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Badge,
  Skeleton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  CalendarMonth as Calendar, 
  AccessTime as Clock, 
  LocationOn as MapPin, 
  CheckCircle, 
  Cancel as XCircle, 
  History as Clock4, 
  ChatBubbleOutline as MessageSquare, 
  Check, 
  Close as X, 
  ReceiptLong as Receipt, 
  CreditCard, 
  ErrorOutline as AlertCircle, 
  Shield as ShieldAlert,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { PaymentModal } from '../components/PaymentModal';

import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export const Bookings = () => {
  const { user, profile } = useAuth();
  const theme = useTheme();
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;

    const field = profile?.role === 'provider' ? 'providerId' : 'customerId';
    
    // Listen to bookings
    const qBookings = query(
      collection(db, 'bookings'),
      where(field, '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const bookingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    // Listen to invoices
    const qInvoices = query(
      collection(db, 'invoices'),
      where(field, '==', user.uid)
    );

    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    return () => {
      unsubscribeBookings();
      unsubscribeInvoices();
    };
  }, [user, profile]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string, finalPrice?: number) => {
    setUpdatingId(bookingId);
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (finalPrice !== undefined) {
        updateData.totalAmount = finalPrice;
      }
      await updateDoc(doc(db, 'bookings', bookingId), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
    setUpdatingId(null);
    setCustomPrice(null);
  };

  const addMilestone = async (bookingId: string, title: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const newMilestones = [...(booking.milestones || []), {
      title,
      status: 'pending',
      date: new Date().toISOString()
    }];

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        milestones: newMilestones,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const toggleMilestone = async (bookingId: string, idx: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const newMilestones = [...booking.milestones];
    newMilestones[idx].status = newMilestones[idx].status === 'completed' ? 'pending' : 'completed';

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        milestones: newMilestones,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const generateInvoice = async (booking: any) => {
    setUpdatingId(booking.id);
    try {
      await addDoc(collection(db, 'invoices'), {
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        amount: booking.totalAmount,
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        items: [
          { description: `${booking.serviceId} Service Fee`, amount: booking.totalAmount }
        ],
        createdAt: new Date().toISOString()
      });
      
      // Update booking to show it's been invoiced
      await updateDoc(doc(db, 'bookings', booking.id), {
        invoiced: true,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
    setUpdatingId(null);
  };

  const handlePayInvoice = (bookingId: string) => {
    const invoice = invoices.find(inv => inv.bookingId === bookingId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setIsPaymentModalOpen(true);
    }
  };

  const handleRaiseDispute = async (bookingId: string) => {
    const reason = window.prompt('Please enter the reason for the dispute:');
    if (!reason) return;

    try {
      await addDoc(collection(db, 'disputes'), {
        bookingId,
        raisedBy: user?.uid,
        reason,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'disputed',
        updatedAt: new Date().toISOString()
      });
      alert('Dispute raised successfully. Our team will review it shortly.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'disputes');
    }
  };

  const handleApproveWork = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to approve this work? This will release the funds to the provider.')) return;
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    try {
      // 1. Update booking
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        escrowStatus: 'released',
        updatedAt: new Date().toISOString()
      });

      // 2. Update provider's wallet
      await updateDoc(doc(db, 'wallets', booking.providerId), {
        pendingBalance: increment(-booking.totalAmount),
        balance: increment(booking.totalAmount),
        totalEarned: increment(booking.totalAmount),
        updatedAt: new Date().toISOString()
      });

      alert('Work approved and funds released!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const handleRequestRevision = async (bookingId: string) => {
    const reason = window.prompt('Please specify what needs to be revised:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'revision_requested',
        workDetails: `REVISION REQUESTED: ${reason}`,
        updatedAt: new Date().toISOString()
      });
      alert('Revision requested. The provider has been notified.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const handleReportUser = async (reportedId: string, bookingId?: string) => {
    const reason = window.prompt('Reason for reporting this user:');
    if (!reason) return;
    const details = window.prompt('Additional details (optional):');

    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user?.uid,
        reportedId,
        bookingId: bookingId || null,
        reason,
        details: details || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert('Report submitted. We will investigate this matter.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'revision_requested': return 'secondary';
      case 'disputed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'rejected': return <XCircle sx={{ fontSize: 14 }} />;
      case 'completed': return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'pending': return <Clock4 sx={{ fontSize: 14 }} />;
      default: return null;
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return b.status === 'pending';
    if (tabValue === 2) return b.status === 'accepted' || b.status === 'revision_requested';
    if (tabValue === 3) return b.status === 'completed';
    return true;
  });

  if (loading) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }} color="text.secondary">Loading bookings...</Typography>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Your Bookings</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${bookings.length} Total`} size="small" sx={{ fontWeight: 800 }} />
        </Box>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            px: 2,
            '& .MuiTab-root': { py: 2, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }
          }}
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      <Stack spacing={3}>
        {filteredBookings.map((booking) => {
          const invoice = invoices.find(inv => inv.bookingId === booking.id);
          
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card sx={{ 
                borderRadius: 4, 
                border: '1px solid', 
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': { boxShadow: theme.shadows[4] }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Stack direction="row" spacing={2}>
                        <Avatar 
                          variant="rounded"
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontSize: '1.5rem'
                          }}
                        >
                          {booking.serviceId === 'Plumbing' ? '🚰' : booking.serviceId === 'Electrical' ? '⚡' : '🧹'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={800}>{booking.serviceId} Service</Typography>
                            <Chip 
                              icon={getStatusIcon(booking.status) as any}
                              label={booking.status.toUpperCase()} 
                              size="small"
                              color={getStatusColor(booking.status) as any}
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                            />
                            {invoice && (
                              <Chip 
                                icon={<Receipt sx={{ fontSize: '10px !important' }} />}
                                label={invoice.status.toUpperCase()} 
                                size="small"
                                color={invoice.status === 'paid' ? 'success' : 'warning'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                            {profile?.role === 'provider' ? 'Customer' : 'Provider'}: {booking.id.slice(0, 8)}
                          </Typography>
                          
                          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <Calendar sx={{ fontSize: 14 }} />
                              <Typography variant="caption" fontWeight={700}>{booking.bookingDate}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <Clock sx={{ fontSize: 14 }} />
                              <Typography variant="caption" fontWeight={700}>{booking.bookingTime}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <MapPin sx={{ fontSize: 14 }} />
                              <Typography variant="caption" fontWeight={700}>{booking.address || 'Service Location'}</Typography>
                            </Box>
                          </Stack>

                          {/* Details Section */}
                          <Stack spacing={2}>
                            {booking.workDetails && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem', mb: 0.5 }}>
                                  Work Details
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {booking.workDetails}
                                </Typography>
                              </Box>
                            )}
                            
                            {booking.deadline && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem', mb: 0.5 }}>
                                  Deadline
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {format(new Date(booking.deadline), 'PPP')}
                                </Typography>
                              </Box>
                            )}

                            {/* Milestones Section */}
                            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem', mb: 1.5 }}>
                                Project Milestones
                              </Typography>
                              <Stack spacing={1}>
                                {booking.milestones?.map((m: any, idx: number) => (
                                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'grey.50', p: 1.5, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <IconButton 
                                        size="small"
                                        onClick={() => profile?.role === 'provider' && toggleMilestone(booking.id, idx)}
                                        sx={{ 
                                          p: 0,
                                          width: 20, 
                                          height: 20, 
                                          bgcolor: m.status === 'completed' ? 'success.main' : 'background.paper',
                                          color: m.status === 'completed' ? 'white' : 'divider',
                                          border: '1px solid',
                                          borderColor: m.status === 'completed' ? 'success.main' : 'divider',
                                          '&:hover': { bgcolor: m.status === 'completed' ? 'success.dark' : 'action.hover' }
                                        }}
                                      >
                                        {m.status === 'completed' && <Check sx={{ fontSize: 12 }} />}
                                      </IconButton>
                                      <Typography variant="body2" sx={{ 
                                        fontSize: '0.75rem', 
                                        color: m.status === 'completed' ? 'text.disabled' : 'text.primary',
                                        textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                                        fontWeight: 600
                                      }}>
                                        {m.title}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.disabled">
                                      {format(new Date(m.date), 'MMM d')}
                                    </Typography>
                                  </Box>
                                ))}
                                {profile?.role === 'provider' && (
                                  <TextField 
                                    size="small"
                                    placeholder="Add milestone..."
                                    variant="outlined"
                                    sx={{ 
                                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper', fontSize: '0.7rem' }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addMilestone(booking.id, (e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                )}
                                {(!booking.milestones || booking.milestones.length === 0) && (
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                    No milestones set yet.
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem' }}>
                            Total Amount
                          </Typography>
                          <Typography variant="h5" fontWeight={800} color="primary.main">
                            Rs. {booking.totalAmount}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                          <Tooltip title="Message">
                            <IconButton 
                              component={Link} 
                              to="/messages" 
                              size="small" 
                              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                            >
                              <MessageSquare fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Report User">
                            <IconButton 
                              onClick={() => handleReportUser(profile?.role === 'provider' ? booking.customerId : booking.providerId, booking.id)}
                              size="small" 
                              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, color: 'error.main' }}
                            >
                              <ShieldAlert fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <Box sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {profile?.role === 'customer' && booking.status === 'completed' && booking.escrowStatus === 'held' && (
                            <>
                              <Button 
                                fullWidth
                                variant="contained" 
                                size="small"
                                onClick={() => handleApproveWork(booking.id)}
                                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                              >
                                Approve Work
                              </Button>
                              <Button 
                                fullWidth
                                variant="outlined" 
                                size="small"
                                color="warning"
                                onClick={() => handleRequestRevision(booking.id)}
                                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                              >
                                Request Revision
                              </Button>
                            </>
                          )}
                          
                          {profile?.role === 'provider' && (
                            <Stack spacing={1} sx={{ width: '100%' }}>
                              {booking.status === 'pending' && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'grey.50' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                    Final Price (Optional)
                                  </Typography>
                                  <TextField 
                                    fullWidth
                                    size="small"
                                    type="number"
                                    placeholder={`Default: Rs. ${booking.totalAmount}`}
                                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2, fontSize: '0.75rem' } }}
                                  />
                                  <Stack direction="row" spacing={1}>
                                    <Button 
                                      fullWidth
                                      variant="contained" 
                                      size="small"
                                      onClick={() => handleStatusUpdate(booking.id, 'accepted', customPrice || booking.totalAmount)}
                                      disabled={updatingId === booking.id}
                                      startIcon={<Check />}
                                      sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.65rem' }}
                                    >
                                      Accept
                                    </Button>
                                    <Button 
                                      fullWidth
                                      variant="outlined" 
                                      size="small"
                                      color="error"
                                      onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                      disabled={updatingId === booking.id}
                                      startIcon={<X />}
                                      sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.65rem' }}
                                    >
                                      Reject
                                    </Button>
                                  </Stack>
                                </Paper>
                              )}
                              {(booking.status === 'accepted' || booking.status === 'revision_requested') && (
                                <Button 
                                  fullWidth
                                  variant="contained" 
                                  size="small"
                                  onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                  disabled={updatingId === booking.id}
                                  sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                                >
                                  {booking.status === 'revision_requested' ? 'Submit Revision' : 'Mark Completed'}
                                </Button>
                              )}
                              {booking.status === 'completed' && !invoice && (
                                <Button 
                                  fullWidth
                                  variant="contained" 
                                  size="small"
                                  color="inherit"
                                  onClick={() => generateInvoice(booking)}
                                  disabled={updatingId === booking.id}
                                  startIcon={<Receipt />}
                                  sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem', bgcolor: 'grey.900', color: 'white', '&:hover': { bgcolor: 'grey.800' } }}
                                >
                                  Generate Invoice
                                </Button>
                              )}
                            </Stack>
                          )}

                          {profile?.role === 'customer' && invoice && invoice.status === 'pending' && (
                            <Button 
                              fullWidth
                              variant="contained" 
                              size="small"
                              onClick={() => handlePayInvoice(booking.id)}
                              startIcon={<CreditCard />}
                              sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem', boxShadow: theme.shadows[4] }}
                            >
                              Pay Invoice
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredBookings.length === 0 && (
          <Paper sx={{ py: 12, textAlign: 'center', borderRadius: 6, border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Typography variant="h1" sx={{ mb: 2 }}>📅</Typography>
            <Typography variant="h6" fontWeight={800}>No bookings yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              When you book a service, it will appear here.
            </Typography>
            <Button component={Link} to="/search" variant="text" sx={{ fontWeight: 800 }}>
              Browse Services
            </Button>
          </Paper>
        )}
      </Stack>

      {selectedInvoice && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={selectedInvoice}
          onSuccess={() => {
            // Success logic handled in modal
          }}
        />
      )}
    </Container>
  );
};
