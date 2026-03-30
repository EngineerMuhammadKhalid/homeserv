import React, { useState } from 'react';
import { X, CreditCard, DollarSign, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}

export const PaymentModal = ({ isOpen, onClose, invoice, onSuccess }: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash' | 'bank' | 'wallet'>('card');
  const { currency } = useCurrency();

  const handlePayment = async () => {
    setLoading(true);
    setStep('processing');
    try {
      const resp = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, paymentMethod, invoice })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Payment failed');
      }
      const data = await resp.json();
      if (data.status === 'success') {
        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        throw new Error('Payment processing returned unexpected status');
      }
    } catch (err: any) {
      console.error('Payment error', err);
      alert('Payment failed: ' + (err?.message || err));
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Receipt size={20} className="text-emerald-600" /> Payment Invoice
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-zinc-500 text-sm">Amount to Pay</span>
                    <span className="text-2xl font-bold text-zinc-900">{formatCurrency(invoice.amount, currency)}</span>
                  </div>
                  <div className="space-y-2">
                    {invoice.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-zinc-400">{item.description}</span>
                        <span className="text-zinc-600 font-medium">{formatCurrency(item.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-4">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-[10px] font-bold">Card / Portal</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'easypaisa' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">EP</div>
                      <span className="text-[10px] font-bold">EasyPaisa</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'jazzcash' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">JC</div>
                      <span className="text-[10px] font-bold">JazzCash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'bank' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      <DollarSign size={20} />
                      <span className="text-[10px] font-bold">Bank Transfer</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'wallet' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">W</div>
                      <span className="text-[10px] font-bold">Wallet</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  Pay Now
                </button>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <Loader2 size={48} className="text-emerald-600 animate-spin mx-auto" />
                <h3 className="text-xl font-bold text-zinc-900">Processing Payment</h3>
                <p className="text-zinc-500">Please wait while we secure your transaction...</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">Payment Successful!</h3>
                <p className="text-zinc-500">Your invoice has been paid and the booking is updated.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
