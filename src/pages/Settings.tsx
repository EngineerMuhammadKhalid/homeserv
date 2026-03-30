import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { storage } from '../firebase';
import { useAuth } from '../AuthContext';
import { User, Camera, Plus, Trash2, Save, Briefcase, HelpCircle, MapPin, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SERVICES_LIST } from '../data/services';

export const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || '');
  const [providerData, setProviderData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [verificationDocs, setVerificationDocs] = useState<string[]>([]);
  const [verificationRequest, setVerificationRequest] = useState<any | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      const fetchProviderData = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'service_providers', user.uid));
          if (docSnap.exists()) {
            setProviderData(docSnap.data());
          }
        } catch (err) {
          console.error(err);

        useEffect(() => {
          // fetch any existing verification request by this user
          if (!user) return;
          const fetchRequest = async () => {
            try {
              const q = query(collection(db, 'verifications'), where('userId', '==', user.uid));
              const snap = await getDocs(q);
              if (!snap.empty) {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // pick the latest request
                docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                setVerificationRequest(docs[0]);
              }
            } catch (err) {
              console.error('Failed to fetch verification request', err);
            }
          };
          fetchRequest();
        }, [user]);
        }
      };
      fetchProviderData();
    }
  }, [user, profile]);

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && providerData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPortfolio = [...(providerData.portfolio || []), reader.result as string];
        setProviderData({ ...providerData, portfolio: newPortfolio });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Upload immediately to Firebase Storage and store URL
    (async () => {
      try {
        const path = `verifications/${user.uid}/${Date.now()}_${file.name}`;
        const ref = storageRef(storage, path);
        const snapshot = await uploadBytes(ref, file);
        const url = await getDownloadURL(snapshot.ref);
        setVerificationDocs(prev => [...prev, url]);
      } catch (err) {
        console.error('Upload error', err);
        alert('Failed to upload document: ' + (err as any).message);
      }
    })();
  };

  const removePortfolioItem = (idx: number) => {
    const newPortfolio = providerData.portfolio.filter((_: any, i: number) => i !== idx);
    setProviderData({ ...providerData, portfolio: newPortfolio });
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return;
    const newFaqs = [...(providerData.faqs || []), newFaq];
    setProviderData({ ...providerData, faqs: newFaqs });
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (idx: number) => {
    const newFaqs = providerData.faqs.filter((_: any, i: number) => i !== idx);
    setProviderData({ ...providerData, faqs: newFaqs });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update User Profile
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        username,
        profilePhoto,
        currency: localStorage.getItem('hs_currency') || undefined,
        updatedAt: new Date().toISOString()
      });

      // Update Provider Data if applicable
      if (profile?.role === 'provider' && providerData) {
        await setDoc(doc(db, 'service_providers', user.uid), {
          ...providerData,
          name, // keep provider name in sync with user profile
          profilePhoto, // Keep in sync
          address: providerData.address || '', // Ensure address is saved
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      await refreshProfile();
      alert('Settings saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
    setIsSaving(false);
  };

  const submitVerificationRequest = async () => {
    if (!user) return alert('You must be signed in to request verification');
    if (verificationDocs.length === 0) return alert('Please upload at least one document');
    setIsSubmittingVerification(true);
    try {
      const docRef = await addDoc(collection(db, 'verifications'), {
        userId: user.uid,
        type: profile?.role || 'customer',
        documentUrl: verificationDocs,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      // mark user as pending locally in users collection
      await updateDoc(doc(db, 'users', user.uid), { verificationStatus: 'pending' });
      setVerificationRequest({ id: docRef.id, userId: user.uid, type: profile?.role || 'customer', documentUrl: verificationDocs, status: 'pending', submittedAt: new Date().toISOString() });
      alert('Verification request submitted. An admin will review your documents.');
    } catch (err) {
      console.error('Verification submit error', err);
      alert('Failed to submit verification request: ' + (err as any).message);
    }
    setIsSubmittingVerification(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <User size={20} className="text-emerald-600" />
            Profile Information
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-zinc-100 overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={profilePhoto || `https://ui-avatars.com/api/?name=${name}&background=random`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-700 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                <Camera size={18} />
              </label>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-8 pr-3 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    placeholder="choose_username"
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-400">Your unique identifier on the platform.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Email Address (Cannot be changed)</label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Verification Request Section */}
        <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Account Verification</h2>
          <p className="text-sm text-zinc-500 mb-4">Verify your identity to get the verified badge. Upload a government ID or business documents.</p>

          {verificationRequest ? (
            <div className="space-y-3">
              <p className="text-sm font-bold">Request Status: <span className="font-normal">{verificationRequest.status}</span></p>
              <div className="flex gap-2 flex-wrap">
                {verificationRequest.documents?.map((d: string, i: number) => (
                  <img key={i} src={d} alt={`doc-${i}`} className="w-28 h-20 object-cover rounded-md border" referrerPolicy="no-referrer" />
                ))}
              </div>
              {verificationRequest.status === 'rejected' && (
                <p className="text-sm text-red-600">Your request was rejected. Please upload clearer documents and resubmit.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Upload Documents</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleVerificationUpload} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {verificationDocs.map((d, idx) => (
                    <img key={idx} src={d} alt={`doc-${idx}`} className="w-28 h-20 object-cover rounded-md border" referrerPolicy="no-referrer" />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={submitVerificationRequest} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold" disabled={isSubmittingVerification}>
                  {isSubmittingVerification ? 'Submitting...' : 'Request Verification'}
                </button>
                <button onClick={() => setVerificationDocs([])} className="bg-zinc-50 px-5 py-2 rounded-xl">Clear</button>
              </div>
            </div>
          )}
        </section>

        {/* Provider Specific Sections */}
        {profile?.role === 'provider' && providerData && (
          <>
            {/* Services Section */}
            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-emerald-600" />
                Services You Provide
              </h2>
              <p className="text-sm text-zinc-500 mb-4">Select all the services you offer to help customers find you easily.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICES_LIST.map(service => (
                  <button
                    key={service}
                    onClick={() => {
                      const current = providerData.services || [];
                      const updated = current.includes(service)
                        ? current.filter((s: string) => s !== service)
                        : [...current, service];
                      setProviderData({ ...providerData, services: updated });
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      (providerData.services || []).includes(service)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-50 text-zinc-700 border border-zinc-100 hover:bg-zinc-100'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </section>

            {/* Service Area / Address Section */}
            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600" />
                Service Area / Address
              </h2>
              <input
                type="text"
                value={providerData.address || ''}
                onChange={(e) => setProviderData({ ...providerData, address: e.target.value })}
                className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                placeholder="Enter your primary service area (e.g. Gulberg, Lahore)"
              />
              <p className="mt-2 text-xs text-zinc-400 italic">This helps customers find you when they search by location.</p>
            </section>

            {/* Payout Methods Section */}
            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-600" />
                Payout Methods
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Connect your accounts to receive payments. These details will be used for your withdrawal requests.</p>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                  <p className="text-xs font-bold text-purple-900 uppercase mb-2">💜 Wallet (HomeServ)</p>
                  <p className="text-xs text-purple-700">Your funds are automatically added to your HomeServ wallet. No additional setup needed - withdraw anytime!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">EasyPaisa Number</label>
                    <input
                      type="text"
                      value={providerData.payoutMethods?.easypaisa || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { ...providerData.payoutMethods, easypaisa: e.target.value } 
                      })}
                      className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">JazzCash Number</label>
                    <input
                      type="text"
                      value={providerData.payoutMethods?.jazzcash || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { ...providerData.payoutMethods, jazzcash: e.target.value } 
                      })}
                      className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>
                </div>

                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-4">
                  <h3 className="font-bold text-zinc-900 text-sm">Bank Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={providerData.payoutMethods?.bank?.bankName || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { 
                          ...providerData.payoutMethods, 
                          bank: { ...(providerData.payoutMethods?.bank || {}), bankName: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={providerData.payoutMethods?.bank?.accountName || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { 
                          ...providerData.payoutMethods, 
                          bank: { ...(providerData.payoutMethods?.bank || {}), accountName: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={providerData.payoutMethods?.bank?.accountNumber || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { 
                          ...providerData.payoutMethods, 
                          bank: { ...(providerData.payoutMethods?.bank || {}), accountNumber: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="IBAN"
                      value={providerData.payoutMethods?.bank?.iban || ''}
                      onChange={(e) => setProviderData({ 
                        ...providerData, 
                        payoutMethods: { 
                          ...providerData.payoutMethods, 
                          bank: { ...(providerData.payoutMethods?.bank || {}), iban: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Portfolio Section */}
            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-emerald-600" />
                Portfolio
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {providerData.portfolio?.map((img: string, idx: number) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-black/5">
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      onClick={() => removePortfolioItem(idx)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all text-zinc-400 hover:text-emerald-600">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
                  <Plus size={24} />
                  <span className="text-xs font-bold mt-2">Add Work</span>
                </label>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <HelpCircle size={20} className="text-emerald-600" />
                Frequently Asked Questions
              </h2>

              <div className="space-y-4 mb-8">
                {providerData.faqs?.map((faq: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                    <button
                      onClick={() => removeFaq(idx)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="font-bold text-zinc-900 text-sm mb-1">{faq.question}</p>
                    <p className="text-zinc-600 text-xs">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-4">
                <h3 className="font-bold text-zinc-900 text-sm">Add New FAQ</h3>
                <input
                  type="text"
                  placeholder="Question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                />
                <textarea
                  placeholder="Answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500 text-sm min-h-[80px]"
                />
                <button
                  onClick={addFaq}
                  className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors text-sm"
                >
                  Add FAQ
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
