"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Command as _CommandPrimitive } from "cmdk";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
// Removed Command imports

interface AddressAutocompleteProps {
    onAddressSelect: (address: {
        display_name: string;
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        lat?: string;
        lon?: string;
    }) => void;
    defaultValue?: string;
    className?: string;
    onChange?: (value: string) => void;
}

interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        state_district?: string;
        country?: string;
    };
}

const getPlaceName = (address: any) => {
    return (
        address.city ||        // Grandes villes (ex: Dakar)
        address.town ||        // Villes moyennes (ex: Guédiawaye, Pikine)
        address.village ||     // Villages
        address.hamlet ||      // Hameaux
        address.suburb ||      // Quartiers / Banlieues
        address.county ||      // Départements
        address.neighbourhood  // Quartier précis
    );
};

// Removed Popover imports

export function AddressAutocomplete({
    onAddressSelect,
    defaultValue = "",
    className,
    onChange,
}: AddressAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState(defaultValue);
    const [results, setResults] = React.useState<NominatimResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const ignoreNextQueryChange = React.useRef(!!defaultValue); // Ne pas fetch immédiatement si on a une valeur par défaut
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (ignoreNextQueryChange.current) {
            ignoreNextQueryChange.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (query && query.length >= 3) {
                fetchSuggestions(query);
            } else {
                setResults([]);
            }
        }, 300); // reduced to 300ms for snappier feedback

        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 3) return;
        setLoading(true);
        try {
            const response = await fetch(
                `/api/address/search?q=${encodeURIComponent(searchQuery)}`
            );

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            setResults(data);
            // N'ouvrir le Popover que si l'input a toujours le focus
            if (data.length > 0 && document.activeElement === inputRef.current) {
                setOpen(true);
            }
        } catch (error) {
            console.error("Error fetching address:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: NominatimResult) => {
        // 1. Extraire les composants de base
        const city = item.address.city || item.address.town || item.address.village || item.address.municipality;
        const mainName = getPlaceName(item.address);
        const region = item.address.state; // Région au Sénégal

        // 2. Construire le label d'affichage : Région, Ville/Quartier
        const labelParts = [];
        if (region) labelParts.push(region);
        if (mainName && mainName !== region) labelParts.push(mainName);

        // Si on n'a rien trouvé de précis, on garde le display_name de Nominatim
        const displayLabel = labelParts.length > 0 ? labelParts.join(", ") : item.display_name;

        // 3. Construire l'adresse complète (pour le stockage et la recherche)
        // On s'assure que "Sénégal" est à la fin pour la cohérence
        let fullAddress = displayLabel;
        if (!fullAddress.toLowerCase().includes("sénégal")) {
            fullAddress += ", Sénégal";
        }

        ignoreNextQueryChange.current = true;
        setQuery(fullAddress);
        setOpen(false);
        setResults([]);

        onAddressSelect({
            display_name: fullAddress,
            road: item.address.road,
            suburb: item.address.suburb,
            city: mainName || city,
            state: region,
            lat: item.lat,
            lon: item.lon
        });
    };

    return (
        <div className={cn("relative", className)}>
            <div className="relative group w-full">
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        onChange?.(val);
                        if (val.length >= 3) {
                            setOpen(true);
                        } else {
                            setOpen(false);
                            setResults([]);
                        }
                    }}
                    onFocus={() => {
                        if (results.length > 0) {
                            setOpen(true);
                        } else if (query.length >= 3) {
                            fetchSuggestions(query);
                        }
                    }}
                    onBlur={() => {
                        // On ferme immédiatement, car onMouseDown fait un e.preventDefault() et garde le focus sur l'input pour la sélection
                        setOpen(false);
                    }}
                    placeholder="Ex: Saly Portudal, Sénégal"
                    autoComplete="off"
                    className="w-full bg-card border-border text-foreground focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all h-auto py-3 px-4 rounded-lg"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-md border border-border bg-popover shadow-xl overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-hide">
                        {results.map((item) => {
                            const mainName = getPlaceName(item.address);
                            const region = item.address.state;

                            const labelParts = [];
                            if (region) labelParts.push(region);
                            if (mainName && mainName !== region) labelParts.push(mainName);

                            const displayLabel = labelParts.length > 0 ? labelParts.join(", ") : item.display_name;

                            return (
                                <div
                                    key={item.place_id}
                                    onMouseDown={(e) => {
                                        // Prevents input blur from firing before onClick
                                        e.preventDefault();
                                        handleSelect(item);
                                    }}
                                    className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer rounded-md hover:bg-muted text-sm transition-colors"
                                >
                                    <div className="flex items-start gap-2 w-full">
                                        <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-popover-foreground">
                                                {displayLabel}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                {item.display_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
