import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { createDirectMessage, getDirectMessages, getConversations, getOrCreateConversation } from '../firebase/db';
import { getUserData } from '../firebase/auth';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function MessagesCenter({ isOpen, onClose, currentUserId, userRole, userClassIds, onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadConversations();
    }
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await getConversations(currentUserId);
      const enriched = await Promise.all(convs.map(async (conv) => {
        const otherUid = conv.participants?.find(p => p !== currentUserId);
        if (otherUid) {
          const user = await getUserData(otherUid);
          return { ...conv, otherUser: user, otherUserId: otherUid };
        }
        return conv;
      }));
      setConversations(enriched);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await getDirectMessages(selectedConversation, currentUserId);
      setMessages(msgs);
      const conv = conversations.find(c => c.id === selectedConversation);
      if (conv) {
        setOtherUser(conv.otherUser);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    const otherUid = conversations.find(c => c.id === selectedConversation)?.otherUserId;
    if (!otherUid) return;
    
    setSending(true);
    try {
      await createDirectMessage(currentUserId, otherUid, newMessage.trim());
      setNewMessage('');
      loadMessages();
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Klarte ikke sende melding');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'i dag';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'i går';
    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="bio-card w-full max-w-4xl h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-display font-700 text-white text-xl">Meldinger</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-white/10 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-bio-400 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ingen meldinger ennå</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUid = conv.otherUserId;
                const name = conv.otherUser?.name || 'Ukjent';
                const isUnread = conv.unreadCount?.[currentUserId] > 0;
                
                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 hover:bg-white/5 transition-colors ${
                      selectedConversation === conv.id ? 'bg-white/10' : ''
                    }`}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-600">
                      {name[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-body font-500 truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                          {name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm truncate">{conv.lastMessage || '...'}</p>
                    </div>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-bio-500 mt-2" />}
                  </motion.button>
                );
              })
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {selectedConversation && otherUser ? (
              <>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-600 text-sm">
                      {otherUser.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-body font-500">{otherUser.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{otherUser.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isSender = msg.senderUid === currentUserId;
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-3 rounded-xl ${
                          isSender 
                            ? 'bg-bio-500/20 text-white border border-bio-500/30' 
                            : 'bg-white/5 text-slate-200 border border-white/10'
                        }`}>
                          <p className="text-sm font-body">{msg.text}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatTime(msg.createdAt)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Skriv en melding..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-body focus:border-bio-500/50 outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="p-2 rounded-xl bg-bio-500 text-white disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <p>Velg en samtale for å se meldinger</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
