"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

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

export function AddressAutocomplete({
    onAddressSelect,
    defaultValue = "",
    className,
}: AddressAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState(defaultValue);
    const [results, setResults] = React.useState<NominatimResult[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (query && query.length >= 3) {
                fetchSuggestions(query);
            } else {
                setResults([]);
            }
        }, 1000); // 1000ms debounce as requested

        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (searchQuery: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                q: searchQuery,
                format: "json",
                addressdetails: "1",
                limit: "5",
                countrycodes: "sn", // Restricted to Senegal
                "accept-language": "fr",
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`
            );

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            setResults(data);
            setOpen(true);
        } catch (error) {
            console.error("Error fetching address:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: NominatimResult) => {
        const city = item.address.city || item.address.town || item.address.village || item.address.municipality;
        const mainName = getPlaceName(item.address);

        // Construct a clean display string based on the user's preferred format logic
        const displayName = mainName ? `${mainName}, ${item.address.state || 'Sénégal'}` : item.display_name;

        setQuery(displayName);
        setOpen(false);

        onAddressSelect({
            display_name: displayName,
            road: item.address.road,
            suburb: item.address.suburb,
            city: city, // Keep original city logic for form data if needed, or update if user wants
            state: item.address.state,
            lat: item.lat,
            lon: item.lon
        });
    };

    return (
        <div className={cn("relative z-50", className)}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => {
                        if (results.length > 0) setOpen(true);
                    }}
                    placeholder="Ex: 15 Avenue Lamine Gueye..."
                    className="pr-10"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 overflow-hidden z-50">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {results.map((item) => {
                            const mainName = getPlaceName(item.address);
                            // Fallback : Si on ne trouve rien, on utilise le début du display_name complet
                            const displayName = mainName ? `${mainName}, ${item.address.state || ''}` : item.display_name;

                            return (
                                <div
                                    key={item.place_id}
                                    onMouseDown={(e) => {
                                        // Prevent input blur so the dropdown doesn't close before selection
                                        e.preventDefault();
                                        handleSelect(item);
                                    }}
                                    className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer rounded-sm hover:bg-muted/50 text-sm"
                                >
                                    <div className="flex items-start gap-2 w-full">
                                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {displayName}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
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

            {open && results.length === 0 && query.length >= 3 && !loading && (
                // Optional: Show empty state
                null
            )}
        </div>
    );
}
