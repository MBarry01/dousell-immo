'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, FileText, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TenantMobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/locataire',
            label: 'Accueil',
            icon: Home,
            isActive: pathname === '/locataire'
        },
        {
            href: '/locataire/documents',
            label: 'Documents',
            icon: FileText,
            isActive: pathname?.startsWith('/locataire/documents')
        },
        {
            href: '/locataire/maintenance',
            label: 'Signaler',
            icon: Wrench,
            isActive: pathname?.startsWith('/locataire/maintenance')
        },
        {
            href: '/locataire/messages',
            label: 'Messages',
            icon: MessageSquare,
            isActive: pathname?.startsWith('/locataire/messages')
        },
        {
            href: '/compte',
            label: 'Profil',
            icon: User,
            isActive: pathname === '/compte'
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 safe-area-pb">
            <div className="mx-auto max-w-sm bg-[#0F172A]/95 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl flex justify-between items-center px-6 py-3 ring-1 ring-black/5">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1.5 transition-all active-press",
                            item.isActive
                                ? "text-white"
                                : "text-zinc-500 hover:text-zinc-400"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            item.isActive && "bg-white/10 text-white"
                        )}>
                            <item.icon className={cn("h-5 w-5", item.isActive && "fill-current")} />
                        </div>
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest",
                            item.isActive ? "text-white" : "text-zinc-500"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
