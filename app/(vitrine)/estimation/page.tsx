import { EstimationWizard } from "@/components/wizard/estimation-wizard";

export const metadata = {
  title: "Estimation · Dousell Immo",
};

export default function EstimationPage() {
  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Combien vaut votre bien ?
        </p>
        <h1 className="text-3xl font-semibold">Estimation rapide</h1>
        <p className="text-white/70">
          En 5 questions, recevez une estimation personnalisée pour Dakar et sa
          proche banlieue.
        </p>
      </div>
      <EstimationWizard />
    </div>
  );
}

