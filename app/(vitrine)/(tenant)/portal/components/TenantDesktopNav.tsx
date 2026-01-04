'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Wrench, FileText, MessageSquare, User } from 'lucide-react';

export function TenantDesktopNav() {
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
        // {
        //     href: '/portal/messages',
        //     label: 'Messages',
        //     icon: MessageSquare,
        //     isActive: pathname?.startsWith('/portal/messages')
        // },
        {
            href: '/compte/profil',
            label: 'Profil',
            icon: User,
            isActive: pathname === '/compte/profil'
        }
    ];

    return (
        <nav className="hidden md:flex items-center gap-1 mx-6">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        item.isActive
                            ? "text-white bg-slate-800"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                >
                    <item.icon className={cn("h-4 w-4", item.isActive ? "text-orange-400" : "text-slate-500")} />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
