"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Loader2, User, Home, Building, FileText, Wrench, MessageSquare, Wallet, Scale, FolderOpen, Users, Settings, LayoutDashboard } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Suggestion {
    id: string;
    label: string;
    subLabel?: string;
    type: "tenant" | "property" | "nav";
    url: string;
    icon?: any;
}

const GESTION_NAV_ITEMS = [
    { label: "Dashboard", url: "/gestion", icon: LayoutDashboard },
    { label: "Biens", url: "/gestion/biens", icon: Home },
    { label: "États des Lieux", url: "/gestion/etats-lieux", icon: FileText },
    { label: "Interventions", url: "/gestion/interventions", icon: Wrench },
    { label: "Documents", url: "/gestion/documents", icon: FolderOpen },
    { label: "Messagerie", url: "/gestion/messages", icon: MessageSquare },
    { label: "Juridique", url: "/gestion/documents-legaux", icon: Scale },
    { label: "Comptabilité", url: "/gestion/comptabilite", icon: Wallet },
    { label: "Équipe", url: "/gestion/equipe", icon: Users },
    { label: "Configuration", url: "/gestion/config", icon: Settings },
];

export function GlobalSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const initialQuery = searchParams?.get("q") || "";
    const [query, setQuery] = React.useState(initialQuery);

    React.useEffect(() => {
        setQuery(searchParams?.get("q") || "");
    }, [searchParams]);

    const debouncedQuery = useDebounce(query, 300);
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            const allResults: Suggestion[] = [];
            const searchTerm = debouncedQuery.toLowerCase();

            // 1. Static Navigation Suggestions
            if (pathname?.startsWith("/gestion")) {
                const navMatches = GESTION_NAV_ITEMS.filter(item =>
                    item.label.toLowerCase().includes(searchTerm)
                ).map(item => ({
                    id: `nav-${item.label}`,
                    label: item.label,
                    subLabel: "Navigation",
                    type: "nav" as const,
                    url: item.url,
                    icon: item.icon
                }));
                allResults.push(...navMatches);
            }

            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    allResults.push(...data);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setSuggestions(allResults);
                setIsOpen(true);
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery, pathname]);

    const handleSelect = (url: string) => {
        setIsOpen(false);
        router.push(url);
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsOpen(false);

        if (!query.trim()) return;

        const trimmedQuery = query.trim();

        if (pathname?.startsWith("/gestion") || pathname?.startsWith("/admin")) {
            const params = new URLSearchParams(searchParams?.toString());
            params.set("q", trimmedQuery);
            router.push(`${pathname}?${params.toString()}`);
        } else {
            router.push(`/recherche?q=${encodeURIComponent(trimmedQuery)}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Rechercher un bien, une ville..."
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:bg-white/10 transition-all w-full rounded-2xl placeholder:text-white/40"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length < 2) setIsOpen(false);
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) setIsOpen(true);
                    }}
                />
            </form>

            {isOpen && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl outline-none animate-in fade-in-0 zoom-in-95 z-[100] max-h-[250px] sm:max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recherche...
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suggestions</p>
                            {suggestions.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleSelect(item.url)}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                >
                                    {item.type === 'nav' ? (
                                        <div className="mr-2 flex items-center justify-center w-4 h-4">
                                            {item.icon ? <item.icon className="h-4 w-4 text-orange-500" /> : <LayoutDashboard className="h-4 w-4 text-orange-500" />}
                                        </div>
                                    ) : item.type === 'tenant' ? (
                                        <User className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                                    ) : (
                                        <Building className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                                    )}
                                    <div className="flex flex-col items-start truncate">
                                        <span className="font-medium truncate w-full text-left">{item.label}</span>
                                        {item.subLabel && <span className="text-xs text-muted-foreground truncate w-full text-left">{item.subLabel}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            Aucun résultat trouvé.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
