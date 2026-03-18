import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
}

export const WithdrawalModal = ({ isOpen, onClose, userId, balance }: WithdrawalModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      const fetchPayoutDetails = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'service_providers', userId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const methods = data.payoutMethods;
            if (methods) {
              if (method === 'easypaisa' && methods.easypaisa) {
                setDetails(methods.easypaisa);
              } else if (method === 'jazzcash' && methods.jazzcash) {
                setDetails(methods.jazzcash);
              } else if (method === 'bank' && methods.bank) {
                const bank = methods.bank;
                setDetails(`${bank.bankName || ''} - ${bank.accountName || ''}\nAcc: ${bank.accountNumber || ''}\nIBAN: ${bank.iban || ''}`);
              } else {
                setDetails('');
              }
            }
          }
        } catch (err) {
          console.error('Error fetching payout details:', err);
        }
      };
      fetchPayoutDetails();
    }
  }, [isOpen, userId, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawalAmount = Number(amount);
    
    if (withdrawalAmount <= 0 || withdrawalAmount > balance) {
      alert('Invalid amount');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawal_requests'), {
        userId,
        amount: withdrawalAmount,
        method,
        details,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAmount('');
        setDetails('');
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'withdrawal_requests');
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
            <DollarSign size={20} className="text-emerald-600" /> Withdraw Funds
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">Request Submitted!</h3>
              <p className="text-zinc-500 text-sm">Your withdrawal request is being processed. Funds will be transferred within 24-48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
                <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-zinc-900">Rs. {balance}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Amount to Withdraw</label>
                <input 
                  type="number"
                  required
                  min="500"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  placeholder="Min. Rs. 500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Withdrawal Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['easypaisa', 'jazzcash', 'bank'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m as any)}
                      className={`p-3 rounded-xl border-2 text-[10px] font-bold capitalize transition-all ${
                        method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-zinc-100 text-zinc-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Account Details</label>
                <textarea 
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500 min-h-[80px] text-sm"
                  placeholder={method === 'bank' ? 'Bank Name, Account Number, IBAN' : 'Mobile Number and Account Name'}
                />
              </div>

              <button
                type="submit"
                disabled={loading || Number(amount) < 500 || Number(amount) > balance}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
