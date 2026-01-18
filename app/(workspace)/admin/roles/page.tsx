import Link from "next/link";
import { Shield } from "lucide-react";
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
  admin: "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30",
  moderateur: "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30",
  agent: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30",
  superadmin: "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30",
};

export default async function AdminRolesPage() {
  await requireAdmin();
  const users = await getUsersWithRoles();

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Gestion des Rôles
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="rounded-full" asChild>
            <Link href="/admin/dashboard">Retour</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-muted text-xs uppercase tracking-[0.3em] text-muted-foreground">
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
                  className="border-t border-border bg-transparent transition hover:bg-muted/50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {user.full_name || "Utilisateur"}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-foreground/80">{user.email}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${roleColors[role]
                              }`}
                          >
                            {roleLabels[role]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun rôle</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-muted-foreground">
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
                    className="px-4 py-8 text-center text-muted-foreground"
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


