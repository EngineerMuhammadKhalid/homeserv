import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
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
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  InputAdornment,
  ListItemButton,
  Slider,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import {
  Search as SearchIcon,
  LocationOn as MapPin,
  FilterList as Filter,
  Star,
  ChevronRight,
  CalendarMonth as Calendar,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { UK_CITIES } from '../data/ukCities';
import { PAKISTAN_CITIES, PROVINCE_LIST } from '../data/pakistanCities';

export const Search = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [country, setCountry] = useState(searchParams.get('country') || 'Pakistan');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [deadline, setDeadline] = useState(searchParams.get('deadline') || '');
  const [priceRange, setPriceRange] = useState<number[]>([500, 5000]);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let q = collection(db, 'service_providers');
        let constraints: any[] = [limit(20)];

        if (category !== 'All') {
          constraints.push(where('categories', 'array-contains', category));
        }

        const querySnapshot = await getDocs(query(q, ...constraints));
        let providerData: any[] = [];
        
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          // Use stored name when available; fall back to a short-id placeholder
          providerData.push({ id: docSnap.id, ...data, name: data.name || ('Provider ' + docSnap.id.slice(0, 4)) });
        }

        // Client-side filtering for location since Firestore doesn't support partial string matching easily without external tools
        if (city) {
          providerData = providerData.filter(p => p.address?.toLowerCase().includes(city.toLowerCase()));
        } else if (location) {
          providerData = providerData.filter(p => p.address?.toLowerCase().includes(location.toLowerCase()));
        }
        
        setProviders(providerData);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchProviders();
  }, [category, location]);

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4}>
        {/* Filters Sidebar */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
                <CategoryIcon fontSize="small" /> Categories
              </Typography>
              <List sx={{ p: 0 }}>
                {['All', 'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'].map((cat) => (
                  <ListItem key={cat} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        setCategory(cat);
                        setSearchParams(prev => {
                          if (cat === 'All') prev.delete('category');
                          else prev.set('category', cat);
                          return prev;
                        });
                      }}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: category === cat ? 'primary.main' : 'transparent',
                        color: category === cat ? 'white' : 'text.secondary',
                        '&:hover': { 
                          bgcolor: category === cat ? 'primary.dark' : 'action.hover',
                          color: category === cat ? 'white' : 'text.primary'
                        }
                      }}
                    >
                      <ListItemText primary={cat} primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
                <MapPin fontSize="small" /> Location
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="country-select-label">Country</InputLabel>
                <Select
                  labelId="country-select-label"
                  value={country}
                  label="Country"
                  onChange={(e) => {
                    setCountry(e.target.value as string);
                    setCity('');
                    setSearchParams(prev => {
                      prev.set('country', e.target.value as string);
                      prev.delete('city');
                      return prev;
                    });
                  }}
                >
                  <MenuItem value="Pakistan">Pakistan</MenuItem>
                  <MenuItem value="UK">United Kingdom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="city-select-label">City</InputLabel>
                <Select
                  labelId="city-select-label"
                  value={city}
                  label="City"
                  onChange={(e) => {
                    setCity(e.target.value as string);
                    setSearchParams(prev => { prev.set('city', e.target.value as string); return prev; });
                  }}
                >
                  {country === 'Pakistan' ? (
                    PROVINCE_LIST.map((prov) => (
                      PAKISTAN_CITIES[prov].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)
                    ))
                  ) : (
                    UK_CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)
                  )}
                </Select>
              </FormControl>
            </Paper>

            {deadline && (
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'grey.900', color: 'white' }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                  <Calendar fontSize="small" /> Deadline
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'grey.400', mb: 2 }}>
                  Available by {deadline}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => {
                    setDeadline('');
                    setSearchParams(prev => {
                      prev.delete('deadline');
                      return prev;
                    });
                  }}
                  sx={{ p: 0, minWidth: 0, fontSize: '0.65rem', fontWeight: 800, color: 'primary.light', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                >
                  Clear Filter
                </Button>
              </Paper>
            )}

            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 3 }}>
                <MoneyIcon fontSize="small" /> Price Range
              </Typography>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={500}
                max={5000}
                sx={{ color: 'primary.main' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Rs. 500</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Rs. 5000+</Typography>
              </Box>
            </Paper>
          </Stack>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={4}>
            <Paper sx={{ p: 1, borderRadius: 4, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, color: 'text.secondary' }}>
                <SearchIcon fontSize="small" />
              </Box>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search for providers or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '0.875rem', fontWeight: 600, px: 1 }
                }}
              />
            </Paper>

            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map(i => (
                  <Grid size={{ xs: 12, sm: 6 }} key={i}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={3}>
                {providers.map((provider, i) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={provider.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card sx={{ 
                        borderRadius: 4, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                        '&:hover': { 
                          boxShadow: theme.shadows[4],
                          borderColor: 'primary.light'
                        }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" spacing={2}>
                            <Avatar 
                              src={`https://picsum.photos/seed/${provider.id}/200`} 
                              variant="rounded"
                              sx={{ width: 80, height: 80, borderRadius: 3 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={800}>{provider.name}</Typography>
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                    <MapPin sx={{ fontSize: 12 }} /> 2.5 km away
                                  </Typography>
                                </Box>
                                <Chip 
                                  icon={<Star sx={{ fontSize: '10px !important', color: 'inherit' }} />}
                                  label={provider.rating || 'New'} 
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem', 
                                    fontWeight: 800, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                    color: 'primary.main',
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                                {provider.categories?.map((c: string) => (
                                  <Chip 
                                    key={c} 
                                    label={c} 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.6rem', 
                                      fontWeight: 800, 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.05em',
                                      bgcolor: 'grey.100',
                                      color: 'text.secondary'
                                    }} 
                                  />
                                ))}
                              </Stack>
                            </Box>
                          </Stack>
                          
                          <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem' }}>
                                Starting from
                              </Typography>
                              <Typography variant="h6" fontWeight={800}>
                                {formatCurrency(provider.hourlyRate, currency)}<Typography component="span" variant="caption" sx={{ fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>/hr</Typography>
                              </Typography>
                            </Box>
                            <Button 
                              component={Link} 
                              to={`/provider/${provider.id}`}
                              variant="contained" 
                              size="small"
                              endIcon={<ChevronRight fontSize="small" />}
                              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem', px: 2 }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
                
                {providers.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ py: 12, textAlign: 'center' }}>
                      <Typography variant="h1" sx={{ mb: 2 }}>🔍</Typography>
                      <Typography variant="h6" fontWeight={800}>No providers found</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto', mt: 1 }}>
                        Try adjusting your filters or search term to find what you're looking for.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};
