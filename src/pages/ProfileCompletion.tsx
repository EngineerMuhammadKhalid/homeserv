import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Mail as MailIcon,
  MapPin as LocationIcon,
  DollarSign,
  Upload as UploadIcon,
  Lightbulb as LightbulbIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

export const ProfileCompletion = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    address: '',
    bio: '',
    hourlyRate: '',
    profileImage: '',
    skills: ''
  });

  const [profileImg, setProfileImg] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const services = [
    'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Gardening',
    'Moving', 'Appliance Repair', 'HVAC', 'Roofing', 'Consulting', 'Tutoring'
  ];

  const isProvider = profile?.role === 'provider';

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    setFormData({
      name: profile.name || '',
      username: profile.username || '',
      address: profile.address || '',
      bio: profile.bio || '',
      hourlyRate: profile.hourlyRate || '',
      profileImage: profile.profileImage || '',
      skills: profile.skills?.join(', ') || ''
    });

    setSelectedServices(profile.categories || []);

    if (profile.profileImage) {
      setPreviewUrl(profile.profileImage);
    }
  }, [user, profile, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImg(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSave = async (skip = false) => {
    try {
      setSaving(true);

      if (!skip) {
        const updates: any = {
          name: formData.name,
          username: formData.username,
          address: formData.address,
          bio: formData.bio,
          profileCompletionStep: 'completed',
          updatedAt: new Date().toISOString()
        };

        if (isProvider) {
          updates.hourlyRate = parseInt(formData.hourlyRate) || 0;
          updates.categories = selectedServices;
          updates.skills = formData.skills
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        }

        if (previewUrl && previewUrl.startsWith('data:')) {
          // In production, upload to Firebase Storage
          updates.profileImage = previewUrl;
        }

        await updateDoc(doc(db, 'users', user!.uid), updates);
      } else {
        await updateDoc(doc(db, 'users', user!.uid), {
          profileCompletionStep: 'skipped',
          updatedAt: new Date().toISOString()
        });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ mb: 8 }}>
        <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
          Complete Your {isProvider ? 'Provider' : 'Customer'} Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isProvider
            ? 'Help customers find and trust you by completing your profile. You can skip this for now.'
            : 'Complete your profile to get started. You can skip this for now.'}
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Profile Picture */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon /> Profile Picture
          </Typography>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              src={previewUrl}
              sx={{ width: 120, height: 120, borderRadius: 2 }}
            />
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ textTransform: 'none' }}
              >
                Upload Photo
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageChange}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, GIF up to 10MB
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Name and Username */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Unique username"
              helperText="Used to identify you on the platform"
            />
          </Stack>
        </Paper>

        {/* Address */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon /> Service Location
          </Typography>
          <TextField
            fullWidth
            label="Service Address / Area"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g., Central London, Manchester City Centre"
            multiline
            rows={2}
            helperText={isProvider ? 'Where you provide services' : 'Your primary location'}
          />
        </Paper>

        {/* Bio */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            About {isProvider ? 'You' : 'Yourself'}
          </Typography>
          <TextField
            fullWidth
            label="Bio / Description"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder={isProvider ? 'Tell customers about your experience and services' : 'Tell us about yourself'}
            multiline
            rows={4}
          />
        </Paper>

        {/* Provider-Specific Fields */}
        {isProvider && (
          <>
            {/* Services */}
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                Services You Offer
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {services.map(service => (
                  <Chip
                    key={service}
                    label={service}
                    onClick={() => handleServiceToggle(service)}
                    variant={selectedServices.includes(service) ? 'filled' : 'outlined'}
                    color={selectedServices.includes(service) ? 'primary' : 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Hourly Rate */}
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign /> Hourly Rate
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate (£)"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="e.g., 50"
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Customers will see this rate"
              />
            </Paper>

            {/* Skills */}
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon /> Key Skills
              </Typography>
              <TextField
                fullWidth
                label="Skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g., Plumbing, Pipe repair, Water damage"
                helperText="Separate skills with commas"
                multiline
                rows={2}
              />
            </Paper>
          </>
        )}
      </Stack>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={() => handleSave(true)}
          disabled={saving}
          sx={{
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          Skip for Now
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="large"
          endIcon={<ArrowIcon />}
          onClick={() => handleSave(false)}
          disabled={saving || !formData.name || !formData.username || !formData.address}
          sx={{
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {saving ? <CircularProgress size={24} /> : 'Complete Profile'}
        </Button>
      </Stack>
    </Container>
  );
};

export default ProfileCompletion;
