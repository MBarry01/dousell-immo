'use client';
import { createClient } from '@/utils/supabase/client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { sendTenantMessage } from '../actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

interface ChatProps {
    initialMessages: Message[];
    leaseId: string;
    currentUserId: string;
    ownerName?: string;
}

export default function ChatInterface({ initialMessages, leaseId, currentUserId, ownerName }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

                    setMessages((current) => {
                        // Avoid duplicates if already exists
                        if (current.some(m => m.id === newMsg.id)) return current;

                        // Check if we have an optimistic message to replace (same content, my sender_id)
                        if (newMsg.sender_id === currentUserId) {
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
    }, [leaseId, currentUserId]);

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
            sender_id: currentUserId,
            content: content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const result = await sendTenantMessage(leaseId, content);

        if (result?.error) {
            // Rollback (simple alert for MVP)
            alert("Erreur lors de l'envoi");
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }

        setIsSending(false);
    };

    // Helper to group messages
    const groupedMessages = messages.reduce((groups, msg, index) => {
        const date = new Date(msg.created_at);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(msg);
        return groups;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header Mobile */}
            <header className="fixed top-0 w-full z-10 bg-white border-b px-4 h-14 flex items-center gap-3">
                <Link href="/portal" className="p-2 -ml-2 text-slate-600">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {ownerName?.[0] || 'P'}
                    </div>
                    <div>
                        <h1 className="font-semibold text-slate-900 leading-tight">{ownerName || 'Propriétaire'}</h1>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            En ligne
                        </p>
                    </div>
                </div>
            </header>

            {/* Zone Messages */}
            <main className="flex-1 overflow-y-auto pt-16 pb-20 px-4 space-y-6">
                {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                {format(new Date(dateKey), 'd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        {/* Messages Group */}
                        <div className="space-y-1">
                            {msgs.map((msg, index) => {
                                const isMe = msg.sender_id === currentUserId;
                                const showAvatar = !isMe && (index === 0 || msgs[index - 1].sender_id !== msg.sender_id);
                                const isLastFromSender = index === msgs.length - 1 || msgs[index + 1].sender_id !== msg.sender_id;

                                return (
                                    <div key={msg.id} className={cn("flex w-full items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        {!isMe && (
                                            <div className="w-6 h-6 shrink-0">
                                                {showAvatar && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                                                        {ownerName?.[0] || 'P'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[75%] px-4 py-2 text-sm shadow-sm break-words relative group",
                                            isMe
                                                ? "bg-blue-600 text-white rounded-2xl rounded-br-none"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-none",
                                            !isLastFromSender && (isMe ? "rounded-br-2xl mb-0.5" : "rounded-bl-2xl mb-0.5")
                                        )}>
                                            <p>{msg.content}</p>
                                            <p className={cn(
                                                "text-[9px] mt-1 text-right opacity-70",
                                                isMe ? "text-blue-100" : "text-slate-400"
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
                    <div className="text-center py-10 text-slate-400 text-sm">
                        Démarrez la conversation avec votre propriétaire.
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Zone */}
            <footer className="fixed bottom-0 w-full bg-white border-t p-3 pb-safe">
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-md mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez un message..."
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 h-10 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </footer>
        </div>
    );
}
