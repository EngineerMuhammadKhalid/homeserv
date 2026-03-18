import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Send, User, Search, Phone, Video, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export const Messages = () => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Find all messages where the user is a participant
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMap = new Map();
      const sortedDocs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      sortedDocs.forEach(data => {
        const otherId = data.senderId === user.uid ? data.receiverId : data.senderId;
        if (!chatMap.has(otherId)) {
          chatMap.set(otherId, { id: otherId, lastMessage: data.content, time: data.createdAt });
        }
      });
      setChats(Array.from(chatMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedChat) return;

    // Fetch messages between current user and selected user
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Client-side filter for the specific conversation
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((msg: any) => 
          (msg.senderId === user.uid && msg.receiverId === selectedChat.id) ||
          (msg.senderId === selectedChat.id && msg.receiverId === user.uid)
        )
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(filtered);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user, selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: selectedChat.id,
        participants: [user.uid, selectedChat.id],
        content: newMessage,
        createdAt: new Date().toISOString(),
        readStatus: false
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 h-[calc(100vh-160px)]">
      <div className="bg-white rounded-3xl border border-black/5 shadow-xl flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-black/5 flex flex-col">
          <div className="p-6 border-b border-black/5">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex gap-3 hover:bg-zinc-50 transition-colors border-b border-black/5 ${selectedChat?.id === chat.id ? 'bg-emerald-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <User size={20} className="text-zinc-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-zinc-900 text-sm">User {chat.id.slice(0, 4)}</p>
                    <span className="text-[10px] text-zinc-400">{format(new Date(chat.time), 'HH:mm')}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
            {chats.length === 0 && (
              <div className="p-10 text-center text-zinc-400 text-sm">No conversations yet</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-50/50">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                    <User size={18} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">User {selectedChat.id.slice(0, 4)}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</p>
                  </div>
                </div>
                <div className="flex gap-4 text-zinc-400">
                  <button className="hover:text-emerald-600"><Phone size={20} /></button>
                  <button className="hover:text-emerald-600"><Video size={20} /></button>
                  <button className="hover:text-emerald-600"><Info size={20} /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                        msg.senderId === user?.uid 
                          ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-100' 
                          : 'bg-white text-zinc-900 rounded-tl-none border border-black/5'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderId === user?.uid ? 'text-emerald-100' : 'text-zinc-400'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-black/5">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
              <div className="text-6xl mb-4">💬</div>
              <p className="font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
