import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, addDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { Users, ShieldCheck, AlertCircle, CheckCircle, XCircle, BarChart3, Settings, Search, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminPanel = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'providers' | 'disputes' | 'reports' | 'categories' | 'verifications' | 'complaints' | 'system'>('overview');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'providers' | 'disputes' | 'reports' | 'categories' | 'verifications' | 'complaints' | 'system' | 'feedback'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  // Do not fetch or expose bookings list to admins here to protect user privacy
  // Admin can still act on disputes/reports which reference bookings when necessary
  // const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<any>({ siteTitle: 'Home Serv', commissionPercent: 10, categories: [], timelineStages: ['Requested','Accepted','In Progress','Review','Completed'], requireMutualApproval: false });

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

        const verifSnap = await getDocs(collection(db, 'verifications'));
        setVerifications(verifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // feedback
        try {
          const feedbackSnap = await getDocs(collection(db, 'feedback'));
          setFeedbackList(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          // ignore if missing
        }

        // load site settings (if present)
        try {
          const settingsRef = doc(db, 'settings', 'site');
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            setSiteSettings(settingsSnap.data());
          }
        } catch (e) {
          // ignore if missing
        }

        // intentionally do not fetch bookings for privacy
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

  const handleVerifyUser = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { verificationStatus: status });
      // if user is also a provider, update provider record
      const providerRef = doc(db, 'service_providers', userId);
      try { await updateDoc(providerRef, { verificationStatus: status }); } catch (e) { /* ignore if not a provider */ }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: status } : u));
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

  const saveSiteSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'site'), siteSettings, { merge: true });
      await addDoc(collection(db, 'admin_actions'), { action: 'update_site_settings', adminId: profile?.uid || 'system', createdAt: serverTimestamp() });
      alert('Site settings saved');
    } catch (err) {
      console.error('Failed to save site settings', err);
      alert('Failed to save settings: ' + (err as any).message);
    }
  };

  // Do not compute or display booking-level financials here for privacy

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
          <AdminTab active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')} icon={<ShieldCheck size={18} />} label="Verifications" />
          <AdminTab active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')} icon={<AlertCircle size={18} />} label="Dispute Resolution" />
          <AdminTab active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} icon={<AlertCircle size={18} />} label="Feedback" />
          <AdminTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<ShieldAlert size={18} />} label="User Reports" />
          <AdminTab active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} icon={<AlertCircle size={18} />} label="Complaints" />
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
                  <p className="text-3xl font-bold text-emerald-600">—</p>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-zinc-900">—</p>
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
                            {(p.services || p.categories || []).slice(0, 2).map((c: string) => (
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

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">Verifications Queue</h3>
                <p className="text-sm text-zinc-500">Approve or reject verification requests for users and providers.</p>
              </div>

              <div className="space-y-4">
                {verifications.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">No verification requests.</div>
                ) : (
                  verifications.map(v => (
                    <div key={v.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900">Request #{v.id.slice(0,8)}</p>
                          <p className="text-xs text-zinc-500">Requester: {v.userId} • Type: {v.type || 'user'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          v.status === 'pending' ? 'bg-amber-50 text-amber-600' : v.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {v.status || 'pending'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-bold text-zinc-900">Notes</p>
                        <p className="text-sm text-zinc-600">{v.notes || 'No additional notes.'}</p>
                        {v.documentUrl && (
                          <div className="mt-3">
                            <a href={v.documentUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">View Document</a>
                          </div>
                        )}
                      </div>

                      {v.status === 'pending' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'verifications', v.id), { status: 'approved', reviewedAt: serverTimestamp() });
                                // update user/provider record
                                await updateDoc(doc(db, v.type === 'provider' ? 'service_providers' : 'users', v.userId), { verificationStatus: 'verified' });
                                await addDoc(collection(db, 'admin_actions'), { action: 'approve_verification', targetId: v.userId, verificationId: v.id, adminId: profile?.uid || 'system', createdAt: serverTimestamp() });
                                setVerifications(prev => prev.map(x => x.id === v.id ? { ...x, status: 'approved' } : x));
                              } catch (err) { console.error(err); }
                            }}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'verifications', v.id), { status: 'rejected', reviewedAt: serverTimestamp() });
                                await updateDoc(doc(db, v.type === 'provider' ? 'service_providers' : 'users', v.userId), { verificationStatus: 'rejected' });
                                await addDoc(collection(db, 'admin_actions'), { action: 'reject_verification', targetId: v.userId, verificationId: v.id, adminId: profile?.uid || 'system', createdAt: serverTimestamp() });
                                setVerifications(prev => prev.map(x => x.id === v.id ? { ...x, status: 'rejected' } : x));
                              } catch (err) { console.error(err); }
                            }}
                            className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900">User Feedback</h3>
              <div className="space-y-4">
                {feedbackList.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">No feedback submitted yet.</div>
                ) : (
                  feedbackList.map(f => (
                    <div key={f.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900">{f.name || 'Anonymous'}</p>
                          <p className="text-xs text-zinc-500">{f.email || 'No email provided'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${f.read ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {f.read ? 'Read' : 'New'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 mb-4">{f.message}</p>
                      <div className="flex gap-3">
                        <button onClick={async () => { try { await updateDoc(doc(db, 'feedback', f.id), { read: true }); setFeedbackList(prev => prev.map(x => x.id === f.id ? { ...x, read: true } : x)); } catch (e) { console.error(e); } }} className="bg-emerald-600 text-white py-2 px-4 rounded-xl">Mark Read</button>
                        <a href={`mailto:${f.email}`} className="bg-zinc-50 px-4 py-2 rounded-xl border">Reply</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900">Complaints & Escalations</h3>
              <p className="text-sm text-zinc-500">Combined view of user reports and disputes for streamlined handling.</p>

              <div className="space-y-4 mt-4">
                {reports.concat(disputes).length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">No complaints or disputes.</div>
                ) : (
                  reports.concat(disputes).map((item: any) => (
                    <div key={item.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900">#{item.id.slice(0,8)} {item.bookingId ? '(Dispute)' : '(Report)'}</p>
                          <p className="text-xs text-zinc-500">Involved: {item.reportedId || item.customerId || item.providerId}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          item.status === 'pending' || item.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 mb-4">{item.reason || item.details}</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleResolveReport(item.id, 'resolved')} className="bg-emerald-600 text-white py-2 px-4 rounded-xl">Resolve</button>
                        <button onClick={() => handleResolveReport(item.id, 'dismissed')} className="bg-zinc-400 text-white py-2 px-4 rounded-xl">Dismiss</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900">System Settings</h3>
              <p className="text-sm text-zinc-500">Manage global settings such as site title, commission rate and category list.</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Site Title</label>
                  <input value={siteSettings.siteTitle || ''} onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Commission (%)</label>
                  <input type="number" value={siteSettings.commissionPercent || 0} onChange={(e) => setSiteSettings({ ...siteSettings, commissionPercent: Number(e.target.value) })} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold mb-2">Categories (comma separated)</label>
                <input value={(siteSettings.categories || []).join(', ')} onChange={(e) => setSiteSettings({ ...siteSettings, categories: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold mb-2">Service Timeline Stages (comma separated)</label>
                <input value={(siteSettings.timelineStages || []).join(', ')} onChange={(e) => setSiteSettings({ ...siteSettings, timelineStages: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
                <p className="text-xs text-zinc-400 mt-2">Example: Requested, Accepted, In Progress, Review, Completed</p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input id="mutual" type="checkbox" checked={!!siteSettings.requireMutualApproval} onChange={(e) => setSiteSettings({ ...siteSettings, requireMutualApproval: e.target.checked })} />
                <label htmlFor="mutual" className="text-sm">Require mutual approval from both customer and provider to mark booking as completed</label>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={saveSiteSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-xl">Save Settings</button>
                <button onClick={() => { setSiteSettings({ siteTitle: 'Home Serv', commissionPercent: 10, categories: [] }); }} className="bg-zinc-50 px-6 py-2 rounded-xl">Reset</button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">User Management</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-400 text-xs uppercase tracking-wider border-b border-black/5">
                      <th className="pb-4 font-bold">User</th>
                      <th className="pb-4 font-bold">Email</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-200"></div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900">{u.name || u.id.slice(0,8)}</p>
                              <p className="text-xs text-zinc-500">Role: {u.role || 'customer'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">{u.email}</td>
                        <td className="py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                            u.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 
                            u.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {u.verificationStatus || 'none'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleVerifyUser(u.id, 'verified')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Verify"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleVerifyUser(u.id, 'rejected')}
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
