'use client'

import { useOnboardingStore, UserSituation } from '@/lib/store/use-onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Archive, Rocket } from 'lucide-react'

export default function StepQualification() {
    const { setSituation, nextStep } = useOnboardingStore()

    const handleSelect = (situation: UserSituation) => {
        setSituation(situation)
        nextStep()
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Bienvenue sur Doussel Immo 👋
                </h1>
                <p className="text-slate-500 text-lg">
                    Pour commencer, dites-nous ce qui décrit le mieux votre situation.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-8">
                <SituationCard
                    icon={<Sparkles className="w-8 h-8 text-blue-500" />}
                    title="Je démarre"
                    description="Je viens d'acquérir ou d'hériter de mon premier bien. Je veux faire les choses bien dès le début."
                    onClick={() => handleSelect('beginner')}
                />

                <SituationCard
                    icon={<Archive className="w-8 h-8 text-orange-500" />}
                    title="Je suis débordé"
                    description="J'ai plusieurs biens et je gère tout sur papier ou Excel. Je perds du temps et de l'argent."
                    onClick={() => handleSelect('overwhelmed')}
                />

                <SituationCard
                    icon={<Rocket className="w-8 h-8 text-purple-500" />}
                    title="Investisseur pro"
                    description="Je veux optimiser mes rendements, automatiser la gestion et scaler mon parc immobilier."
                    onClick={() => handleSelect('investor')}
                />
            </div>
        </div>
    )
}

function SituationCard({
    icon,
    title,
    description,
    onClick
}: {
    icon: React.ReactNode
    title: string
    description: string
    onClick: () => void
}) {
    return (
        <Card
            onClick={onClick}
            className="p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group border-slate-200"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                    {icon}
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Card>
    )
}
