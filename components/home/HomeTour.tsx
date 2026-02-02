'use client';

interface HomeTourProps {
    hasProperties?: boolean;
}

// OnboardingTour component was removed - this component is now a no-op
export function HomeTour({ hasProperties = false }: HomeTourProps) {
    return null;
}
