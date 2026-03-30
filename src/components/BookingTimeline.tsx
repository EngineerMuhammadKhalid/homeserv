import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { generateInvoicePDF } from '../utils/generatePDF';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Rating,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Check as CheckIcon, Download as DownloadIcon } from '@mui/icons-material';

const BOOKING_STATUSES = ['assigned', 'in_progress', 'completed', 'revision_requested'];
const TIMELINE_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Work Completed',
  revision_requested: 'Revision Requested'
};

interface BookingTimelineProps {
  booking: any;
  isProvider: boolean;
  invoice?: any;
  onStatusChange?: (bookingId: string, newStatus: string) => void;
}

export const BookingTimeline = ({ booking, isProvider, invoice, onStatusChange }: BookingTimelineProps) => {
  const [priceNegotiationOpen, setPriceNegotiationOpen] = useState(false);
  const [newPrice, setNewPrice] = useState<string>('');
  const [customerRating, setCustomerRating] = useState<number>(booking.customerRating || 0);
  const [customerReview, setCustomerReview] = useState(booking.customerReview || '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const currentStatusIdx = BOOKING_STATUSES.indexOf(booking.status || 'assigned');
  const { currency } = useCurrency();

  const handlePriceProposal = async () => {
    if (!newPrice) return alert('Please enter a price');
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        proposedPrice: parseFloat(newPrice),
        priceProposedBy: 'provider',
        priceProposedAt: new Date().toISOString(),
        status: 'pending_price_approval'
      });
      setPriceNegotiationOpen(false);
      onStatusChange?.(booking.id, 'pending_price_approval');
      alert('Price proposal sent to customer');
    } catch (err) {
      console.error(err);
      alert('Failed to send price proposal');
    }
  };

  const handlePriceApproval = async (approve: boolean) => {
    if (approve) {
      try {
        await updateDoc(doc(db, 'bookings', booking.id), {
          totalAmount: booking.proposedPrice,
          status: 'in_progress',
          priceApprovedAt: new Date().toISOString()
        });
        onStatusChange?.(booking.id, 'in_progress');
        alert('Price accepted. Proceeding with service.');
      } catch (err) {
        console.error(err);
      }
    } else {
      // Counter-offer with old price
      try {
        await updateDoc(doc(db, 'bookings', booking.id), {
          counterOffer: booking.totalAmount, // Original price
          status: 'pending_provider_acceptance',
          counterOfferAt: new Date().toISOString()
        });
        onStatusChange?.(booking.id, 'pending_provider_acceptance');
        alert('Counter-offer sent. Waiting for provider response.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProviderRejectOldPrice = async () => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        reason: 'Provider rejected old price offer',
        cancelledAt: new Date().toISOString()
      });
      onStatusChange?.(booking.id, 'cancelled');
      alert('Booking cancelled. You can now hire another service provider.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason) return alert('Please explain what needs revision');
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'revision_requested',
        revisionReason,
        revisionRequestedAt: new Date().toISOString()
      });
      onStatusChange?.(booking.id, 'revision_requested');
      setShowRevisionForm(false);
      setRevisionReason('');
      alert('Revision request sent to provider');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteBooking = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        customerRating,
        customerReview
      });
      onStatusChange?.(booking.id, 'completed');
      alert('Booking marked as complete. Rating submitted.');
    } catch (err) {
      console.error(err);
    }
    setSubmittingReview(false);
  };

  const handleProviderAcceptOldPrice = async () => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'in_progress',
        totalAmount: booking.counterOffer,
        updatedAt: new Date().toISOString()
      });
      onStatusChange?.(booking.id, 'in_progress');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Timeline Stepper */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>
          Booking Progress
        </Typography>
        <Stepper activeStep={currentStatusIdx} sx={{ width: '100%' }}>
          {BOOKING_STATUSES.map((status) => (
            <Step key={status}>
              <StepLabel>{TIMELINE_LABELS[status]}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Price Negotiation (Customer) */}
      {booking.status === 'pending_price_approval' && !isProvider && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Box>
              <Typography variant="body2" fontWeight={700} mb={1}>
                Provider Proposed Price: {formatCurrency(booking.proposedPrice, currency)}
            </Typography>
              <Typography variant="caption" color="textSecondary">
                Original price: {formatCurrency(booking.totalAmount, currency)}
            </Typography>
            <Stack direction="row" spacing={1} mt={2}>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => handlePriceApproval(true)}
              >
                Accept Price
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => handlePriceApproval(false)}
              >
                Counter Offer (Original)
              </Button>
            </Stack>
          </Box>
        </Alert>
      )}

      {/* Price Negotiation (Provider) */}
      {booking.status === 'pending_provider_acceptance' && isProvider && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Box>
              <Typography variant="body2" fontWeight={700} mb={1}>
                Customer Counter-Offer: {formatCurrency(booking.counterOffer, currency)}
            </Typography>
            <Stack direction="row" spacing={1} mt={2}>
              <Button
                variant="contained"
                size="small"
                onClick={handleProviderAcceptOldPrice}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={handleProviderRejectOldPrice}
              >
                Reject & Cancel
              </Button>
            </Stack>
          </Box>
        </Alert>
      )}

      {/* Propose Different Price (Provider) */}
      {isProvider && booking.status === 'in_progress' && (
        <>
          {!priceNegotiationOpen ? (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPriceNegotiationOpen(true)}
            >
              Propose Different Price
            </Button>
          ) : (
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" fontWeight={700} display="block" mb={1}>
                Propose New Price ({currency})
              </Typography>
              <TextField
                fullWidth
                type="number"
                size="small"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price"
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handlePriceProposal}>
                  Send Proposal
                </Button>
                <Button variant="outlined" size="small" onClick={() => setPriceNegotiationOpen(false)}>
                  Cancel
                </Button>
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* Request Revision (Customer) */}
      {!isProvider && booking.status === 'completed' && !booking.customerRating && (
        <>
          {!showRevisionForm ? (
            <Button
              variant="outlined"
              size="small"
              color="warning"
              onClick={() => setShowRevisionForm(true)}
            >
              Request Revision
            </Button>
          ) : (
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.50' }}>
              <Typography variant="caption" fontWeight={700} display="block" mb={1}>
                What needs revision?
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Describe the issues..."
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" color="warning" onClick={handleRequestRevision}>
                  Request Revision
                </Button>
                <Button variant="outlined" size="small" onClick={() => setShowRevisionForm(false)}>
                  Cancel
                </Button>
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* Complete & Rate (Customer) */}
      {!isProvider && booking.status === 'completed' && !booking.customerRating && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'success.50' }}>
          <Typography variant="subtitle2" fontWeight={800} mb={2}>
            Rate This Service
          </Typography>
          
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" fontWeight={700}>
                Rating:
              </Typography>
              <Rating
                value={customerRating}
                onChange={(_, value) => setCustomerRating(value || 0)}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Your Review"
              value={customerReview}
              onChange={(e) => setCustomerReview(e.target.value)}
              placeholder="Share your feedback..."
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={submittingReview ? <CircularProgress size={16} /> : <CheckIcon />}
                onClick={handleCompleteBooking}
                disabled={submittingReview || customerRating === 0}
              >
                {submittingReview ? 'Submitting...' : 'Submit Rating & Complete'}
              </Button>
              {invoice && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => generateInvoicePDF(booking, invoice)}
                >
                  Print PDF
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Show Rating After Submitted */}
      {booking.customerRating && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight={700} mb={1}>
              Your Rating: {'⭐'.repeat(booking.customerRating)}
            </Typography>
            {booking.customerReview && (
              <Typography variant="caption" color="textSecondary">
                {booking.customerReview}
              </Typography>
            )}
            {invoice && (
              <Box mt={2}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => generateInvoicePDF(booking, invoice)}
                >
                  Download Invoice PDF
                </Button>
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {/* Revision Status */}
      {booking.status === 'revision_requested' && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700}>
            Revision Requested
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" mt={1}>
            {booking.revisionReason}
          </Typography>
        </Alert>
      )}
    </Stack>
  );
};

export default BookingTimeline;
