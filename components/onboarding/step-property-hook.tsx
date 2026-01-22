'use client'

import { useOnboardingStore, PropertyType } from '@/lib/store/use-onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { Home, ArrowRight } from 'lucide-react'

export default function StepPropertyHook() {
    const { property, setProperty, nextStep } = useOnboardingStore()
    const [formData, setFormData] = useState({
        name: property.name,
        type: property.type,
        rent: property.rent || ''
    })

    // Basic validation state
    const [errors, setErrors] = useState<{ name?: string, rent?: string }>({})

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: typeof errors = {}

        if (!formData.name.trim()) newErrors.name = "Le nom est requis"
        if (!formData.rent || Number(formData.rent) <= 0) newErrors.rent = "Le loyer doit être valide"

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setProperty({
            name: formData.name,
            type: formData.type,
            rent: Number(formData.rent)
        })
        nextStep()
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Paramétrons votre premier bien 🏠
                </h1>
                <p className="text-slate-500 text-lg">
                    Cela prend 30 secondes et vous permettra de voir la magie opérer.
                </p>
            </div>

            <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-100 rounded-tr-full -ml-12 -mb-12 opacity-50 pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <Label htmlFor="type">Type de bien</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val: PropertyType) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger className="h-12 bg-white/50">
                                <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="appartement">Appartement</SelectItem>
                                <SelectItem value="villa">Villa / Maison</SelectItem>
                                <SelectItem value="magasin">Magasin / Bureau</SelectItem>
                                <SelectItem value="immeuble">Immeuble entier</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du bien</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Villa Sacré Coeur, Appartement A4..."
                            className={`h-12 bg-white/50 ${errors.name ? 'border-red-500' : ''}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rent">Loyer Mensuel (FCFA)</Label>
                        <Input
                            id="rent"
                            type="number"
                            placeholder="Ex: 250000"
                            className={`h-12 bg-white/50 ${errors.rent ? 'border-red-500' : ''}`}
                            value={formData.rent}
                            onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                        />
                        {errors.rent && <p className="text-red-500 text-sm">{errors.rent}</p>}
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-14 mt-4">
                        Continuer <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </Card>
        </div>
    )
}
