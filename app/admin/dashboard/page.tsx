import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireAnyRole } from "@/lib/permissions";
import { ModerationBadge } from "../moderation/badge";
import { ModerationNotification } from "../moderation/notification";
import { DeleteButton } from "./delete-button";
import { getAllPropertiesForAdmin } from "./actions";

const statusColors: Record<string, string> = {
  disponible: "bg-emerald-500/20 text-emerald-300",
  "sous-offre": "bg-amber-500/20 text-amber-300",
  vendu: "bg-red-500/20 text-red-300",
};

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Ensure user is authorized admin
  await requireAnyRole(["admin", "moderateur", "agent", "superadmin"]);
  
  const properties = await getAllPropertiesForAdmin();

  return (
    <div className="space-y-6 py-6">
      <ModerationNotification />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Gestion des biens
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="relative rounded-full" asChild>
            <Link href="/admin/roles">Rôles</Link>
          </Button>
          <Button variant="secondary" className="relative rounded-full" asChild>
            <Link href="/admin/leads">Leads</Link>
          </Button>
          <Button variant="secondary" className="relative rounded-full" asChild>
            <Link href="/admin/moderation">
              Modération
              <ModerationBadge />
            </Link>
          </Button>
          <Button className="rounded-full bg-background text-foreground" asChild>
            <Link href="/admin/biens/nouveau">Ajouter un bien</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/40">
            <tr>
              <th className="px-4 py-3">Bien</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                className="border-t border-white/5 bg-transparent"
              >
                <td className="flex items-center gap-3 px-4 py-4">
                  {property.image && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {property.title}
                    </p>
                    <p className="text-xs text-white/50">
                      {property.location?.city || "Non spécifié"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {new Intl.NumberFormat("fr-SN", {
                    maximumFractionDigits: 0,
                  }).format(property.price)}{" "}
                  FCFA
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColors[property.status ?? "disponible"] ??
                        "bg-white/10 text-white/80"
                      }`}
                    >
                      {property.status ?? "disponible"}
                    </span>
                    {property.validationStatus && property.validationStatus !== "approved" && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          property.validationStatus === "pending"
                            ? "bg-amber-500/20 text-amber-300"
                            : property.validationStatus === "rejected"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {property.validationStatus}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-white/70">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/biens/${property.id}`}
                      className="hover:text-white"
                    >
                      Éditer
                    </Link>
                    <DeleteButton propertyId={property.id} />
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-white/60"
                >
                  Aucun bien pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

