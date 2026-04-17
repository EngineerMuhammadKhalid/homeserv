import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Alert, 
  ToggleButtonGroup, 
  ToggleButton, 
  Divider, 
  Stack, 
  Link as MuiLink,
  IconButton,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Mail, 
  Lock, 
  Person as User, 
  Google as GoogleIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

export const Auth = () => {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
          profileCompletionStep: 'pending'
        });
        
        // Initialize Wallet
        await setDoc(doc(db, 'wallets', user.uid), {
          userId: user.uid,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          updatedAt: new Date().toISOString()
        });
        
        // Redirect to profile completion
        navigate('/profile-completion');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Authentication method is disabled. Please enable "Email/Password" and "Google" in your Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr) {
        // Popup may be blocked in some browsers — fallback to redirect
        console.warn('Popup failed, falling back to redirect', popupErr);
        return signInWithRedirect(auth, provider);
      }
      const { user } = result;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'User',
          email: user.email,
          role: 'customer',
          createdAt: new Date().toISOString(),
          profileCompletionStep: 'pending'
        });
        
        // Initialize Wallet
        await setDoc(doc(db, 'wallets', user.uid), {
          userId: user.uid,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          updatedAt: new Date().toISOString()
        });
        
        // New user - redirect to profile completion
        navigate('/profile-completion');
      } else {
        // Existing user - redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is disabled. Please enable "Google" in your Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <Card sx={{ borderRadius: 6, boxShadow: theme.shadows[10], border: '1px solid', borderColor: 'divider', overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 3, sm: 6 } }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? 'Sign in to manage your bookings' : 'Join HomeServ to find or provide services'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleAuth}>
            <Stack spacing={2.5}>
              {!isLogin && (
                <>
                  <TextField
                    fullWidth
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3, bgcolor: 'grey.50' }
                    }}
                  />
                  
                  <ToggleButtonGroup
                    value={role}
                    exclusive
                    onChange={(_, newRole) => newRole && setRole(newRole)}
                    fullWidth
                    sx={{ 
                      bgcolor: 'grey.50', 
                      p: 0.5, 
                      borderRadius: 3,
                      '& .MuiToggleButton-root': {
                        border: 'none',
                        borderRadius: 2.5,
                        py: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&.Mui-selected': {
                          bgcolor: 'white',
                          color: 'primary.main',
                          boxShadow: theme.shadows[1],
                          '&:hover': { bgcolor: 'white' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="customer">Customer</ToggleButton>
                    <ToggleButton value="provider">Service Provider</ToggleButton>
                  </ToggleButtonGroup>
                </>
              )}

              <TextField
                fullWidth
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: 'grey.50' }
                }}
              />

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: 'grey.50' }
                }}
              />

              <Button 
                fullWidth 
                type="submit" 
                variant="contained" 
                size="large"
                sx={{ 
                  py: 1.8, 
                  borderRadius: 3, 
                  fontWeight: 800, 
                  fontSize: '1rem',
                  boxShadow: alpha(theme.palette.primary.main, 0.25) + ' 0 8px 16px'
                }}
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ position: 'relative', my: 5 }}>
            <Divider>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Or continue with
              </Typography>
            </Divider>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleGoogleSignIn}
            startIcon={<GoogleIcon />}
            sx={{ 
              py: 1.5, 
              borderRadius: 3, 
              fontWeight: 700, 
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' }
            }}
          >
            Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <MuiLink 
                component="button"
                onClick={() => setIsLogin(!isLogin)}
                sx={{ 
                  ml: 1, 
                  fontWeight: 800, 
                  color: 'primary.main', 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
