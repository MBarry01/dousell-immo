'use client'

import { useOnboardingStore } from '@/lib/store/use-onboarding-store'
import StepQualification from '@/components/onboarding/step-qualification'
import StepSizing from '@/components/onboarding/step-sizing'
import StepPropertyHook from '@/components/onboarding/step-property-hook'
import StepSignupConversion from '@/components/onboarding/step-signup-conversion'
import { AnimatePresence, motion } from 'framer-motion'

export default function OnboardingPage() {
    const { step } = useOnboardingStore()

    const renderStep = () => {
        switch (step) {
            case 1:
                return <StepQualification />
            case 2:
                return <StepSizing />
            case 3:
                return <StepPropertyHook />
            case 4:
                return <StepSignupConversion />
            default:
                return <StepQualification />
        }
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
    )
}
