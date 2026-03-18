import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  TextField, 
  Button, 
  Divider,
  Stack,
  useTheme,
  Avatar
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

export const Layout = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ minH: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      
      <Box component="footer" sx={{ bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider', py: 12, mt: 16 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.900', borderRadius: 2, fontWeight: 700, fontSize: '1.25rem' }}>H</Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontStyle: 'italic', fontFamily: 'serif' }}>HomeServ</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, lineHeight: 1.8 }}>
                  The premier destination for elite home services. We connect discerning homeowners with the most skilled professionals, ensuring excellence in every detail of your home's maintenance and care.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link href="https://twitter.com" target="_blank" rel="noreferrer" color="text.secondary"><TwitterIcon /></Link>
                  <Link href="https://instagram.com" target="_blank" rel="noreferrer" color="text.secondary"><InstagramIcon /></Link>
                  <Link href="https://linkedin.com" target="_blank" rel="noreferrer" color="text.secondary"><LinkedInIcon /></Link>
                </Stack>
              </Stack>
            </Grid>
            
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', mb: 4, display: 'block' }}>Services</Typography>
              <Stack spacing={2}>
                {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry'].map(item => (
                  <Link key={item} href="#" underline="none" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500, '&:hover': { color: 'text.primary' } }}>
                    {item}
                  </Link>
                ))}
              </Stack>
            </Grid>
            
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', mb: 4, display: 'block' }}>Company</Typography>
              <Stack spacing={2}>
                <Link href="/about" underline="none" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>About Us</Link>
                <Link href="/contact" underline="none" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Contact</Link>
                <Link href="/privacy" underline="none" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Privacy Policy</Link>
                <Link href="/terms" underline="none" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Terms</Link>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', mb: 4, display: 'block' }}>Newsletter</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block', lineHeight: 1.6 }}>
                Subscribe to receive curated home maintenance tips and exclusive offers.
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField 
                  size="small" 
                  placeholder="Email address" 
                  variant="outlined"
                  sx={{ 
                    bgcolor: 'grey.50',
                    '& .MuiOutlinedInput-root': { borderRadius: 3 }
                  }}
                />
                <Button variant="contained" color="inherit" sx={{ bgcolor: 'grey.900', color: 'white', borderRadius: 3, fontWeight: 700, '&:hover': { bgcolor: 'grey.800' } }}>
                  Join
                </Button>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 8, opacity: 0.5 }} />
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              © 2026 HomeServ. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={4}>
              <Link href="/privacy" underline="none" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Privacy</Link>
              <Link href="/terms" underline="none" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Terms</Link>
              <Link href="/cookies" underline="none" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Cookies</Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
