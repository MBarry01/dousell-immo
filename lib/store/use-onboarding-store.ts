import { create } from 'zustand'

export type UserSituation = 'beginner' | 'overwhelmed' | 'investor'
export type PropertyType = 'appartement' | 'villa' | 'magasin' | 'immeuble'

interface OnboardingState {
    // Navigation
    step: number
    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void

    // Step 1: Qualification
    situation: UserSituation | null
    setSituation: (situation: UserSituation) => void

    // Step 2: Sizing
    propertyCount: string
    setPropertyCount: (count: string) => void

    // Step 3: First Property Hook
    property: {
        name: string
        type: PropertyType
        rent: number
    }
    setProperty: (property: { name: string; type: PropertyType; rent: number }) => void

    // Reset
    reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    // Navigation
    step: 1,
    setStep: (step) => set({ step }),
    nextStep: () => set((state) => ({ step: state.step + 1 })),
    prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

    // Data
    situation: null,
    setSituation: (situation) => set({ situation }),

    propertyCount: '1',
    setPropertyCount: (propertyCount) => set({ propertyCount }),

    property: {
        name: '',
        type: 'appartement',
        rent: 0,
    },
    setProperty: (property) => set({ property }),

    reset: () => set({
        step: 1,
        situation: null,
        propertyCount: '1',
        property: { name: '', type: 'appartement', rent: 0 },
    }),
}))
