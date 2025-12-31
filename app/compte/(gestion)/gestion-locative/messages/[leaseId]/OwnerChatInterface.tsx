'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { sendOwnerMessage } from '../actions'; // Important: Import from updated actions
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
    tenantName?: string;
}

export default function OwnerChatInterface({ initialMessages, leaseId, currentUserId, tenantName }: ChatProps) {
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

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
            {/* Header déjà présent dans le layout owner généralement, mais on peut ajouter un sub-header */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
                <Link href="/compte/gestion-locative/messages" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="font-semibold text-slate-900">{tenantName || 'Locataire'}</h2>
                </div>
            </div>

            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
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
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t p-4">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 h-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
