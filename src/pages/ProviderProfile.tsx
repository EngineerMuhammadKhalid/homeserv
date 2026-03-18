import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, setDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Avatar, 
  Stack, 
  Chip,
  useTheme,
  alpha,
  Paper,
  IconButton,
  Divider,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  Star, 
  LocationOn as MapPin, 
  CalendarMonth as Calendar, 
  AccessTime as Clock, 
  VerifiedUser as ShieldCheck, 
  ChevronLeft 
} from '@mui/icons-material';
import { motion } from 'motion/react';

export const ProviderProfile = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [myComment, setMyComment] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('portal');
  const [workDetails, setWorkDetails] = useState('');
  const [deadline, setDeadline] = useState('');
  const [address, setAddress] = useState(profile?.address || '');
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'service_providers', id));
      if (docSnap.exists()) {
        setProvider({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchProvider();
    // fetch reviews
    const fetchReviews = async () => {
      if (!id) return;
      const q = query(collection(db, 'reviews'), where('subjectId', '==', id), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchReviews().catch(console.error);

    // Only fetch wallet balance if viewing own wallet (privacy)
    const fetchWallet = async () => {
      if (!id || !user || id !== user.uid) return;
      try {
        const wq = query(collection(db, 'wallets'), where('userId', '==', id), limit(1));
        const wsnap = await getDocs(wq);
        if (!wsnap.empty) {
          const w = wsnap.docs[0].data();
          setWalletBalance(w.balance || 0);
        }
      } catch (err) {
        console.error('Wallet fetch error', err);
      }
    };
    fetchWallet().catch(console.error);
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Clearer feedback: inform user they must sign in first
      alert('Please sign in or create an account to request a booking.');
      navigate('/auth');
      return;
    }
    setBookingStatus('loading');
    try {
      // Client-side validation with clear alerts
      if (!bookingDate) {
        alert('Please select a booking date.');
        setBookingStatus('idle');
        return;
      }
      if (!bookingTime) {
        alert('Please select a booking time.');
        setBookingStatus('idle');
        return;
      }
      if (!address) {
        alert('Please enter the service address.');
        setBookingStatus('idle');
        return;
      }
      // Use provider ID + first service as service identifier
      const serviceCategory = (provider?.services?.[0] || provider?.categories?.[0]) || 'General Service';
      await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        providerId: id,
        serviceId: `${id}-${serviceCategory}`, // Unique service identifier
        serviceCategory: serviceCategory,
        bookingDate,
        bookingTime,
        paymentMethod,
        workDetails,
        deadline,
        address,
        serviceImages,
        status: 'pending',
        totalAmount: provider?.hourlyRate || 0,
        createdAt: new Date().toISOString(),
      });
      setBookingStatus('success');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      console.error(err);
      setBookingStatus('idle');
    }
  };

  if (loading) return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
  
  if (!provider) return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>Provider not found</Typography>
        <Button onClick={() => navigate('/search')} startIcon={<ChevronLeft />}>Back to Search</Button>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Button 
        onClick={() => navigate(-1)} 
        startIcon={<ChevronLeft />}
        sx={{ mb: 4, color: 'text.secondary', fontWeight: 700 }}
      >
        Back to Search
      </Button>

      <Grid container spacing={6}>
        {/* Left Column: Profile Info */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={6}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
              <Avatar 
                src={`https://picsum.photos/seed/${provider.id}/300`} 
                variant="rounded"
                sx={{ width: 128, height: 128, borderRadius: 6, boxShadow: theme.shadows[10], border: '4px solid white' }}
              />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                    {provider.name || `Provider ${provider.id.slice(0, 4)}`}
                  </Typography>
                  {provider.username && (
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>@{provider.username}</Typography>
                  )}
                  {provider.verificationStatus === 'verified' && (
                    <Chip 
                      icon={<ShieldCheck sx={{ fontSize: '16px !important' }} />}
                      label="Verified" 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 800, height: 24 }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={Number(provider.rating)} readOnly size="small" precision={0.5} />
                    <Typography variant="body2" fontWeight={800}>{provider.rating}</Typography>
                    <Typography variant="body2" color="text.secondary">({provider.reviewCount} reviews)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <MapPin fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Lahore, Pakistan</Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {provider.categories.map((c: string) => (
                    <Chip 
                      key={c} 
                      label={c} 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        color: 'primary.main', 
                        fontWeight: 800,
                        borderRadius: 2
                      }} 
                    />
                  ))}
                </Stack>
              </Box>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={800} gutterBottom>About</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                {provider.bio}
              </Typography>
            </Paper>

            {provider.portfolio && provider.portfolio.length > 0 && (
              <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Portfolio</Typography>
                <Grid container spacing={2}>
                  {provider.portfolio.map((img: string, idx: number) => (
                    <Grid size={{ xs: 6, md: 4 }} key={idx}>
                      <Box 
                        component="img"
                        src={img}
                        alt={`Portfolio ${idx}`}
                        sx={{ 
                          width: '100%', 
                          aspectRatio: '1/1', 
                          objectFit: 'cover', 
                          borderRadius: 4,
                          bgcolor: 'grey.100'
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {provider.faqs && provider.faqs.length > 0 && (
              <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>FAQ</Typography>
                <Stack spacing={4}>
                  {provider.faqs.map((faq: any, idx: number) => (
                    <Box key={idx}>
                      <Typography variant="subtitle1" fontWeight={800} gutterBottom>{faq.question}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{faq.answer}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 4 }}>Reviews</Typography>
              <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
                  {reviews.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No reviews yet. Be the first to review this provider.</Typography>
                  )}
                  {reviews.map((r) => (
                    <Box key={r.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}>{(r.reviewerName || 'U').charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800}>{r.reviewerName || 'Customer'}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleDateString()}</Typography>
                          </Box>
                        </Box>
                        <Rating value={Number(r.rating)} readOnly size="small" />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {r.comment}
                      </Typography>
                    </Box>
                  ))}
                  {/* Review form for logged-in customers who are not the provider */}
                  {user && profile?.role === 'customer' && user.uid !== id && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Leave a review</Typography>
                      <Rating value={myRating || 0} onChange={(_, val) => setMyRating(val)} />
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Share your experience..."
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        sx={{ mt: 2 }}
                      />
                      <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={async () => {
                          if (!myRating) return alert('Please provide a rating');
                          try {
                            await addDoc(collection(db, 'reviews'), {
                              subjectId: id,
                              subjectType: 'provider',
                              reviewerId: user.uid,
                              reviewerName: profile.name || profile.email || 'Customer',
                              rating: myRating,
                              comment: myComment,
                              createdAt: new Date().toISOString()
                            });
                            // refresh reviews
                            const q = query(collection(db, 'reviews'), where('subjectId', '==', id), orderBy('createdAt', 'desc'));
                            const snap = await getDocs(q);
                            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                            setReviews(all);

                            // update provider aggregate: rating & reviewCount
                            const avg = all.reduce((s, x) => s + Number(x.rating || 0), 0) / (all.length || 1);
                            await setDoc(doc(db, 'service_providers', id), { rating: Number(avg.toFixed(1)), reviewCount: all.length }, { merge: true });

                            setMyRating(null);
                            setMyComment('');
                          } catch (err: any) {
                          console.error('Error submitting review', err);
                          alert('Failed to submit review: ' + (err?.message || err));
                        }
                        }}
                      >
                        Submit Review
                      </Button>
                    </Box>
                  )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Booking Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hourly Rate</Typography>
                <Typography variant="h4" fontWeight={800}>Rs. {provider.hourlyRate}</Typography>
              </Box>
              <Chip label="Available Now" color="success" size="small" sx={{ fontWeight: 800, borderRadius: 1 }} />
            </Box>

            {bookingStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', p: 4, borderRadius: 4, textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ mb: 1 }}>🎉</Typography>
                  <Typography variant="h6" fontWeight={800}>Booking Requested!</Typography>
                  <Typography variant="body2">We'll notify you once the provider accepts.</Typography>
                </Box>
              </motion.div>
            ) : user?.uid === id ? (
              <Box sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom>This is your profile</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>You cannot book your own services.</Typography>
                <Button 
                  onClick={() => navigate('/settings')}
                  sx={{ mt: 2, fontWeight: 800 }}
                  color="primary"
                >
                  Edit Profile
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleBooking} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Select Date"
                  type="date"
                  required
                  fullWidth
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: 3 } }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Select Time</InputLabel>
                  <Select
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    label="Select Time"
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="">Choose a slot</MenuItem>
                    <MenuItem value="09:00 AM">09:00 AM</MenuItem>
                    <MenuItem value="11:00 AM">11:00 AM</MenuItem>
                    <MenuItem value="02:00 PM">02:00 PM</MenuItem>
                    <MenuItem value="04:00 PM">04:00 PM</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Work Details"
                  placeholder="Describe what needs to be done..."
                  required
                  fullWidth
                  multiline
                  rows={4}
                  value={workDetails}
                  onChange={(e) => setWorkDetails(e.target.value)}
                  InputProps={{ sx: { borderRadius: 3 } }}
                />

                <TextField
                  label="Deadline"
                  type="date"
                  required
                  fullWidth
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: 3 } }}
                />

                <TextField
                  label="Service Address"
                  placeholder="Where should the provider go?"
                  required
                  fullWidth
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  InputProps={{ sx: { borderRadius: 3 } }}
                />

                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="portal">Portal Payment</MenuItem>
                    <MenuItem value="easypaisa">EasyPaisa</MenuItem>
                    <MenuItem value="jazzcash">JazzCash</MenuItem>
                    <MenuItem value="bank">Bank Transfer</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="caption" fontWeight={800} sx={{ mb: 1, display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
                    Pictures of required service
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {serviceImages.map((img, idx) => (
                      <Avatar 
                        key={idx} 
                        src={img} 
                        variant="rounded" 
                        sx={{ width: 64, height: 64, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} 
                      />
                    ))}
                    <Box 
                      component="label" 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: 2, 
                        border: '2px dashed', 
                        borderColor: 'divider', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                      }}
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Typography variant="h5" color="text.secondary">+</Typography>
                    </Box>
                  </Box>
                </Box>

                <Button 
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={bookingStatus === 'loading'}
                  sx={{ 
                    py: 2, 
                    borderRadius: 4, 
                    fontWeight: 800, 
                    boxShadow: theme.shadows[4],
                    '&:hover': { boxShadow: theme.shadows[8] }
                  }}
                >
                  {bookingStatus === 'loading' ? 'Processing...' : 'Request Booking'}
                </Button>
                
                <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary', px: 2 }}>
                  You won't be charged yet. Payment is processed after service completion.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
