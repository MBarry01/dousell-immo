'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sendTenantMessage, markTenantMessagesAsRead } from '../actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
    id: string;
    lease_id: string;
    sender_id: string;
    sender_type?: string;
    content: string;
    created_at: string;
}

interface ChatProps {
    initialMessages: Message[];
    leaseId: string;
    ownerId: string; // Owner's UUID - messages from owner have this sender_id
    ownerName?: string;
}

/**
 * Chat Interface for Tenant Portal
 * 
 * Message identification:
 * - Messages from owner: sender_id === ownerId
 * - Messages from tenant: sender_type === 'tenant'
 */
export default function ChatInterface({ initialMessages, leaseId, ownerId, ownerName }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper to check if message is from tenant (not owner)
    const isFromTenant = (msg: Message) => {
        return msg.sender_type === 'tenant' || msg.id.startsWith('temp-');
    };

    // Mark owner messages as read when opening conversation
    useEffect(() => {
        markTenantMessagesAsRead();
    }, []);

    // Setup Realtime Subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`chat:${leaseId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `lease_id=eq.${leaseId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;

                    // If message is from owner, mark as read immediately
                    if (newMsg.sender_type === 'owner' && newMsg.lease_id === leaseId) {
                        markTenantMessagesAsRead();
                    }

                    setMessages((current) => {
                        if (current.some(m => m.id === newMsg.id)) return current;

                        // Check for optimistic update replacement
                        if (isFromTenant(newMsg)) {
                            const optimisticIndex = current.findIndex(m =>
                                m.id.startsWith('temp-') &&
                                m.content === newMsg.content
                            );

                            if (optimisticIndex !== -1) {
                                const updated = [...current];
                                updated[optimisticIndex] = newMsg;
                                return updated;
                            }
                        }

                        return [...current, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [leaseId, ownerId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const content = newMessage.trim();
        setIsSending(true);
        setNewMessage('');

        // Optimistic update
        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            lease_id: leaseId,
            sender_id: ownerId,
            sender_type: 'tenant',
            content: content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const result = await sendTenantMessage(leaseId, content);

        if (result?.error) {
            alert(result.error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }

        setIsSending(false);
    };

    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.created_at);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(msg);
        return groups;
    }, {} as Record<string, Message[]>);

    return (
        <div className={cn(
            "fixed inset-x-0 z-30 flex flex-col overflow-hidden bg-slate-50",
            "top-[calc(4rem+env(safe-area-inset-top))] md:top-16",
            "bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-0",
        )}>
            {/* Header Chat - Fixe */}
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm shrink-0 z-20">
                <Link href="/locataire" className="p-2 -ml-2 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white font-black border-2 border-slate-100 shadow-sm uppercase tracking-tighter">
                        {ownerName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                        <h2 className="font-black text-[#0F172A] tracking-tight text-sm leading-none mb-1 uppercase">{ownerName || 'Propriétaire'}</h2>
                        <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            En ligne
                        </p>
                    </div>
                </div>
            </div>

            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide pb-8 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey} className="space-y-6">
                        {/* Date Header */}
                        <div className="flex justify-center sticky top-2 z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-md text-slate-400 bg-white/80">
                                {format(new Date(dateKey), 'd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        {/* Messages */}
                        <div className="space-y-2">
                            {msgs.map((msg, index) => {
                                const isMe = isFromTenant(msg);
                                const showAvatar = !isMe && (index === 0 || isFromTenant(msgs[index - 1]));
                                const isLastFromSender = index === msgs.length - 1 || isFromTenant(msgs[index + 1]) !== isMe;

                                return (
                                    <div key={msg.id} className={cn("flex w-full items-end gap-3", isMe ? "justify-end" : "justify-start")}>
                                        {!isMe && (
                                            <div className="w-8 h-8 shrink-0 mb-1">
                                                {showAvatar && (
                                                    <div className="w-8 h-8 rounded-xl bg-[#F4C430] flex items-center justify-center text-[11px] font-black text-[#0F172A] shadow-sm border border-[#F4C430]/20 uppercase">
                                                        {ownerName?.[0]?.toUpperCase() || 'P'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[85%] sm:max-w-[75%] min-w-0 px-5 py-3.5 shadow-sm relative overflow-hidden transition-all",
                                            isMe
                                                ? "bg-[#0F172A] text-white rounded-[2rem] rounded-br-none font-medium"
                                                : "bg-white border border-slate-200 text-[#0F172A] rounded-[2rem] rounded-bl-none font-medium",
                                            !isLastFromSender && (isMe ? "rounded-br-[2rem] mb-1" : "rounded-bl-[2rem] mb-1")
                                        )}>
                                            <p className="leading-relaxed whitespace-pre-wrap break-words text-[13px] tracking-tight" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                                            <p className={cn(
                                                "text-[9px] font-black uppercase tracking-widest mt-2 flex justify-end opacity-40",
                                                isMe ? "text-slate-300" : "text-slate-500"
                                            )}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 py-24 px-6 text-center mx-2">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <MessageCircle className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Démarrer la discussion</h3>
                        <p className="max-w-xs mx-auto mt-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">
                            Prenez contact avec votre gestionnaire
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixe en bas du container */}
            <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-5 shrink-0 z-20">
                <form onSubmit={handleSend} className="flex items-center gap-3 max-w-lg mx-auto">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Éscrivez votre message..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 h-14 text-[#0F172A] placeholder:text-slate-400 focus:border-[#0F172A] focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium shadow-inner"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-14 h-14 rounded-3xl bg-[#0F172A] text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale disabled:scale-95 transition-all hover:bg-[#1e293b] active:scale-90 shrink-0 shadow-lg shadow-slate-900/10 group active-press"
                    >
                        {isSending ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Send className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
