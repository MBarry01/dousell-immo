"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

type CostSimulatorProps = {
  price: number;
  type: "vente" | "location";
};

export const CostSimulator = ({ price, type }: CostSimulatorProps) => {
  const [caution, setCaution] = useState(2);
  const [avance, setAvance] = useState(1);
  const [agencyFees, setAgencyFees] = useState(1);
  const [includeTom, setIncludeTom] = useState(false);

  const totalLocation = useMemo(() => {
    const base = price * (caution + avance + agencyFees);
    const tom = includeTom ? base * 0.036 : 0;
    return base + tom;
  }, [price, caution, avance, agencyFees, includeTom]);

  const totalVente = useMemo(() => {
    const notaire = price * 0.12;
    const agence = price * 0.05;
    return price + notaire + agence;
  }, [price]);

  return (
    <div className="rounded-3xl border border-amber-200/40 bg-amber-500/10 p-5 text-amber-100">
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-amber-300" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
            Transparence
          </p>
          <h3 className="text-lg font-semibold text-white">
            Simulateur de frais d&apos;entrée
          </h3>
        </div>
      </div>

      {type === "location" ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Caution (mois)",
                value: caution,
                set: setCaution,
              },
              {
                label: "Avance (mois)",
                value: avance,
                set: setAvance,
              },
              {
                label: "Frais d'agence (mois)",
                value: agencyFees,
                set: setAgencyFees,
              },
            ].map((item) => (
              <label key={item.label} className="text-sm text-white/70">
                {item.label}
                <input
                  type="number"
                  min={0}
                  value={item.value}
                  onChange={(event) =>
                    item.set(Math.max(0, Number(event.target.value)))
                  }
                  className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={includeTom}
              onChange={(event) => setIncludeTom(event.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-300/40"
            />
            Inclure l&apos;enregistrement TOM (3,6 %)
          </label>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total à prévoir
            </p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalLocation)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p>
            Frais de notaire estimés (12%) :{" "}
            <span className="font-semibold">{formatCurrency(price * 0.12)}</span>
          </p>
          <p>
            Frais d&apos;agence (5%) :{" "}
            <span className="font-semibold">{formatCurrency(price * 0.05)}</span>
          </p>
          <div className="pt-3 text-center text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Budget total estimé
            </p>
            <p className="text-3xl font-bold">{formatCurrency(totalVente)}</p>
          </div>
        </div>
      )}
    </div>
  );
};


