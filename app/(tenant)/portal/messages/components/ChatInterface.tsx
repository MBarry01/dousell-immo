'use client';

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
                        <p className="text-xs text-slate-500">En ligne</p>
                    </div>
                </div>
            </header>

            {/* Zone Messages */}
            <main className="flex-1 overflow-y-auto pt-16 pb-20 px-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        Démarrez la conversation avec votre propriétaire.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                    isMe
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                                )}>
                                    <p>{msg.content}</p>
                                    <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-blue-100" : "text-slate-400")}>
                                        {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
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
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 h-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </footer>
        </div>
    );
}
