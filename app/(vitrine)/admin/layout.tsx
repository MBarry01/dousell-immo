import { requireAnyRole } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Permettre l'accès à tous les utilisateurs avec un rôle (admin, moderateur, agent, superadmin)
  await requireAnyRole();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <AdminTopbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}


