import { Suspense } from "react";
import TenantVerifyPageContent from "./verify-client";

export default function TenantVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-white">Chargement...</p>
      </div>
    }>
      <TenantVerifyPageContent />
    </Suspense>
  );
}
