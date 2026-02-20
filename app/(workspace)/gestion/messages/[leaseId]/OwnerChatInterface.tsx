'use client';
import { createClient } from '@/utils/supabase/client';

import { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { sendOwnerMessage, markConversationAsRead } from '../actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from "@/components/theme-provider";

interface Message {
    id: string;
    sender_id: string;
    sender_type?: string;
    content: string;
    created_at: string;
}

interface ChatProps {
    initialMessages: Message[];
    leaseId: string;
    currentUserId: string;
    tenantName?: string;
}

export default function OwnerChatInterface({ initialMessages, leaseId, currentUserId, tenantName }: ChatProps) {
    const { isDark } = useTheme();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Mark tenant messages as read when opening conversation
    useEffect(() => {
        markConversationAsRead(leaseId);
    }, [leaseId]);

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

                    // Mark as read immediately if it's from tenant (owner has chat open)
                    if (newMsg.sender_type === 'tenant') {
                        markConversationAsRead(leaseId);
                    }

                    setMessages((current) => {
                        // Avoid duplicates
                        if (current.some(m => m.id === newMsg.id)) return current;

                        // Check if we have an optimistic message to replace
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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const content = newMessage.trim();
        setIsSending(true);
        setNewMessage('');

        // Optimistic
        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            sender_id: currentUserId,
            content: content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const result = await sendOwnerMessage(leaseId, content);

        if (result?.error) {
            alert("Erreur lors de l'envoi");
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }

        setIsSending(false);
    };

    // Helper to group messages
    const groupedMessages = messages.reduce((groups, msg, _index) => {
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
            "flex flex-col w-full h-[calc(100svh-13rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-8.5rem)]",
            "overflow-hidden px-4 md:px-6", // Marges de côté rétablies
            "border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm rounded-xl"
        )}>
            {/* Header Chat - Fixe */}
            <div className={cn(
                "border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0 z-10 rounded-t-xl",
                isDark ? 'bg-card border-border' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center gap-3">
                    <Link href="/gestion/messages" className={cn(
                        "p-2 -ml-2 rounded-full transition-colors",
                        isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"
                    )}>
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => (window.location.href = `/gestion/locations/${leaseId}`)}>
                        <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-bold border",
                            isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-gray-100 text-gray-600 border-gray-200"
                        )}>
                            {tenantName?.[0] || 'L'}
                        </div>
                        <div>
                            <h2 className={cn("font-semibold leading-tight text-sm", isDark ? "text-white" : "text-gray-900")}>{tenantName || 'Locataire'}</h2>
                            <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-gray-500")}>Détails du bail</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone Messages - Scrollable avec comportement natif */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex justify-center sticky top-0 z-10 py-2">
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-1 rounded-full border shadow-sm backdrop-blur-sm",
                                isDark ? "text-slate-500 bg-slate-900/80 border-slate-800" : "text-gray-500 bg-white/80 border-gray-200"
                            )}>
                                {format(new Date(dateKey), 'd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        <div className="space-y-1">
                            {msgs.map((msg, index) => {
                                const isFromMe = (m: Message) => m.sender_id === currentUserId && m.sender_type !== 'tenant';
                                const isMe = isFromMe(msg);
                                const showAvatar = !isMe && (index === 0 || isFromMe(msgs[index - 1]));
                                const isLastFromSender = index === msgs.length - 1 || isFromMe(msgs[index + 1]) !== isMe;

                                return (
                                    <div key={msg.id} className={cn("flex w-full items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        {!isMe && (
                                            <div className="w-6 h-6 shrink-0">
                                                {showAvatar && (
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {tenantName?.[0] || 'L'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[85%] sm:max-w-[75%] min-w-0 px-4 py-2 text-sm shadow-sm relative overflow-hidden",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none"
                                                : isDark
                                                    ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-bl-none"
                                                    : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-none",
                                            !isLastFromSender && (isMe ? "rounded-br-2xl mb-0.5" : "rounded-bl-2xl mb-0.5")
                                        )}>
                                            <p className="whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                                            <p className={cn(
                                                "text-[9px] mt-1 text-right opacity-70",
                                                isMe ? "text-primary-foreground/70" : "text-slate-400"
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
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-200'
                            }`}>
                            <Send className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                        </div>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Démarrez la conversation avec votre locataire.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixe en bas du container */}
            <div className={cn(
                "border-t px-6 py-4 shrink-0 z-20 rounded-b-xl",
                isDark ? "bg-card border-border" : "bg-white border-gray-200"
            )}>
                <form onSubmit={handleSend} className="flex items-center gap-2 w-full mx-auto max-w-4xl">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className={cn(
                            "flex-1 rounded-full px-4 h-11 focus:ring-2 focus:ring-primary outline-none transition-all border text-base",
                            isDark
                                ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400'
                        )}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:shadow-none shrink-0 ${isDark ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
