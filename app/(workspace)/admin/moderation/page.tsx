import { Suspense } from "react";
import ModerationPageContent from "./moderation-client";

export default function ModerationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    }>
      <ModerationPageContent />
    </Suspense>
  );
}
