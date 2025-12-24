import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { requireAnyRole } from "@/lib/permissions";
import { getLeads, updateLeadStatus, type Lead, type LeadStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { LeadStatusSelect } from "./lead-status-select";
import { LeadMessageDialog } from "./lead-message-dialog";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const statusLabels: Record<LeadStatus, string> = {
  nouveau: "Nouveau",
  contacté: "Contacté",
  clos: "Clos",
};

const statusColors: Record<LeadStatus, string> = {
  nouveau: "bg-red-500/20 text-red-300 border-red-500/30",
  contacté: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  clos: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const availabilityLabels: Record<string, string> = {
  "semaine-matin": "Semaine (Matin)",
  "semaine-apres-midi": "Semaine (Après-midi)",
  weekend: "Week-end",
};

function formatPhoneNumber(phone: string): string {
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, "");
  // Si commence par 221, retirer
  const withoutCountry = cleaned.startsWith("221") ? cleaned.slice(3) : cleaned;
  // Formater comme 77 000 00 00
  if (withoutCountry.length === 9) {
    return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5, 7)} ${withoutCountry.slice(7)}`;
  }
  return phone;
}

function getWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("221") ? cleaned : `221${cleaned}`;
  return `https://wa.me/${number}`;
}

function isNewLead(createdAt: string): boolean {
  const now = new Date();
  const created = new Date(createdAt);
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

export default async function AdminLeadsPage() {
  await requireAnyRole(["admin", "moderateur", "agent", "superadmin"]);
  const leads = await getLeads();

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Gestion des Leads
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {leads.length} demande{leads.length > 1 ? "s" : ""} de contact
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="rounded-full" asChild>
            <Link href="/admin/dashboard">Retour</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/40">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isNew = isNewLead(lead.created_at);
                return (
                  <tr
                    key={lead.id}
                    className="border-t border-white/5 bg-transparent transition hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-white/60">
                          {formatDistanceToNow(new Date(lead.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(lead.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {lead.full_name}
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-white/80 hover:text-white transition"
                      >
                        {formatPhoneNumber(lead.phone)}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white/60 capitalize">
                          {lead.project_type}
                        </span>
                        {lead.availability && (
                          <span className="text-xs text-white/40">
                            {availabilityLabels[lead.availability] || lead.availability}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[140px] max-w-[140px]">
                      <LeadMessageDialog
                        fullName={lead.full_name}
                        message={lead.message}
                        projectType={lead.project_type}
                        availability={availabilityLabels[lead.availability] || lead.availability}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <LeadStatusSelect
                        leadId={lead.id}
                        currentStatus={lead.status}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                          asChild
                        >
                          <a
                            href={getWhatsAppUrl(lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-white/60"
                  >
                    Aucune demande de contact pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

