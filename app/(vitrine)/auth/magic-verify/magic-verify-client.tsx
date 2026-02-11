'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MagicVerifyContent() {
    const router = useRouter();
    const supabase = createClient();
    const [message, setMessage] = useState('Vérification de votre lien...');

    useEffect(() => {
        // 1. Tenter une détection manuelle du hash (Fallback critique)
        const handleHashSession = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                try {
                    // Parser le hash comme des query params (en enlevant le #)
                    const params = new URLSearchParams(hash.substring(1));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (error) throw error;

                        setMessage('Session établie ! Redirection...');
                        router.push('/portal');
                        router.refresh();
                        return;
                    }
                } catch (err) {
                    console.error("Erreur extraction hash:", err);
                    setMessage("Erreur lors de la lecture du lien.");
                }
            }
        };

        handleHashSession();

        // 2. Écouteur standard Supabase (au cas où il se déclenche tout seul)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setMessage('Connexion réussie ! Redirection...');
                router.push('/portal');
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-sm w-full text-center shadow-xl">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div>
                        <Loader2 className="w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                </div>
                <h1 className="text-xl font-semibold text-white mb-2">Authentification</h1>
                <p className="text-slate-400 text-sm">{message}</p>
            </div>
        </div>
    );
}
