import { Suspense } from "react";
import { WelcomeModalContent } from "./welcome-modal-client";

/**
 * Modal de bienvenue - Server component wrapper
 * Wraps the client component in Suspense to handle useSearchParams
 */
export function WelcomeModal() {
  return (
    <Suspense fallback={null}>
      <WelcomeModalContent />
    </Suspense>
  );
}
