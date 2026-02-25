

import { Suspense } from "react";
import LandingPageContent from "./pro-client";

// ISR: Régénère la page toutes les heures (3600 secondes)
export const revalidate = 3600;

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black" />
    }>
      <LandingPageContent />
    </Suspense>
  );
}
