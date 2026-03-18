import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, setDoc, doc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, ShieldCheck, Clock, Wallet, ArrowUpRight } from 'lucide-react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Avatar,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { WithdrawalModal } from '../components/WithdrawalModal';

export const Dashboard = () => {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    avgRating: 0,
    activeBookings: 0,
    walletBalance: 0,
    pendingBalance: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchStats = async () => {
      const field = profile.role === 'provider' ? 'providerId' : 'customerId';
      
      try {
        // Fetch Bookings
        const qBookings = query(collection(db, 'bookings'), where(field, '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        const bookingSnapshot = await getDocs(qBookings);
        const bookings = bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentBookings(bookings);

        // Fetch Invoices
        const qInvoices = query(collection(db, 'invoices'), where(field, '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        const invoiceSnapshot = await getDocs(qInvoices);
        const invoices = invoiceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentInvoices(invoices);

        // Fetch Wallet
        let walletBalance = 0;
        let pendingBalance = 0;
        let totalEarned = 0;
        const walletSnap = await getDocs(query(collection(db, 'wallets'), where('userId', '==', user.uid)));
        if (!walletSnap.empty) {
          const walletData = walletSnap.docs[0].data();
          walletBalance = walletData.balance || 0;
          pendingBalance = walletData.pendingBalance || 0;
          totalEarned = walletData.totalEarned || 0;
        } else {
          await setDoc(doc(db, 'wallets', user.uid), {
            userId: user.uid,
            balance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            updatedAt: new Date().toISOString()
          });
        }

        setStats({
          totalBookings: bookings.length,
          totalEarnings: totalEarned,
          avgRating: profile.role === 'provider' ? (profile.rating || 4.8) : 5.0,
          activeBookings: bookings.filter((b: any) => b.status === 'pending' || b.status === 'accepted').length,
          walletBalance,
          pendingBalance
        });

        setChartData([
          { name: 'Mon', bookings: 4, revenue: 4800 },
          { name: 'Tue', bookings: 3, revenue: 3600 },
          { name: 'Wed', bookings: 6, revenue: 7200 },
          { name: 'Thu', bookings: 2, revenue: 2400 },
          { name: 'Fri', bookings: 8, revenue: 9600 },
          { name: 'Sat', bookings: 5, revenue: 6000 },
          { name: 'Sun', bookings: 1, revenue: 1200 },
        ]);
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      }
    };

    fetchStats();
  }, [user, profile]);

  if (!profile) return <Box p={10} textAlign="center"><Typography>Loading profile...</Typography></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back, {profile.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your account today.
          </Typography>
        </Box>
        
        <Box>
          {profile.verificationStatus === 'verified' ? (
            <Chip 
              icon={<ShieldCheck size={18} />} 
              label="Verified" 
              color="success" 
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          ) : (
            <Chip 
              label="Not verified" 
              color="warning" 
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          )}
        </Box>

        {profile.role === 'provider' && (
          <Box>
            {profile.verificationStatus === 'verified' ? (
              <Chip 
                icon={<ShieldCheck size={18} />} 
                label="Verified Provider" 
                color="success" 
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            ) : (
              <Chip 
                icon={<Clock size={18} />} 
                label={`Verification ${profile.verificationStatus || 'Pending'}`} 
                color="warning" 
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            icon={<Calendar size={24} />} 
            label="Total Bookings" 
            value={stats.totalBookings} 
            color={theme.palette.primary.main} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {profile.role === 'provider' && (
            <StatCard 
              icon={<DollarSign size={24} />} 
              label="Total Earnings" 
              value={`Rs. ${stats.totalEarnings}`} 
              color={theme.palette.success.main} 
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            icon={<Wallet size={24} />} 
            label="Wallet Balance" 
            value={`Rs. ${stats.walletBalance}`} 
            color={theme.palette.secondary.main} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            icon={<Clock size={24} />} 
            label="Escrow (Pending)" 
            value={`Rs. ${stats.pendingBalance}`} 
            color={theme.palette.warning.main} 
          />
        </Grid>
      </Grid>

      {profile.role === 'provider' && (
        <Card sx={{ mb: 6, bgcolor: 'grey.900', color: 'white', borderRadius: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={4}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <Wallet size={32} color={theme.palette.success.light} />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'grey.400', fontWeight: 500 }}>Available for Withdrawal</Typography>
                  <Typography variant="h3" fontWeight={700}>Rs. {stats.walletBalance}</Typography>
                </Box>
              </Stack>
              <Button 
                variant="contained" 
                color="success" 
                size="large"
                onClick={() => setIsWithdrawalModalOpen(true)}
                disabled={stats.walletBalance < 500}
                endIcon={<ArrowUpRight size={20} />}
                sx={{ 
                  borderRadius: 3, 
                  px: 4, 
                  py: 2, 
                  fontWeight: 700,
                  bgcolor: theme.palette.success.main,
                  '&:hover': { bgcolor: theme.palette.success.dark }
                }}
              >
                Withdraw Funds
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            {/* Chart Section */}
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h6" fontWeight={700}>Activity Overview</Typography>
                  <Chip 
                    icon={<TrendingUp size={14} />} 
                    label="+12.5% from last week" 
                    color="success" 
                    size="small" 
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadows[3] }}
                        cursor={{ fill: theme.palette.action.hover }}
                      />
                      <Bar dataKey="bookings" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Recent Invoices</Typography>
                <TableContainer component={Box}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Invoice ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell sx={{ fontWeight: 600 }}>#{invoice.id.slice(0, 8)}</TableCell>
                          <TableCell>Rs. {invoice.amount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={invoice.status} 
                              size="small" 
                              color={invoice.status === 'paid' ? 'success' : 'warning'}
                              sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                            />
                          </TableCell>
                          <TableCell color="text.secondary">{invoice.createdAt.split('T')[0]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {recentInvoices.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">No invoices found</Typography>
                    </Box>
                  )}
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 4 }}>Recent Bookings</Typography>
              <Stack spacing={3}>
                {recentBookings.map((booking) => (
                  <Box key={booking.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ borderRadius: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                      {booking.serviceId === 'Plumbing' ? '🚰' : '⚡'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{booking.serviceId}</Typography>
                      <Typography variant="caption" color="text.secondary">{booking.bookingDate}</Typography>
                    </Box>
                    <Chip 
                      label={booking.status} 
                      size="small" 
                      color={booking.status === 'pending' ? 'warning' : 'success'}
                      sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                    />
                  </Box>
                ))}
                {recentBookings.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">No recent activity</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        userId={user.uid}
        balance={stats.walletBalance}
      />
    </Container>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const theme = useTheme();
  return (
    <Card sx={{ borderRadius: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <Box sx={{ 
          width: 48, 
          height: 48, 
          borderRadius: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: alpha(color, 0.1),
          color: color
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
