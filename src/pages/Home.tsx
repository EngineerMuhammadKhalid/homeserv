import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
  AvatarGroup
} from '@mui/material';
import { 
  Search, 
  LocationOn as MapPin, 
  Shield, 
  Star, 
  AccessTime as Clock 
} from '@mui/icons-material';

const categories = [
  { name: 'Plumbing', icon: '🚰', count: '120+ Providers' },
  { name: 'Electrical', icon: '⚡', count: '85+ Providers' },
  { name: 'Cleaning', icon: '🧹', count: '200+ Providers' },
  { name: 'Carpentry', icon: '🪚', count: '45+ Providers' },
  { name: 'Painting', icon: '🎨', count: '60+ Providers' },
  { name: 'AC Repair', icon: '❄️', count: '90+ Providers' },
];

export const Home = () => {
  const theme = useTheme();
  const [queryData, setQueryData] = React.useState({
    service: '',
    location: '',
    deadline: ''
  });
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (queryData.service) params.append('category', queryData.service);
    if (queryData.location) params.append('location', queryData.location);
    if (queryData.deadline) params.append('deadline', queryData.deadline);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Section */}
      <Box sx={{ 
        position: 'relative', 
        minHeight: 500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        bgcolor: 'grey.900', 
        py: 8,
        color: 'white'
      }}>
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 0.2,
          background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`
        }} />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Chip 
              label="Trusted by 10,000+ Households" 
              size="small"
              sx={{ 
                mb: 3, 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: 'primary.light', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
              Expert Help for Your Home
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Typography variant="body1" sx={{ color: 'grey.400', mb: 6, maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
              Find trusted local professionals for everything from plumbing to deep cleaning. Book in seconds.
            </Typography>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Paper sx={{ p: 2, borderRadius: 4, maxWidth: 700, mx: 'auto', bgcolor: 'white' }}>
              <form onSubmit={handleSearch}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'left', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5, ml: 1 }}>
                        Service
                      </Typography>
                      <Select
                        value={queryData.service}
                        onChange={(e) => setQueryData({ ...queryData, service: e.target.value })}
                        displayEmpty
                        startAdornment={<Search sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />}
                        sx={{ borderRadius: 2, bgcolor: 'grey.50', '& .MuiSelect-select': { py: 1.5, fontSize: '0.875rem', fontWeight: 600 } }}
                      >
                        <MenuItem value="">Select Service</MenuItem>
                        {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'].map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5, ml: 1 }}>
                        Location
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="City or Area"
                        value={queryData.location}
                        onChange={(e) => setQueryData({ ...queryData, location: e.target.value })}
                        InputProps={{
                          startAdornment: <MapPin sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                          sx: { borderRadius: 2, bgcolor: 'grey.50', py: 0.5, fontSize: '0.875rem', fontWeight: 600 }
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button 
                      fullWidth 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      sx={{ borderRadius: 2, py: 1.5, fontWeight: 700, boxShadow: theme.shadows[2] }}
                    >
                      Find Providers
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Popular Categories</Typography>
            <Typography variant="body2" color="text.secondary">Curated services for your daily needs</Typography>
          </Box>
          <Button component={Link} to="/search" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            View All
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {categories.map((cat, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.name}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card sx={{ 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  borderRadius: 4, 
                  transition: 'all 0.3s',
                  '&:hover': { 
                    borderColor: 'primary.light', 
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-4px)'
                  } 
                }} onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h3" sx={{ mb: 2 }}>{cat.icon}</Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{cat.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                      {cat.count}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ bgcolor: 'grey.900', color: 'white', borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 6, position: 'relative', zIndex: 1 }}>
                <Shield sx={{ color: 'primary.main', fontSize: 48, mb: 3 }} />
                <Typography variant="h5" fontWeight={700} gutterBottom>Verified Professionals</Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', mb: 4, maxWidth: 400, lineHeight: 1.8 }}>
                  Every service provider undergoes a rigorous 5-step verification process, including background checks and skill assessments.
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AvatarGroup max={4}>
                    {[1,2,3,4].map(i => (
                      <Avatar key={i} src={`https://picsum.photos/seed/${i+20}/100/100`} sx={{ width: 32, height: 32 }} />
                    ))}
                  </AvatarGroup>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    +2,400 Verified Pros
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <CardContent sx={{ p: 4 }}>
                <Star sx={{ color: 'grey.900', fontSize: 48, mb: 3 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>Quality Guaranteed</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  Not happy with the service? We'll make it right. Your satisfaction is our top priority with our 100% money-back guarantee.
                </Typography>
              </CardContent>
              <Box sx={{ p: 4, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={0.5}>
                    {[1,2,3,4,5].map(i => <Star key={i} sx={{ color: 'primary.main', fontSize: 12 }} />)}
                  </Stack>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                    4.9/5 Average Rating
                  </Typography>
                </Stack>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <CardContent sx={{ p: 4 }}>
                <Clock sx={{ color: 'grey.900', fontSize: 48, mb: 3 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>Instant Booking</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  No more waiting for callbacks. Book your preferred slot instantly through our platform with real-time availability.
                </Typography>
              </CardContent>
              <Box sx={{ p: 4, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'grey.900', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                    Live Availability
                  </Typography>
                </Stack>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <CardContent sx={{ p: 6, flex: 1 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>Ready to get started?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                  Join thousands of happy customers who trust HomeServ for their home maintenance needs.
                </Typography>
                <Button component={Link} to="/auth" variant="contained" sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
                  Create Your Account
                </Button>
              </CardContent>
              <Box sx={{ p: 4, width: { xs: '100%', md: 200 } }}>
                <Avatar 
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=600" 
                  variant="rounded"
                  sx={{ width: '100%', height: 160, borderRadius: 4 }}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
