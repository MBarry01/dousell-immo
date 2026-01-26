"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, User, Phone, Check, X } from "lucide-react";
import { searchTenants } from "@/app/(workspace)/gestion/biens/actions";
import { AddTenantButton } from "@/app/(webapp)/gestion-locative/components/AddTenantButton";

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
            <label className="block text-sm font-medium text-zinc-300 mb-2">
                Locataire
            </label>

            {/* Locataire sélectionné */}
            {selectedTenant ? (
                <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white">{selectedTenant.full_name}</p>
                            <p className="text-sm text-zinc-400">{selectedTenant.phone}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {/* Inline Search Header */}
                    <div className="mt-1 relative px-3 pt-3 pb-2 border-b border-zinc-800/50">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par nom ou téléphone..."
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#F4C430] transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Inline List */}
                    <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                        {isSearching ? (
                            <div className="text-center py-4 text-zinc-500 text-sm">Recherche...</div>
                        ) : tenants.length > 0 ? (
                            tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    onClick={() => handleSelect(tenant)}
                                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">{tenant.full_name}</p>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            {tenant.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {tenant.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {value === tenant.id && (
                                        <Check className="w-4 h-4 text-[#F4C430]" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-6 text-zinc-500 text-sm">
                                {searchQuery ? "Aucun locataire trouvé" : "Aucun locataire enregistré"}
                            </div>
                        )}
                    </div>

                    {/* Footer with Create Button */}
                    <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
                        <AddTenantButton
                            ownerId={ownerId}
                            propertyId={propertyId}
                            initialData={{
                                address: propertyAddress,
                                amount: propertyPrice
                            }}
                            trigger={
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-zinc-700 rounded-md text-zinc-400 hover:border-[#F4C430] hover:text-[#F4C430] hover:bg-zinc-800/50 transition-all text-sm font-medium"
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


