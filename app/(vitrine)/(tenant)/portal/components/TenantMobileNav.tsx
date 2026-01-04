'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, FileText, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TenantMobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/portal',
            label: 'Accueil',
            icon: Home,
            isActive: pathname === '/portal'
        },
        {
            href: '/portal/documents',
            label: 'Documents',
            icon: FileText,
            isActive: pathname?.startsWith('/portal/documents')
        },
        {
            href: '/portal/maintenance',
            label: 'Signaler',
            icon: Wrench,
            isActive: pathname?.startsWith('/portal/maintenance')
        },
        {
            href: '/portal/messages',
            label: 'Messages',
            icon: MessageSquare,
            isActive: pathname?.startsWith('/portal/messages')
        },
        {
            href: '/compte/profil', // On peut rediriger vers le profil global ou une page spécifique
            label: 'Profil',
            icon: User,
            isActive: pathname === '/compte/profil'
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-between items-center z-50 md:hidden">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                        item.isActive
                            ? "text-orange-400"
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <item.icon className={cn("h-6 w-6", item.isActive && "fill-current")} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
