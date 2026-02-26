import { Suspense } from "react";
import dynamic from "next/dynamic";

const WelcomeModalContent = dynamic(
  () => import("./welcome-modal-client").then((mod) => mod.WelcomeModalContent),
  { ssr: false }
);

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
