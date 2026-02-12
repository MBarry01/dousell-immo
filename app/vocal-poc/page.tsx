"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Mic,
    MicOff,
    Send,
    User,
    Bot,
    Volume2,
    VolumeX,
    RotateCcw,
    Sparkles,
    X,
    ShieldAlert,
    Settings,
    SlidersHorizontal,
    ExternalLink,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { chatWithAI } from "./actions";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

export default function VocalPocPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Bonjour ! Je suis votre assistant vocal Doussel. Comment puis-je vous aider aujourd'hui ? (Testez-moi en parlant ou en écrivant).",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Vérifier le support au chargement
    useEffect(() => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSupported(true);
        }
    }, []);

    // Auto-scroll vers le bas
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Qualité supérieure : 128kbps
            const options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 };
            const mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Convertir en base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    setIsLoading(true);

                    try {
                        const { transcribeAudio } = await import("./actions");
                        const result = await transcribeAudio(base64Audio);
                        if (result.success && result.text) {
                            handleSendMessage(result.text);
                        } else {
                            setPermissionError(result.error || "La transcription a échoué.");
                        }
                    } catch (error) {
                        console.error("Transcription error:", error);
                    } finally {
                        setIsLoading(false);
                    }
                };

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setPermissionError(null);
        } catch (err) {
            console.error("Recording error:", err);
            setPermissionError("Impossible d'accéder au micro.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleListening = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const speak = async (text: string) => {
        if (!text) return;
        setIsSpeaking(true);

        try {
            const { generateSpeech } = await import("./actions");
            const result = await generateSpeech(text);

            if (result.success && result.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${result.audioContent}`);
                audio.onended = () => setIsSpeaking(false);
                audio.play();
            } else {
                console.error("TTS Error:", result.error);
                setIsSpeaking(false);
            }
        } catch (error) {
            console.error("Speech error:", error);
            setIsSpeaking(false);
        }
    };

    const requestMicrophonePermission = async () => {
        setPermissionError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            // Lancer l'enregistrement après l'autorisation
            setTimeout(() => {
                startRecording();
            }, 300);
        } catch (err: any) {
            console.error("Permission request error:", err);
            setPermissionError("L'accès reste bloqué. Veuillez cliquer sur l'icône de réglages à gauche de l'URL pour débloquer le micro.");
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setIsLoading(true);

        // Appel à la véritable IA
        try {
            const history = messages.slice(-6).map(m => ({
                role: m.sender === "user" ? "user" as const : "assistant" as const,
                content: m.text
            }));

            const response = await chatWithAI(text, history);

            if (response.success && response.content) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: response.content,
                    sender: "bot",
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, botMsg]);
                speak(response.content);
            } else {
                const errorMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "Désolé, j'ai rencontré une erreur technique. Vérifiez votre connexion ou la clé API.",
                    sender: "bot",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMsg]);
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Assistant Vocal POC</CardTitle>
                                    <CardDescription>Test d'interaction STT → LLM → TTS (Mode Isolé)</CardDescription>
                                </div>
                            </div>
                            <Badge variant={supported ? "outline" : "destructive"} className="gap-1 px-3 py-1">
                                {supported ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                                {supported ? "Micro Actif" : "Micro Non Supporté"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex flex-col h-[600px]">
                        {permissionError && (
                            <div className="bg-red-500/10 border-b border-red-500/20 p-5 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                            Action Requise : Micro Bloqué
                                        </p>
                                        <p className="text-xs text-red-500/80 mt-1 leading-relaxed">
                                            {permissionError}
                                        </p>
                                    </div>
                                    <button onClick={() => setPermissionError(null)} className="text-red-400 hover:text-red-600">
                                        <X size={18} />
                                    </button>
                                </div>

                                <Card className="bg-white/50 dark:bg-black/20 border-red-500/20 shadow-none">
                                    <CardContent className="p-3">
                                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                            <Settings size={14} /> Comment débloquer manuellement :
                                        </p>
                                        <div className="space-y-3 text-[10px] text-slate-600 dark:text-slate-400">
                                            <div className="flex items-start gap-2">
                                                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-0.5">1</span>
                                                <span>Cliquez sur l'icône **Réglages** <SlidersHorizontal className="inline w-3 h-3 mx-1" /> ou **Cadenas** 🔒 tout à gauche de l'adresse (URL).</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-0.5">2</span>
                                                <span>Cherchez **Microphone** dans la liste et mettez sur **Autorisé** (ou réinitialisez l'autorisation).</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-0.5">3</span>
                                                <span className="font-bold text-red-600 dark:text-red-400">Si le problème persiste (Violation de Politique) :</span>
                                            </div>
                                            <div className="pl-6 space-y-2 border-l-2 border-red-200 dark:border-red-900 ml-2 mt-1">
                                                <p>Ouvrez l'URL directement dans un **nouvel onglet** (évitez la vue intégrée de l'IDE ou le mode PWA restreint).</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 text-primary flex items-center gap-1 hover:bg-transparent"
                                                    onClick={() => window.open(window.location.href, '_blank')}
                                                >
                                                    Ouvrir dans un nouvel onglet <ExternalLink size={12} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-red-500 text-white hover:bg-red-600 h-9 px-4 rounded-full border-none"
                                        onClick={requestMicrophonePermission}
                                    >
                                        Tenter de forcer le popup
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 rounded-full"
                                        onClick={() => window.location.reload()}
                                    >
                                        Rafraîchir la page
                                    </Button>
                                </div>
                            </div>
                        )}
                        <ScrollArea className="flex-1 p-6">
                            <div ref={scrollRef} className="space-y-4 pb-4">
                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, scale: 0.95, x: msg.sender === "user" ? 20 : -20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.sender === "user" ? "bg-slate-200 dark:bg-slate-800 text-slate-600" : "bg-primary/20 text-primary border border-primary/20"
                                                    }`}>
                                                    {msg.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                                                </div>
                                                <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === "user"
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700"
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                    <div className="flex items-center justify-between mt-2 gap-4">
                                                        <span className="text-[10px] opacity-60">
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {msg.sender === "bot" && (
                                                            <button
                                                                onClick={() => speak(msg.text)}
                                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                            >
                                                                <Volume2 size={12} className="text-primary" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="flex gap-3 max-w-[85%]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary border border-primary/20 animate-pulse">
                                                    <Bot size={16} />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-sm text-slate-500 italic">L'IA réfléchit...</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                                        placeholder="Tapez votre message..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-6 py-4 pr-14 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleSendMessage(inputText)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleListening}
                                        disabled={!supported}
                                        className={`relative p-4 rounded-full transition-all shadow-lg ${isRecording
                                            ? "bg-red-500 text-white animate-pulse shadow-red-500/30"
                                            : "bg-slate-100 dark:bg-slate-800 text-primary hover:bg-slate-200 dark:hover:bg-slate-700"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                                        {isRecording && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                                            </span>
                                        )}
                                    </motion.button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full w-12 h-12"
                                        onClick={() => setMessages([messages[0]])}
                                    >
                                        <RotateCcw size={20} className="text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 opacity-70">
                                    <Sparkles size={10} className="text-yellow-500" />
                                    Doussel Vocal Labs v0.1 • Mode : Français / Wolof (Isolé)
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

const AlertCircle = ({ size = 16, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

const CheckCircle = ({ size = 16, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
