import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AcceptInvitationClient } from "./AcceptInvitationClient";

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<LoadingState />}>
        <AcceptInvitationClient />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-md w-full">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Chargement...
        </h1>
        <p className="text-slate-400">
          Veuillez patienter.
        </p>
      </div>
    </div>
  );
}
