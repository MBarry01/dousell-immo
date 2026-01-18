'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck } from "lucide-react";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import KKiaPayWidget from '@/components/payment/KKiaPayWidget';

interface RentPaymentModalProps {
  leaseId: string;
  defaultAmount: number;
  month?: string;
  propertyAddress?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName?: string;
  tenantEmail?: string;
}

export function RentPaymentModal({
  leaseId,
  defaultAmount,
  month,
  propertyAddress,
  open,
  onOpenChange,
  tenantName = "Locataire",
  tenantEmail = "",
}: RentPaymentModalProps) {
  const amount = defaultAmount;
  const formatAmount = (amt: number) => amt.toLocaleString('fr-FR');

  // Extraire mois et année de la chaîne "janvier 2026"
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (month) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      setPeriodMonth(currentMonth);
      setPeriodYear(currentYear);
    }
  }, [month]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#000000] border-[#F4C430]/20 text-white shadow-2xl">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto bg-gradient-to-br from-[#F4C430] to-[#d4a520] p-3 rounded-full mb-2"
          >
            <ShieldCheck className="w-8 h-8 text-black" />
          </motion.div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-[#F4C430] to-[#d4a520] bg-clip-text text-transparent">
            Règlement de Loyer
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-sm">
            Paiement mobile sécurisé (Wave / Orange Money)
          </DialogDescription>
        </DialogHeader>

        {/* RÉCAPITULATIF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] p-5 rounded-2xl border border-[#F4C430]/10 space-y-3 my-4 shadow-lg"
        >
          {propertyAddress && (
            <div className="flex justify-between text-sm items-start">
              <span className="text-slate-400">Bien concerné</span>
              <span className="font-medium text-white text-right max-w-[60%]">{propertyAddress}</span>
            </div>
          )}
          {month && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Période</span>
              <span className="font-medium text-white">{month}</span>
            </div>
          )}
          <div className="h-px bg-gradient-to-r from-transparent via-[#F4C430]/20 to-transparent my-2" />
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-lg">Total à payer</span>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-[#F4C430] to-[#d4a520] bg-clip-text text-transparent">
                {formatAmount(amount)}
              </div>
              <div className="text-xs text-slate-500">FCFA</div>
            </div>
          </div>
        </motion.div>

        {/* Paiement via KKiaPay Widget */}
        <div className="mt-4">
          <KKiaPayWidget
            amount={amount}
            leaseId={leaseId}
            tenantName={tenantName}
            tenantEmail={tenantEmail}
            periodMonth={periodMonth}
            periodYear={periodYear}
            onSuccess={() => {
              toast.success("Paiement validé avec succès !");
              onOpenChange(false);
            }}
            onError={(error) => {
              toast.error(`Erreur: ${error}`);
            }}
          />
        </div>

        <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed px-4">
          Paiement sécurisé via KKiaPay - Wave & Orange Money acceptés
        </p>

      </DialogContent>
    </Dialog>
  );
}
