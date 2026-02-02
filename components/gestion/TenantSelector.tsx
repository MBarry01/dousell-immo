"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, User, Phone, Check, X } from "lucide-react";
import { searchTenants } from "@/app/(workspace)/gestion/biens/actions";
import { AddTenantButton } from "@/app/(workspace)/gestion/components/AddTenantButton";

// On réutilise le type Owner car c'est la même structure (Profile)
type Tenant = {
    id: string;
    full_name: string | null;
    phone: string | null;
    email?: string | null;
    avatar_url?: string | null;
};

type TenantSelectorProps = {
    value?: string;
    onChange: (tenantId: string | undefined, tenantData?: Tenant) => void;
    className?: string;
    propertyId: string;
    ownerId: string;
    propertyAddress?: string;
    propertyPrice?: number;
};

export function TenantSelector({ value, onChange, className = "", propertyId, ownerId, propertyAddress, propertyPrice }: TenantSelectorProps) {

    const [searchQuery, setSearchQuery] = useState("");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Recherche de locataires
    const handleSearch = useCallback(async (query: string) => {
        setIsSearching(true);
        const result = await searchTenants(query);
        setTenants(result.owners);
        setIsSearching(false);
    }, []);

    // Initial load
    useEffect(() => {
        handleSearch("");
    }, [handleSearch]);

    // Debounce de la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch(searchQuery);
            else handleSearch("");
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    // Sélection d'un locataire
    const handleSelect = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        onChange(tenant.id, tenant);

        setSearchQuery("");
    };

    // Retirer le locataire sélectionné
    const handleClear = () => {
        setSelectedTenant(null);
        onChange(undefined);
    };

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-foreground mb-2">
                Locataire
            </label>

            {/* Locataire sélectionné */}
            {selectedTenant ? (
                <div className="flex items-center justify-between bg-muted border border-border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{selectedTenant.full_name}</p>
                            <p className="text-sm text-muted-foreground">{selectedTenant.phone}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            ) : (
                <div className="bg-background border border-border rounded-lg overflow-hidden">
                    {/* Inline Search Header */}
                    <div className="mt-1 relative px-3 pt-3 pb-2 border-b border-border/50">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par nom ou téléphone..."
                            className="w-full bg-muted/30 border border-input rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Inline List */}
                    <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                        {isSearching ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">Recherche...</div>
                        ) : tenants.length > 0 ? (
                            tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    onClick={() => handleSelect(tenant)}
                                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-background transition-colors shadow-sm">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground group-hover:text-primary truncate transition-colors">{tenant.full_name}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {tenant.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {tenant.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {value === tenant.id && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                {searchQuery ? "Aucun locataire trouvé" : "Aucun locataire enregistré"}
                            </div>
                        )}
                    </div>

                    {/* Footer with Create Button */}
                    <div className="p-2 border-t border-border bg-muted/30">
                        <AddTenantButton
                            ownerId={ownerId}
                            initialData={{
                                address: propertyAddress,
                                amount: propertyPrice
                            }}
                            trigger={
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-input rounded-md text-muted-foreground hover:border-primary hover:text-primary hover:bg-background/50 transition-all text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Créer un nouveau locataire
                                </button>
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}


