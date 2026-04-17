import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        await addDoc(collection(db, 'feedback'), {
          name,
          email,
          message,
          read: false,
          createdAt: new Date().toISOString()
        });
        alert('Thank you — message received.');
        setName(''); setEmail(''); setMessage('');
      } catch (err) {
        console.error('Failed to send feedback', err);
        alert('Failed to send message. Please try again later.');
      }
    })();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600">For support, partnerships, or media inquiries please use the form below.</p>
      </div>
      
      <div className="bg-white p-8 border rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="john@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="How can we help?" value={message} onChange={e => setMessage(e.target.value)} rows={6} required />
          </div>
          <div className="text-center">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 transition text-white font-medium px-8 py-3 rounded-lg shadow-sm w-full md:w-auto">Send Message</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;
