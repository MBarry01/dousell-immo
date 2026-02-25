"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Command as _CommandPrimitive } from "cmdk";
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

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
    const ignoreNextQueryChange = React.useRef(false);

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
        }, 400); // reduced from 1000ms

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
                `/api/address/search?q=${encodeURIComponent(searchQuery)}`
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
        <Popover open={open && results.length > 0} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("relative", className)}>
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                            onChange?.(e.target.value);
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
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[calc(100vw-32px)] md:w-[350px]"
                align="start"
                onOpenAutoFocus={(e: Event) => e.preventDefault()}
            >
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {results.map((item) => {
                        const mainName = getPlaceName(item.address);
                        const region = item.address.state; // Région au Sénégal

                        const labelParts = [];
                        if (region) labelParts.push(region);
                        if (mainName && mainName !== region) labelParts.push(mainName);

                        // Si on n'a rien trouvé de précis, on garde le display_name de Nominatim
                        const displayLabel = labelParts.length > 0 ? labelParts.join(", ") : item.display_name;

                        return (
                            <div
                                key={item.place_id}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelect(item);
                                }}
                                className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer rounded-sm hover:bg-muted/50 text-sm"
                            >
                                <div className="flex items-start gap-2 w-full">
                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                            {displayLabel}
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
            </PopoverContent>
        </Popover>
    );
}
