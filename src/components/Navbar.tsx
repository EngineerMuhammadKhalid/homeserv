import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Container, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip,
  Divider,
  Stack,
  useTheme,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Search, 
  CalendarMonth as Calendar, 
  Message as MessageSquare, 
  Person as User, 
  Logout as LogOut, 
  Menu as MenuIcon, 
  Close as X, 
  AdminPanelSettings as ShieldCheck, 
  Work as Briefcase, 
  GridView as LayoutGrid, 
  Settings as SettingsIcon,
  Home as HomeIcon
} from '@mui/icons-material';

export const Navbar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    await auth.signOut();
    handleCloseUserMenu();
    navigate('/');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'Find Services', path: '/search', icon: <Search fontSize="small" /> },
  ];

  if (user) {
    navItems.push({ label: 'Bookings', path: '/bookings', icon: <Calendar fontSize="small" /> });
    navItems.push({ label: 'Messages', path: '/messages', icon: <MessageSquare fontSize="small" /> });
    
    if (profile?.role === 'admin') {
      navItems.push({ label: 'Admin', path: '/admin', icon: <ShieldCheck fontSize="small" /> });
    }
    
    if (profile?.role === 'provider') {
      navItems.push({ label: 'My Gigs', path: '/provider-services', icon: <LayoutGrid fontSize="small" /> });
      navItems.push({ label: 'My Profile', path: '/provider-section', icon: <Briefcase fontSize="small" /> });
    }
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: 700, fontStyle: 'italic', fontFamily: 'serif' }}>
        HomeServ
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component={Link} to={item.path} sx={{ textAlign: 'left' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
        {!user && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/auth">
              <ListItemText primary="Sign In" primaryTypographyProps={{ fontWeight: 700, color: 'primary' }} />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ 
      borderBottom: '1px solid', 
      borderColor: 'divider',
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backdropFilter: 'blur(8px)'
    }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64 }}>
          {/* Logo */}
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit', mr: 4 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}>H</Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', display: { xs: 'none', sm: 'block' } }}>
              HomeServ
            </Typography>
          </Box>

          {/* Desktop Nav Items */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600, 
                  fontSize: '0.75rem',
                  '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Tooltip title="Settings">
                    <IconButton component={Link} to="/settings" size="small" sx={{ color: 'text.secondary' }}>
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, my: 'auto' }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={handleOpenUserMenu}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', fontWeight: 700, lineHeight: 1 }}>
                        {profile?.name || 'User'}
                        {profile?.verificationStatus === 'verified' ? (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontSize: '0.65rem', fontWeight: 800 }}>
                            <ShieldCheck style={{ width: 12, height: 12 }} /> Verified
                          </Box>
                        ) : (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.65rem', fontWeight: 700 }}>
                            Not verified
                          </Box>
                        )}
                      </Typography>
                      {profile?.username && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          @{profile.username}
                        </Typography>
                      )}
                    </Box>
                    <Avatar 
                      src={profile?.profilePhoto} 
                      sx={{ width: 36, height: 36, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                    >
                      <User fontSize="small" />
                    </Avatar>
                  </Box>
                </Stack>

                {/* Mobile User Avatar */}
                <IconButton onClick={handleOpenUserMenu} sx={{ display: { xs: 'flex', md: 'none' }, p: 0 }}>
                  <Avatar src={profile?.profilePhoto} sx={{ width: 32, height: 32, borderRadius: 2 }}>
                    <User fontSize="small" />
                  </Avatar>
                </IconButton>

                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 3, minWidth: 180, mt: 1 }
                  }}
                >
                  <MenuItem component={Link} to="/dashboard" onClick={handleCloseUserMenu}>
                    <ListItemIcon><LayoutGrid fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Dashboard</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/settings" onClick={handleCloseUserMenu}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Settings</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><LogOut fontSize="small" color="error" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                component={Link} 
                to="/auth" 
                variant="contained" 
                size="small"
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, borderRadius: '0 16px 16px 0' },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};
