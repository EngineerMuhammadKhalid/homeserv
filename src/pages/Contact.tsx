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
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-600 mb-6">For support, partnerships, or media inquiries please use the form below.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 border rounded" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="w-full p-3 border rounded" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <textarea className="w-full p-3 border rounded" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} rows={6} required />
        <div>
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded">Send Message</button>
        </div>
      </form>
    </div>
  );
};

export default Contact;
