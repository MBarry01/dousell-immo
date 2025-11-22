import Link from "next/link";
import { Shield, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { requireAdmin } from "@/lib/admin-auth";
import { getUsersWithRoles, type UserRole } from "./actions";
import { Button } from "@/components/ui/button";
import { RoleManager } from "./role-manager";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  moderateur: "Modérateur",
  agent: "Agent",
  superadmin: "Super Admin",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500/20 text-red-300 border-red-500/30",
  moderateur: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  agent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  superadmin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default async function AdminRolesPage() {
  await requireAdmin();
  const users = await getUsersWithRoles();

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Gestion des Rôles
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
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
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôles</th>
                <th className="px-4 py-3">Inscription</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/5 bg-transparent transition hover:bg-white/5"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <Shield className="h-5 w-5 text-white/60" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {user.full_name || "Utilisateur"}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-white/50">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white/80">{user.email}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              roleColors[role]
                            }`}
                          >
                            {roleLabels[role]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/40">Aucun rôle</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-white/60">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <RoleManager userId={user.id} currentRoles={user.roles} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-white/60"
                  >
                    Aucun utilisateur enregistré.
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


