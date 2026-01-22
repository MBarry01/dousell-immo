'use client'

import { useOnboardingStore } from '@/lib/store/use-onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function StepSizing() {
    const { setPropertyCount, nextStep } = useOnboardingStore()

    const handleSelect = (count: string) => {
        setPropertyCount(count)
        nextStep()
    }

    const options = [
        { value: '1', label: '1 bien', desc: 'Juste pour commencer' },
        { value: '2-5', label: '2 à 5 biens', desc: 'Un petit patrimoine' },
        { value: '5-10', label: '5 à 10 biens', desc: 'Gestion active' },
        { value: '10+', label: 'Plus de 10', desc: 'Investisseur chevronné' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Quelle est la taille de votre parc ?
                </h1>
                <p className="text-slate-500 text-lg">
                    Cela nous aide à configurer l'interface selon vos besoins.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {options.map((option) => (
                    <Card
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-center border-slate-200 flex flex-col items-center justify-center min-h-[160px]"
                    >
                        <span className="text-2xl font-bold text-slate-900 mb-2 block">
                            {option.label}
                        </span>
                        <span className="text-slate-500 text-sm">
                            {option.desc}
                        </span>
                    </Card>
                ))}
            </div>

            <p className="text-center text-sm text-slate-400">
                Ne vous inquiétez pas, c'est juste une estimation.
            </p>
        </div>
    )
}
