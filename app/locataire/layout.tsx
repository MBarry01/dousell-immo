"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Wrench,
  FileText,
  MessageSquare,
  LogOut,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Tenant Portal Layout
 *
 * Provides navigation and UI for tenants accessing via Magic Link.
 * Note: Tenants do NOT have auth.users accounts.
 *
 * For /verify and /expired pages, only render children (no navigation).
 * These pages work without a valid session.
 *
 * Navigation items:
 * - Accueil: Dashboard with payment info
 * - Documents: Quittances, contrats
 * - Signaler: Maintenance requests
 * - Messages: Communication with owner
 *
 * NO /compte link (tenants don't have user accounts)
 */
export default function LocataireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState<string>("");
  const [propertyAddress, setPropertyAddress] = useState<string>("");

  // Pages that don't need the full navigation
  const isMinimalPage =
    pathname?.includes("/verify") || pathname?.includes("/expired");

  // Fetch tenant info from cookie-based session (only for protected pages)
  useEffect(() => {
    if (isMinimalPage) return;

    async function fetchTenantInfo() {
      try {
        const res = await fetch("/api/tenant/session", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setTenantName(data.tenant_name || "Locataire");
          setPropertyAddress(data.property_address || "");
        }
      } catch (error) {
        console.error("Error fetching tenant info:", error);
      }
    }
    fetchTenantInfo();
  }, [isMinimalPage]);

  // For verify/expired pages, render without navigation
  if (isMinimalPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/locataire",
      label: "Accueil",
      icon: Home,
      isActive: pathname === "/locataire",
    },
    {
      href: "/locataire/documents",
      label: "Documents",
      icon: FileText,
      isActive: pathname?.startsWith("/locataire/documents"),
    },
    {
      href: "/locataire/maintenance",
      label: "Signaler",
      icon: Wrench,
      isActive: pathname?.startsWith("/locataire/maintenance"),
    },
    {
      href: "/locataire/messages",
      label: "Messages",
      icon: MessageSquare,
      isActive: pathname?.startsWith("/locataire/messages"),
    },
  ];

  const handleLogout = async () => {
    // Clear tenant session cookie
    document.cookie =
      "tenant_session=; path=/locataire; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/locataire" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#F4C430]" />
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-white">Mon Espace</span>
              {propertyAddress && (
                <p className="text-xs text-white/50 truncate max-w-[200px]">
                  {propertyAddress}
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.isActive
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    item.isActive ? "text-[#F4C430]" : "text-white/40"
                  )}
                />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <span className="hidden sm:inline mr-2">
                  {tenantName || "Locataire"}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#F4C430]/20 flex items-center justify-center">
                  <span className="text-[#F4C430] text-sm font-semibold">
                    {tenantName?.charAt(0)?.toUpperCase() || "L"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-zinc-900 border-white/10"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-white">{tenantName}</p>
                <p className="text-xs text-white/50">Espace Locataire</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-white/10 px-2 py-2 flex justify-around items-center z-50 md:hidden safe-area-pb">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
              item.isActive
                ? "text-[#F4C430]"
                : "text-white/40 active:text-white"
            )}
          >
            <item.icon
              className={cn("h-6 w-6", item.isActive && "fill-current")}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
