import Link from "next/link";
import { Shield, UserPlus, Mail, Phone, Calendar, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { requireAdmin } from "@/lib/admin-auth";
import { getUsersWithRoles, type UserRole } from "../roles/actions";
import { Button } from "@/components/ui/button";
import { RoleManager } from "../roles/role-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getUsersWithRoles();

  // Statistiques
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    moderateurs: users.filter((u) => u.roles.includes("moderateur")).length,
    agents: users.filter((u) => u.roles.includes("agent")).length,
    sansRole: users.filter((u) => u.roles.length === 0).length,
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestion des Utilisateurs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez les utilisateurs et leurs rôles
          </p>
        </div>
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href="/admin">Retour au dashboard</Link>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Modérateurs
            </CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.moderateurs}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.agents}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sans rôle
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.sansRole}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des utilisateurs */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Liste des utilisateurs</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Rôles</th>
                    <th className="px-4 py-3">Inscription</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || "Utilisateur"}
                            </p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground/70" />
                          <span className="text-foreground/80 truncate max-w-[250px]">
                            {user.email || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground/70" />
                            <span className="text-foreground/80">{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                className={roleColors[role]}
                              >
                                {roleLabels[role]}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun rôle</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground/70" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleManager userId={user.id} currentRoles={user.roles} />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
        </CardContent>
      </Card>
    </div>
  );
}

