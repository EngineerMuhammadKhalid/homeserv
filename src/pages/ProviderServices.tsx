import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Check, X, DollarSign, Clock, Tag, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export const ProviderServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    duration: '1 hour',
    category: 'Plumbing',
    imageUrl: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'services'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'services');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'services'), {
          ...formData,
          providerId: user.uid,
          providerName: user.displayName || 'Provider',
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setFormData({ title: '', description: '', price: 0, duration: '1 hour', category: 'Plumbing', imageUrl: '' });
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'services');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'services');
      }
    }
  };

  const startEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      imageUrl: service.imageUrl || ''
    });
    setIsAdding(true);
  };

  if (loading) return <div className="p-20 text-center">Loading your services...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">My Services (Gigs)</h1>
          <p className="text-zinc-500">Create and manage the specific services you offer to customers</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ title: '', description: '', price: 0, duration: '1 hour', category: 'Plumbing', imageUrl: '' });
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancel' : 'Create New Gig'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-10"
          >
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50/50 space-y-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                {editingId ? 'Edit Service Details' : 'What service are you offering?'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Gig Title</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="I will fix your leaking pipes professionally"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Description</label>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe exactly what is included in this service..."
                      className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-2">Price (Rs.)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="number" 
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                          className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-2">Estimated Duration</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="text" 
                          required
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          placeholder="e.g. 2 hours"
                          className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500 appearance-none"
                      >
                        {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Cover Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="url" 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                >
                  <Check size={20} />
                  {editingId ? 'Update Gig' : 'Publish Gig'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <motion.div 
            key={service.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl border border-black/5 overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className="aspect-video relative bg-zinc-100">
              {service.imageUrl ? (
                <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => startEdit(service)}
                  className="p-2 bg-white/90 backdrop-blur-sm text-zinc-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
                  className="p-2 bg-white/90 backdrop-blur-sm text-zinc-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                  {service.category}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="font-bold text-zinc-900 text-lg mb-2 line-clamp-1">{service.title}</h3>
              <p className="text-zinc-500 text-sm mb-6 line-clamp-2 h-10">{service.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <div className="flex items-center gap-1 text-zinc-400 text-xs">
                  <Clock size={14} />
                  {service.duration}
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Starting at</span>
                  <span className="text-xl font-black text-emerald-600">Rs. {service.price}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {services.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-zinc-900">You haven't created any gigs yet</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mt-2">Create your first service to start receiving bookings from customers.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-6 text-emerald-600 font-bold hover:underline"
            >
              Create your first gig now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
