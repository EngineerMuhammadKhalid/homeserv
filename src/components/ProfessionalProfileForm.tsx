import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  Paper,
  Dialog,
  IconButton,
  Alert,
  Card,
  CardMedia,
  Rating,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  School as SchoolIcon,
  Build as BuildIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  VerifiedUser as VerifiedUserIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { motion } from 'motion/react';

export const ProfessionalProfileForm = ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => {
  const theme = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioUpload, setPortfolioUpload] = useState<File | null>(null);
  const [portfolioPreview, setPortfolioPreview] = useState<string>('');
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Hindi', 'Sindhi', 'Pashto'];

  useEffect(() => {
    fetchProviderData();
  }, [user, profile]);

  const fetchProviderData = async () => {
    if (!user || profile?.role !== 'provider') return;
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'service_providers', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProviderData(data);
        setPreviewUrl(data.profilePhoto || '');
      } else {
        // Create template for new providers
        setProviderData({
          userId: user.uid,
          name: profile?.name || '',
          bio: '',
          hourlyRate: 0,
          experienceYears: 0,
          skills: [],
          portfolio: [],
          languages: ['English'],
          verificationStatus: 'pending',
          profilePhoto: '',
          rating: 0,
          reviews: 0,
          activeStatus: true,
        });
      }
    } catch (err) {
      console.error('Error fetching provider data:', err);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 10MB');
      return;
    }
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 10MB');
      return;
    }
    if (file) {
      setPortfolioUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFilesToStorage = async (file: File, path: string) => {
    if (!user) throw new Error('No user');
    const fileRef = storageRef(storage, `${path}/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const addPortfolioImage = async () => {
    if (!portfolioUpload) {
      setErrorMessage('Please select an image');
      return;
    }
    try {
      setUploadingPortfolio(true);
      const url = await uploadFilesToStorage(portfolioUpload, 'portfolio');
      setProviderData({
        ...providerData,
        portfolio: [...(providerData?.portfolio || []), url],
      });
      setPortfolioUpload(null);
      setPortfolioPreview('');
      setPortfolioDialogOpen(false);
      setSuccessMessage('Portfolio image added successfully');
    } catch (err) {
      console.error('Portfolio upload error:', err);
      setErrorMessage('Failed to upload portfolio image');
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const removePortfolioImage = (idx: number) => {
    setProviderData({
      ...providerData,
      portfolio: providerData.portfolio.filter((_: any, i: number) => i !== idx),
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && providerData) {
      setProviderData({
        ...providerData,
        skills: [...(providerData.skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProviderData({
      ...providerData,
      skills: (providerData.skills || []).filter((s: string) => s !== skill),
    });
  };

  const toggleLanguage = (lang: string) => {
    setProviderData({
      ...providerData,
      languages: (providerData.languages || []).includes(lang)
        ? (providerData.languages || []).filter((l: string) => l !== lang)
        : [...(providerData.languages || []), lang],
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let profilePhotoUrl = previewUrl;

      // Upload profile photo if selected
      if (selectedFile) {
        profilePhotoUrl = await uploadFilesToStorage(selectedFile, 'profile_photos');
        setSelectedFile(null);
      }

      // Update provider data
      const updateData = {
        ...providerData,
        userId: user.uid,
        name: profile?.name,
        profilePhoto: profilePhotoUrl,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'service_providers', user.uid), updateData, { merge: true });

      // Update user profile with verification status
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: providerData.verificationStatus,
        updatedAt: new Date().toISOString(),
      });

      await refreshProfile();
      setSuccessMessage('Professional profile saved successfully!');
      onSaveSuccess?.();
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!providerData || profile?.role !== 'provider') {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">This section is only available for service providers.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
            Professional Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Showcase your expertise and attract more clients
          </Typography>
        </Box>

        {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

        {/* Profile Header Section */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={previewUrl}
                sx={{
                  width: { xs: 120, md: 140 },
                  height: { xs: 120, md: 140 },
                  borderRadius: 3,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              />
              <Button
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  minWidth: 48,
                  minHeight: 48,
                  borderRadius: '50%',
                  p: 0,
                }}
                variant="contained"
                color="primary"
              >
                <CloudUploadIcon />
                <input hidden accept="image/*" type="file" onChange={handleProfilePhotoUpload} />
              </Button>
            </Box>

            <Stack spacing={2} sx={{ flex: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Profile Identity
                </Typography>
                <Chip
                  icon={<VerifiedUserIcon />}
                  label={providerData.verificationStatus === 'verified' ? 'Verified' : 'Verification Pending'}
                  color={providerData.verificationStatus === 'verified' ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Use a clear, professional headshot for better trust. Ideal size: 400x400px
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Professional Summary */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Professional Summary
          </Typography>
          <TextField
            fullWidth
            label="About You (Biography)"
            value={providerData.bio || ''}
            onChange={(e) => setProviderData({ ...providerData, bio: e.target.value })}
            placeholder="Describe your expertise, tools you use, and why clients should hire you..."
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            Write a compelling summary that highlights your expertise and experience. This appears on your profile.
          </Typography>
        </Paper>

        {/* Rates & Experience */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
          <Box>
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon />
                Hourly Rate
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate (£)"
                value={providerData.hourlyRate || ''}
                onChange={(e) => setProviderData({ ...providerData, hourlyRate: Number(e.target.value) })}
                placeholder="e.g., 50"
                inputProps={{ min: 0, step: 1 }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Customers will see this rate when browsing services
              </Typography>
            </Paper>
          </Box>

          <Box>
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon />
                Experience (Years)
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                value={providerData.experienceYears || ''}
                onChange={(e) => setProviderData({ ...providerData, experienceYears: Number(e.target.value) })}
                placeholder="e.g., 5"
                inputProps={{ min: 0, step: 1 }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Total years working in this field
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Skills & Expertise */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon />
            Skills & Expertise
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {(providerData.skills || []).map((skill: string) => (
              <Chip
                key={skill}
                label={skill}
                onDelete={() => removeSkill(skill)}
                color="primary"
                variant="filled"
              />
            ))}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              label="Add Skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g. Pipe Fitting, Wiring, Deep Cleaning"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill();
                  e.preventDefault();
                }
              }}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addSkill}>
              Add
            </Button>
          </Stack>
        </Paper>

        {/* Portfolio Gallery */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon />
            Portfolio Gallery
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
            {(providerData.portfolio || []).map((image: string, idx: number) => (
              <Box key={idx}>
                <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={image}
                    alt={`Portfolio ${idx + 1}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                    }}
                    onClick={() => removePortfolioImage(idx)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Card>
              </Box>
            ))}

            <Box>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: '200px', borderRadius: 2, borderStyle: 'dashed' }}
                onClick={() => setPortfolioDialogOpen(true)}
              >
                <Stack alignItems="center" spacing={1}>
                  <ImageIcon sx={{ fontSize: 32 }} />
                  <Typography variant="caption">Add work sample</Typography>
                </Stack>
              </Button>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {providerData.portfolio?.length || 0} image(s) uploaded
          </Typography>
        </Paper>

        {/* Languages */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Languages
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                onClick={() => toggleLanguage(lang)}
                variant={(providerData.languages || []).includes(lang) ? 'filled' : 'outlined'}
                color={(providerData.languages || []).includes(lang) ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Paper>

        {/* Stats Overview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {providerData.rating?.toFixed(1) || '0.0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average Rating
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {providerData.reviews || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reviews
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {providerData.experienceYears || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Years Experience
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Chip
                label={providerData.activeStatus ? 'Active' : 'Inactive'}
                color={providerData.activeStatus ? 'success' : 'default'}
                variant="filled"
                size="small"
                onClick={() =>
                  setProviderData({
                    ...providerData,
                    activeStatus: !providerData.activeStatus,
                  })
                }
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Visible in search
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Save Button */}
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save All Changes'}
          </Button>
        </Stack>
      </motion.div>

      {/* Portfolio Upload Dialog */}
      <Dialog open={portfolioDialogOpen} onClose={() => setPortfolioDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Add Portfolio Image
          </Typography>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: portfolioPreview ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              mb: 3,
              background: portfolioPreview ? 'rgba(25, 103, 210, 0.05)' : 'transparent',
              transition: 'all 0.3s',
            }}
            component="label"
          >
            {portfolioPreview ? (
              <Box
                component="img"
                src={portfolioPreview}
                sx={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 1 }}
              />
            ) : (
              <Stack alignItems="center" spacing={1}>
                <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Click to select or drag and drop
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG, JPG, GIF up to 10MB
                </Typography>
              </Stack>
            )}
            <input hidden accept="image/*" type="file" onChange={handlePortfolioUpload} />
          </Box>

          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={addPortfolioImage}
              disabled={!portfolioUpload || uploadingPortfolio}
            >
              {uploadingPortfolio ? <CircularProgress size={24} /> : 'Add Image'}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => setPortfolioDialogOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Container>
  );
};

export default ProfessionalProfileForm;
