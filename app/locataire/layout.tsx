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

  // Note: We no longer block /locataire in PWA standalone mode.
  // The tenant session uses its own `tenant_session` cookie which is
  // independent from the Supabase auth cookie. The tenant flow
  // (token validation → name verification → cookie creation) works
  // identically in both browser and PWA contexts.

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
    // Clear tenant session cookie (must use same path as when cookie was created: "/")
    document.cookie =
      "tenant_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col light">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/locataire" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-slate-900">Mon Espace</span>
              {propertyAddress && (
                <p className="text-xs text-slate-500 truncate max-w-[200px]">
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
                    ? "text-slate-900 bg-slate-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    item.isActive ? "text-slate-900" : "text-slate-400"
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
                className="!bg-transparent hover:!bg-slate-100 data-[state=open]:!bg-slate-100 !text-slate-700 hover:!text-slate-900 data-[state=open]:!text-slate-900 hover:scale-[1.02] transition-all duration-200 border-none shadow-none"
              >
                <span className="hidden sm:inline mr-2 !text-slate-700">
                  {tenantName || "Locataire"}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {tenantName?.charAt(0)?.toUpperCase() || "L"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border-slate-200"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-slate-900">{tenantName}</p>
                <p className="text-xs text-slate-500">Espace Locataire</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-200" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2 flex justify-around items-center z-50 md:hidden safe-area-pb">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
              item.isActive
                ? "text-slate-900"
                : "text-slate-400 active:text-slate-900"
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
