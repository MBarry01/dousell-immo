"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Home, Banknote, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchDropdown from "./SearchDropdown";
import { getSearchSuggestions } from "@/services/propertyService";
import { useDebounce } from "@/hooks/use-debounce";

const typeOptions = [
    { value: "appartement", label: "Appartement" },
    { value: "villa", label: "Villa" },
    { value: "studio", label: "Studio" },
    { value: "terrain", label: "Terrain" },
    { value: "lofts", label: "Lofts" },
];

const budgetOptions = [
    { value: "100000", label: "100k FCFA" },
    { value: "250000", label: "250k FCFA" },
    { value: "500000", label: "500k FCFA" },
    { value: "1000000", label: "1M+ FCFA" },
    { value: "2000000", label: "2M+ FCFA" },
];

export default function TenantHeroSearch() {
    const router = useRouter();
    const [location, setLocation] = useState("");
    const [type, setType] = useState("");
    const [budget, setBudget] = useState("");

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce the search query
    const debouncedLocation = useDebounce(location, 300);

    // Fetch suggestions when debounced location changes
    useEffect(() => {
        if (debouncedLocation && debouncedLocation.length >= 2) {
            setIsLoadingSuggestions(true);
            getSearchSuggestions(debouncedLocation)
                .then((results) => {
                    setSuggestions(results);
                    setSelectedIndex(-1);
                })
                .finally(() => setIsLoadingSuggestions(false));
        } else {
            setSuggestions([]);
        }
    }, [debouncedLocation]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append("q", location);
        if (type) params.append("type", type);
        if (budget) params.append("maxPrice", budget);
        router.push(`/recherche?${params.toString()}`);
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setLocation(suggestion);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[selectedIndex]);
                } else {
                    handleSearch();
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-4xl mx-auto mt-4 md:mt-8 relative z-20"
        >
            {/* Container Principal */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl md:rounded-full flex flex-col md:flex-row shadow-2xl ring-1 ring-white/5 overflow-visible"
            >

                {/* Localisation avec Autocomplete */}
                <div className="flex-1 relative group border-b md:border-b-0 md:border-r border-white/5">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                        {isLoadingSuggestions ? (
                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[#F4C430] animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#F4C430]" />
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="search"
                        enterKeyHint="search"
                        placeholder="Ville, Quartier..."
                        className="w-full h-12 md:h-16 pl-10 md:pl-14 pr-4 bg-transparent border-none text-white text-sm md:text-base placeholder-gray-400 focus:ring-0 transition-all font-medium rounded-full outline-none"
                        value={location}
                        onChange={(e) => {
                            setLocation(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
                            >
                                {isLoadingSuggestions && suggestions.length === 0 ? (
                                    <div className="flex items-center justify-center py-4 text-gray-400">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-sm">Recherche...</span>
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm rounded-xl transition-all cursor-pointer ${index === selectedIndex
                                                    ? "bg-[#F4C430] text-black font-semibold"
                                                    : "text-gray-200 hover:bg-white/10 hover:text-white"
                                                    }`}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSelectSuggestion(suggestion);
                                                }}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                            >
                                                <MapPin className={`h-4 w-4 shrink-0 ${index === selectedIndex ? "text-black" : "text-[#F4C430]"}`} />
                                                <span className="truncate">{suggestion}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Type de bien - Custom Dropdown */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-white/5 overflow-visible">
                    <SearchDropdown
                        options={typeOptions}
                        placeholder="Type de bien"
                        value={type}
                        onValueChange={setType}
                        icon={<Home className="w-4 h-4 md:w-5 md:h-5 text-[#F4C430]" />}
                    />
                </div>

                {/* Budget - Custom Dropdown */}
                <div className="flex-1 hidden md:block border-r border-white/5 overflow-visible">
                    <SearchDropdown
                        options={budgetOptions}
                        placeholder="Budget Max"
                        value={budget}
                        onValueChange={setBudget}
                        icon={<Banknote className="w-5 h-5 text-[#F4C430]" />}
                    />
                </div>

                {/* Bouton Rechercher */}
                <div className="p-1">
                    <button
                        onClick={handleSearch}
                        className="w-full md:w-14 h-11 md:h-14 bg-[#F4C430] hover:bg-[#ffde59] text-black rounded-xl md:rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(244,196,48,0.3)] hover:shadow-[0_0_25px_rgba(244,196,48,0.5)] flex items-center justify-center group active:scale-[0.98]"
                        aria-label="Lancer la recherche"
                    >
                        <Search className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
