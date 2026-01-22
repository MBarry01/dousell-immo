'use client'

import Link from 'next/link'
import { useOnboardingStore } from '@/lib/store/use-onboarding-store'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { step, prevStep } = useOnboardingStore()

    // Calculate progress percentage based on 4 steps
    const progress = (step / 4) * 100

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Minimaliste */}
            <header className="h-16 border-b bg-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {step > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevStep}
                            className="text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">
                        Doussel Immo
                    </Link>
                </div>

                <div className="text-sm font-medium text-slate-500">
                    Étape {step} sur 4
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-100 w-full">
                <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-2xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
