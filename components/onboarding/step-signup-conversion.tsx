'use client'

import { useOnboardingStore } from '@/lib/store/use-onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // Assuming sonner is installed

export default function StepSignupConversion() {
    const { property, propertyCount, situation, reset } = useOnboardingStore()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Create User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: '', // Optional, we don't ask for it yet or maybe we should?
                        onboarding_situation: situation,
                        onboarding_property_count: propertyCount
                    }
                }
            })

            if (authError) throw authError

            if (authData.user) {
                // 2. Insert Property
                const { error: propertyError } = await supabase
                    .from('properties')
                    .insert({
                        owner_id: authData.user.id,
                        title: property.name,
                        price: property.rent,
                        category: 'location',
                        property_type: property.type,
                        status: 'disponible'
                    } as any)

                if (propertyError) {
                    console.error("Error creating property:", propertyError)
                    // We don't block the user, but we log it. 
                    // They still have an account.
                    toast.error("Compte créé, mais erreur lors de la création du bien.")
                } else {
                    toast.success("Compte et bien créés avec succès !")
                }

                // 3. Cleanup & Redirect
                reset() // Clear store
                router.push('/dashboard') // Or wherever the main app is
            }

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    C'est presque fini !
                </h1>
                <p className="text-slate-500 text-lg">
                    Votre bien <span className="font-semibold text-slate-900">"{property.name}"</span> est prêt.
                    <br />Créez votre compte sécurisé pour le gérer.
                </p>
            </div>

            <Card className="p-8 border-slate-200 shadow-lg">
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Adresse Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12"
                        />
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-14"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            "Valider et Accéder au Dashboard"
                        )}
                    </Button>

                    <p className="text-xs text-center text-slate-400 mt-4">
                        En cliquant, vous acceptez nos conditions générales d'utilisation.
                    </p>
                </form>
            </Card>
        </div>
    )
}
