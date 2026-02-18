'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Upload, FileCheck, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { submitActivationRequest, getActivationStatus } from './actions';
import { createClient } from '@/utils/supabase/client';
import { useEffect } from 'react';

export default function ActiverGestionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'inactive' | 'pending' | 'approved' | 'rejected'>('inactive');
    const [identityDoc, setIdentityDoc] = useState<File | null>(null);
    const [propertyDoc, setPropertyDoc] = useState<File | null>(null);
    const identityRef = useRef<HTMLInputElement>(null);
    const propertyRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function checkStatus() {
            const result = await getActivationStatus();
            setStatus(result.status as any);
        }
        checkStatus();
    }, []);

    const uploadFile = async (file: File, path: string) => {
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from('gestion-locative-docs')
            .upload(path, file, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('gestion-locative-docs')
            .getPublicUrl(path);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identityDoc || !propertyDoc) {
            toast.error('Veuillez fournir tous les documents requis');
            return;
        }

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Upload documents
            const identityUrl = await uploadFile(
                identityDoc,
                `${user.id}/identity_${Date.now()}.${identityDoc.name.split('.').pop()}`
            );
            const propertyUrl = await uploadFile(
                propertyDoc,
                `${user.id}/property_${Date.now()}.${propertyDoc.name.split('.').pop()}`
            );

            // Submit request
            const result = await submitActivationRequest({
                identityDocumentUrl: identityUrl,
                propertyProofUrl: propertyUrl,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Demande soumise ! Nous examinerons vos documents sous 24-48h.');
            setStatus('pending');
        } catch (error) {
            console.error(error);
            toast.error('Une erreur est survenue lors de l\'envoi');
        } finally {
            setIsLoading(false);
        }
    };

    // Status display components
    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-slate-950 py-8 px-4">
                <div className="max-w-lg mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
                    >
                        <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white mb-2">Demande en cours d&apos;examen</h1>
                        <p className="text-zinc-400 mb-6">
                            Votre demande d&apos;activation est en cours de vérification par notre équipe.
                            Vous recevrez une notification dès qu&apos;elle sera traitée.
                        </p>
                        <Button variant="outline" onClick={() => router.push('/compte')}>
                            Retour au compte
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (status === 'approved') {
        return (
            <div className="min-h-screen bg-slate-950 py-8 px-4">
                <div className="max-w-lg mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8"
                    >
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white mb-2">Gestion Locative Activée !</h1>
                        <p className="text-zinc-400 mb-6">
                            Votre compte est maintenant activé pour la gestion locative.
                        </p>
                        <Button onClick={() => router.push('/gestion-locative')}>
                            Accéder à la Gestion Locative
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-8 px-4">
            <div className="max-w-lg mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Activer la Gestion Locative
                        </h1>
                        <p className="text-zinc-400">
                            Pour activer cette fonctionnalité, veuillez fournir les documents suivants.
                        </p>
                    </div>

                    {/* Form */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Documents requis</CardTitle>
                            <CardDescription>
                                Ces documents seront vérifiés par notre équipe sous 24-48h.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Pièce d'identité */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">
                                        Pièce d&apos;identité *
                                    </Label>
                                    <input
                                        type="file"
                                        ref={identityRef}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => setIdentityDoc(e.target.files?.[0] || null)}
                                    />
                                    <div
                                        onClick={() => identityRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${identityDoc
                                                ? 'border-green-500/50 bg-green-500/10'
                                                : 'border-zinc-700 hover:border-zinc-600'
                                            }`}
                                    >
                                        {identityDoc ? (
                                            <div className="flex items-center justify-center gap-2 text-green-400">
                                                <FileCheck className="w-5 h-5" />
                                                <span>{identityDoc.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-zinc-500">
                                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                                <p>CNI, Passeport ou Permis de conduire</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Justificatif propriété */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">
                                        Justificatif de propriété *
                                    </Label>
                                    <input
                                        type="file"
                                        ref={propertyRef}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => setPropertyDoc(e.target.files?.[0] || null)}
                                    />
                                    <div
                                        onClick={() => propertyRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${propertyDoc
                                                ? 'border-green-500/50 bg-green-500/10'
                                                : 'border-zinc-700 hover:border-zinc-600'
                                            }`}
                                    >
                                        {propertyDoc ? (
                                            <div className="flex items-center justify-center gap-2 text-green-400">
                                                <FileCheck className="w-5 h-5" />
                                                <span>{propertyDoc.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-zinc-500">
                                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                                <p>Titre foncier, Acte de vente, Bail ou Attestation</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-zinc-800/50 rounded-lg p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-zinc-400">
                                        Vos documents sont traités de manière confidentielle et ne seront utilisés
                                        que pour vérifier votre identité et votre qualité de propriétaire.
                                    </p>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !identityDoc || !propertyDoc}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Upload className="w-4 h-4 mr-2" />
                                    )}
                                    Soumettre ma demande
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
