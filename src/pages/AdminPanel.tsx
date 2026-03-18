import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Users, ShieldCheck, AlertCircle, CheckCircle, XCircle, BarChart3, Settings, Search, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminPanel = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'providers' | 'disputes' | 'reports' | 'categories'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const providersSnap = await getDocs(collection(db, 'service_providers'));
        setProviders(providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const disputesSnap = await getDocs(collection(db, 'disputes'));
        setDisputes(disputesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const reportsSnap = await getDocs(collection(db, 'reports'));
        setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Admin Fetch Error:', err);
      }
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const handleVerifyProvider = async (providerId: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'service_providers', providerId), {
        verificationStatus: status
      });
      // Also update the user profile if needed
      await updateDoc(doc(db, 'users', providerId), {
        verificationStatus: status
      });
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, verificationStatus: status } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveDispute = async (disputeId: string, bookingId: string, resolution: 'resolved_refunded' | 'resolved_released') => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const disputeRef = doc(db, 'disputes', disputeId);

      if (resolution === 'resolved_released') {
        await updateDoc(bookingRef, { status: 'completed', escrowStatus: 'released' });
      } else {
        await updateDoc(bookingRef, { status: 'cancelled', escrowStatus: 'refunded' });
      }

      await updateDoc(disputeRef, { status: resolution, adminNotes: 'Resolved by admin' });
      
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: resolution } : d));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const totalCommission = bookings.reduce((acc, b) => acc + (b.commissionAmount || 0), 0);
  const totalVolume = bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  if (profile?.role !== 'admin') {
    return <div className="p-20 text-center text-red-600 font-bold">Access Denied. Admin only.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6 px-3">Admin Panel</h2>
          <AdminTab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={18} />} label="Overview" />
          <AdminTab active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="User Management" />
          <AdminTab active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} icon={<ShieldCheck size={18} />} label="Provider Verification" />
          <AdminTab active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')} icon={<AlertCircle size={18} />} label="Dispute Resolution" />
          <AdminTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<ShieldAlert size={18} />} label="User Reports" />
          <AdminTab active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Settings size={18} />} label="System Settings" />
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-zinc-900">{users.length}</p>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Active Providers</p>
                  <p className="text-3xl font-bold text-zinc-900">{providers.length}</p>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Commission Earned</p>
                  <p className="text-3xl font-bold text-emerald-600">Rs. {totalCommission.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-zinc-900">Rs. {totalVolume.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {providers.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200"></div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900">Provider {p.id.slice(0, 4)}</p>
                          <p className="text-xs text-zinc-500">Applied for verification</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 uppercase">
                        {p.verificationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">Provider Verification</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="text" placeholder="Search providers..." className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-400 text-xs uppercase tracking-wider border-b border-black/5">
                      <th className="pb-4 font-bold">Provider</th>
                      <th className="pb-4 font-bold">Categories</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {providers.map(p => (
                      <tr key={p.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900">ID: {p.id.slice(0, 8)}</p>
                              <p className="text-xs text-zinc-500">Exp: {p.experienceYears} years</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1">
                            {p.categories?.slice(0, 2).map((c: string) => (
                              <span key={c} className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{c}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                            p.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 
                            p.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.verificationStatus}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleVerifyProvider(p.id, 'verified')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleVerifyProvider(p.id, 'rejected')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900">Dispute Resolution</h3>
              <div className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">No active disputes.</div>
                ) : (
                  disputes.map(d => (
                    <div key={d.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900">Dispute #{d.id.slice(0, 8)}</p>
                          <p className="text-sm text-zinc-500">Booking: {d.bookingId}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          d.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 mb-6">Reason: {d.reason}</p>
                      {d.status === 'open' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleResolveDispute(d.id, d.bookingId, 'resolved_released')}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Release Funds to Provider
                          </button>
                          <button 
                            onClick={() => handleResolveDispute(d.id, d.bookingId, 'resolved_refunded')}
                            className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                          >
                            Refund Customer
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900">User Reports</h3>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">No active reports.</div>
                ) : (
                  reports.map(r => (
                    <div key={r.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900">Report #{r.id.slice(0, 8)}</p>
                          <p className="text-xs text-zinc-500">Reporter: {r.reporterId}</p>
                          <p className="text-xs text-zinc-500">Reported: {r.reportedId}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          r.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-200 text-zinc-600'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-bold text-zinc-900">Reason: {r.reason}</p>
                        <p className="text-sm text-zinc-600">{r.details}</p>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Mark Resolved
                          </button>
                          <button 
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="flex-1 bg-zinc-400 text-white py-2 rounded-xl text-sm font-bold hover:bg-zinc-500 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="text-center py-20">
              <Users className="mx-auto text-zinc-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-zinc-900">User Management</h3>
              <p className="text-zinc-500">Detailed user controls coming in the next update.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const AdminTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-zinc-500 hover:bg-zinc-100'
    }`}
  >
    {icon}
    {label}
  </button>
);
