"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Home, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchDropdown from "./SearchDropdown";

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

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append("location", location);
        if (type) params.append("type", type);
        if (budget) params.append("budget", budget);
        router.push(`/recherche?${params.toString()}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-4xl mx-auto mt-4 md:mt-8 relative z-20"
        >
            {/* Container Principal */}
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl md:rounded-full flex flex-col md:flex-row shadow-2xl ring-1 ring-white/5 overflow-visible">

                {/* Localisation */}
                <div className="flex-1 relative group border-b md:border-b-0 md:border-r border-white/5">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#F4C430]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Ville, Quartier..."
                        className="w-full h-12 md:h-16 pl-10 md:pl-14 pr-4 bg-transparent border-none text-white text-sm md:text-base placeholder-gray-400 focus:ring-0 transition-all font-medium rounded-full outline-none"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
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
            </div>
        </motion.div>
    );
}
