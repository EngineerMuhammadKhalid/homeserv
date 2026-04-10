import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, Calendar, DollarSign, Briefcase, Star, Save, AlertCircle, Camera, Plus, X, Image as ImageIcon, Award, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export const ProviderSection = () => {
  const { user, profile } = useAuth();
  const [providerData, setProviderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioItem, setNewPortfolioItem] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchProvider = async () => {
      const docSnap = await getDoc(doc(db, 'service_providers', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProviderData({
          ...data,
          name: data.name || profile?.name || profile?.displayName || '',
          portfolio: data.portfolio || [],
          skills: data.skills || [],
          languages: data.languages || ['English'],
          profilePhoto: data.profilePhoto || profile?.profilePhoto || ''
        });
      } else {
        // Initialize if not exists
        const initialData = {
          name: profile?.name || profile?.displayName || '',
          userId: user.uid,
          bio: '',
          hourlyRate: 1000,
          experienceYears: 1,
          verificationStatus: 'pending',
          availabilityStatus: true,
          categories: [],
          rating: 0,
          reviewCount: 0,
          portfolio: [],
          skills: [],
          languages: ['English'],
          profilePhoto: profile?.profilePhoto || ''
        };
        await setDoc(doc(db, 'service_providers', user.uid), initialData);
        setProviderData(initialData);
      }
      setLoading(false);
    };

    fetchProvider();
  }, [user, profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'service_providers', user.uid), providerData);
      // Also update user profile photo if changed
      if (providerData.profilePhoto !== profile?.profilePhoto) {
        await updateDoc(doc(db, 'users', user.uid), { profilePhoto: providerData.profilePhoto });
      }
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error updating profile.');
    }
    setIsSaving(false);
  };

  const addSkill = () => {
    if (newSkill && !providerData.skills.includes(newSkill)) {
      setProviderData({ ...providerData, skills: [...providerData.skills, newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProviderData({ ...providerData, skills: providerData.skills.filter((s: string) => s !== skill) });
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem && !providerData.portfolio.includes(newPortfolioItem)) {
      setProviderData({ ...providerData, portfolio: [...providerData.portfolio, newPortfolioItem] });
      setNewPortfolioItem('');
    }
  };

  const removePortfolioItem = (url: string) => {
    setProviderData({ ...providerData, portfolio: providerData.portfolio.filter((p: string) => p !== url) });
  };

  if (loading) return <div className="p-20 text-center">Loading provider profile...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Professional Profile</h1>
          <p className="text-zinc-500">Showcase your expertise and attract more clients</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
          providerData.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {providerData.verificationStatus === 'verified' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          {providerData.verificationStatus === 'verified' ? 'Verified Expert' : 'Verification Pending'}
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Photo Section */}
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Camera size={20} className="text-emerald-600" /> Profile Identity
            </h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-zinc-100 overflow-hidden border-2 border-emerald-500/20">
                  {providerData.profilePhoto ? (
                    <img src={providerData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Camera size={32} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-zinc-900 mb-2">Profile Photo URL</label>
                <input 
                  type="url" 
                  value={providerData.profilePhoto}
                  onChange={(e) => setProviderData({ ...providerData, profilePhoto: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-400 mt-2">Use a clear, professional headshot for better trust.</p>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-emerald-600" /> Professional Summary
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">About You (Biography)</label>
                <textarea 
                  value={providerData.bio}
                  onChange={(e) => setProviderData({ ...providerData, bio: e.target.value })}
                  rows={5}
                  className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Describe your expertise, tools you use, and why clients should hire you..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Hourly Rate (Rs.)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="number" 
                      value={providerData.hourlyRate}
                      onChange={(e) => setProviderData({ ...providerData, hourlyRate: parseInt(e.target.value) })}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Experience (Years)</label>
                  <input 
                    type="number" 
                    value={providerData.experienceYears}
                    onChange={(e) => setProviderData({ ...providerData, experienceYears: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Portfolio */}
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Award size={20} className="text-emerald-600" /> Skills & Expertise
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-4">Add Skills</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g. Pipe Fitting, Wiring, Deep Cleaning"
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="button"
                    onClick={addSkill}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {providerData.skills.map((skill: string) => (
                    <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-zinc-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-black/5">
                <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-emerald-600" /> Portfolio Gallery
                </h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="url"
                    value={newPortfolioItem}
                    onChange={(e) => setNewPortfolioItem(e.target.value)}
                    placeholder="Add work sample image URL..."
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="button"
                    onClick={addPortfolioItem}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {providerData.portfolio.map((url: string) => (
                    <div key={url} className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-100">
                      <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removePortfolioItem(url)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Star size={40} fill="currentColor" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">{providerData.rating || '0.0'}</p>
            <p className="text-zinc-500 text-sm">Average Rating</p>
            <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl font-bold text-zinc-900">{providerData.reviewCount}</p>
                <p className="text-zinc-500 text-xs">Reviews</p>
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">{providerData.experienceYears}</p>
                <p className="text-zinc-500 text-xs">Years Exp.</p>
              </div>
            </div>
          </div>

          {/* Availability & Languages */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-900">Active Status</p>
                <p className="text-xs text-zinc-500">Visible in search</p>
              </div>
              <button 
                type="button"
                onClick={() => setProviderData({ ...providerData, availabilityStatus: !providerData.availabilityStatus })}
                className={`w-12 h-6 rounded-full transition-colors relative ${providerData.availabilityStatus ? 'bg-emerald-600' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${providerData.availabilityStatus ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-black/5">
              <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Globe size={16} className="text-emerald-600" /> Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {['English', 'Hindi', 'Urdu', 'Punjabi'].map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      const langs = providerData.languages.includes(lang)
                        ? providerData.languages.filter((l: string) => l !== lang)
                        : [...providerData.languages, lang];
                      setProviderData({ ...providerData, languages: langs });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      providerData.languages.includes(lang) 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-zinc-100 text-zinc-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? 'Saving Profile...' : 'Save All Changes'}
          </button>
          
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-center text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              {message}
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};
