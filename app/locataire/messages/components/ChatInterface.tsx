'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ChevronLeft } from 'lucide-react';
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
        scrollToBottom();
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
        <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100dvh-64px)] h-[calc(100dvh-64px-var(--mobile-nav-height))] bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm z-10 shrink-0">
                <Link href="/locataire/dashboard" className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold border border-slate-200">
                        {ownerName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 leading-tight">{ownerName || 'Propriétaire'}</h2>
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            En ligne
                        </p>
                    </div>
                </div>
            </div>

            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-4">
                {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex justify-center sticky top-0 z-10 py-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full border shadow-sm backdrop-blur-sm text-slate-500 bg-white/80 border-gray-200">
                                {format(new Date(dateKey), 'd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        {/* Messages */}
                        <div className="space-y-1">
                            {msgs.map((msg, index) => {
                                const isMe = isFromTenant(msg);
                                const showAvatar = !isMe && (index === 0 || isFromTenant(msgs[index - 1]));
                                const isLastFromSender = index === msgs.length - 1 || isFromTenant(msgs[index + 1]) !== isMe;

                                return (
                                    <div key={msg.id} className={cn("flex w-full items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        {!isMe && (
                                            <div className="w-6 h-6 shrink-0">
                                                {showAvatar && (
                                                    <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        {ownerName?.[0]?.toUpperCase() || 'P'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[75%] px-4 py-2.5 text-sm shadow-sm break-words relative",
                                            isMe
                                                ? "bg-slate-900 text-white rounded-2xl rounded-br-none"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-none",
                                            !isLastFromSender && (isMe ? "rounded-br-2xl mb-0.5" : "rounded-bl-2xl mb-0.5")
                                        )}>
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <p className={cn(
                                                "text-[9px] mt-1 text-right ml-2 opacity-70",
                                                isMe ? "text-slate-300" : "text-slate-400"
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
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Nouvelle conversation</h3>
                        <p className="max-w-xs mt-2 text-sm text-slate-500">
                            Envoyez un message à votre propriétaire
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 z-10 shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-lg mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez un message..."
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 h-11 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all active:scale-95 shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
