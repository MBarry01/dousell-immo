import { Suspense } from "react";
import TenantExpiredPageContent from "./expired-client";

export default function TenantExpiredPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-white">Chargement...</p>
      </div>
    }>
      <TenantExpiredPageContent />
    </Suspense>
  );
}
