"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Home, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { getVacantTeamProperties, type VacantProperty } from "../actions/property-selector";

interface PropertySelectorProps {
    onPropertySelect: (property: VacantProperty | null) => void;
    onCreateNew: (data: { title: string; address: string; price: number }) => void;
    selectedPropertyId?: string;
    defaultPrice?: number;
    defaultAddress?: string;
}

export function PropertySelector({
    onPropertySelect,
    onCreateNew,
    selectedPropertyId,
    defaultPrice,
    defaultAddress,
}: PropertySelectorProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<VacantProperty[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<VacantProperty | null>(null);

    // Mode création
    const [createMode, setCreateMode] = useState(false);
    const [newProperty, setNewProperty] = useState({
        title: "",
        address: "",
        price: defaultPrice || 0,
    });

    // Charger les biens vacants au montage
    useEffect(() => {
        async function loadProperties() {
            setLoading(true);
            const result = await getVacantTeamProperties();
            if (result.success && result.data) {
                setProperties(result.data);

                // Sélectionner le bien par défaut si fourni
                if (selectedPropertyId) {
                    const found = result.data.find((p) => p.id === selectedPropertyId);
                    if (found) {
                        setSelectedProperty(found);
                        onPropertySelect(found);
                    }
                }
            }
            setLoading(false);
        }
        loadProperties();
    }, [selectedPropertyId]);

    const handleSelect = (property: VacantProperty) => {
        setSelectedProperty(property);
        setCreateMode(false);
        onPropertySelect(property);
        setOpen(false);
    };

    const handleCreateMode = () => {
        setSelectedProperty(null);
        setCreateMode(true);
        onPropertySelect(null);
        setOpen(false);
    };

    const handleCreateSubmit = () => {
        if (newProperty.title && newProperty.address && newProperty.price > 0) {
            onCreateNew(newProperty);
        }
    };

    return (
        <div className="space-y-3">
            {/* Sélecteur principal */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                    Bien immobilier <span className="text-red-400">*</span>
                </label>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                "w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
                                !selectedProperty && !createMode && "text-slate-400"
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Chargement...
                                </span>
                            ) : selectedProperty ? (
                                <span className="flex items-center gap-2 truncate">
                                    <Home className="w-4 h-4 text-[#F4C430] shrink-0" />
                                    <span className="truncate">{selectedProperty.title}</span>
                                    <span className="text-slate-500 text-xs shrink-0">
                                        {selectedProperty.price.toLocaleString()} FCFA
                                    </span>
                                </span>
                            ) : createMode ? (
                                <span className="flex items-center gap-2 text-[#F4C430]">
                                    <Plus className="w-4 h-4" />
                                    Créer un nouveau bien...
                                </span>
                            ) : (
                                "Sélectionner un bien..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[400px] p-0 bg-slate-900 border-slate-700">
                        <Command className="bg-slate-900">
                            <CommandInput
                                placeholder="Rechercher un bien..."
                                className="text-white border-slate-700"
                            />
                            <CommandList>
                                <CommandEmpty className="text-slate-400 py-6 text-center">
                                    Aucun bien vacant trouvé.
                                </CommandEmpty>

                                {properties.length > 0 && (
                                    <CommandGroup heading="Biens vacants" className="text-slate-400">
                                        {properties.map((property) => (
                                            <CommandItem
                                                key={property.id}
                                                value={property.title}
                                                onSelect={() => handleSelect(property)}
                                                className="flex items-center gap-3 cursor-pointer text-white hover:bg-slate-800 aria-selected:bg-slate-800"
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 text-[#F4C430]",
                                                        selectedProperty?.id === property.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{property.title}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3" />
                                                        {property.address}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-mono text-[#F4C430] shrink-0">
                                                    {property.price.toLocaleString()} F
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                <CommandSeparator className="bg-slate-700" />

                                <CommandGroup>
                                    <CommandItem
                                        value="__create_new_property__"
                                        onSelect={handleCreateMode}
                                        className="flex items-center gap-2 cursor-pointer text-[#F4C430] hover:bg-slate-800 aria-selected:bg-slate-800"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span className="font-medium">Créer un nouveau bien...</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Badge récapitulatif si bien sélectionné */}
            {selectedProperty && (
                <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4C430]/20 flex items-center justify-center">
                        <Home className="w-5 h-5 text-[#F4C430]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                            ✅ {selectedProperty.title} sélectionné
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                            {selectedProperty.address} • {selectedProperty.price.toLocaleString()} FCFA/mois
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire de création de bien en ligne */}
            {createMode && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-[#F4C430] font-semibold">
                        <Plus className="w-4 h-4" />
                        Nouveau bien (création rapide)
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Nom du bien *</label>
                            <Input
                                placeholder="ex: Appart F2 Maristes"
                                value={newProperty.title}
                                onChange={(e) =>
                                    setNewProperty({ ...newProperty, title: e.target.value })
                                }
                                className="bg-slate-800 border-slate-600 text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Adresse *</label>
                            <Input
                                placeholder="ex: 58 rue Mariste, Dakar"
                                value={newProperty.address}
                                onChange={(e) =>
                                    setNewProperty({ ...newProperty, address: e.target.value })
                                }
                                className="bg-slate-800 border-slate-600 text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Loyer mensuel (FCFA) *</label>
                            <Input
                                type="number"
                                placeholder="300000"
                                value={newProperty.price || ""}
                                onChange={(e) =>
                                    setNewProperty({
                                        ...newProperty,
                                        price: parseInt(e.target.value) || 0,
                                    })
                                }
                                className="bg-slate-800 border-slate-600 text-white font-mono"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        💡 Ce bien sera créé en mode "brouillon" (sans photos). Vous pourrez l'enrichir plus tard.
                    </p>
                </div>
            )}

            {/* Champs cachés pour le formulaire parent */}
            {selectedProperty && (
                <>
                    <input type="hidden" name="property_id" value={selectedProperty.id} />
                    <input type="hidden" name="property_address" value={selectedProperty.address} />
                    <input type="hidden" name="monthly_amount_prefilled" value={selectedProperty.price} />
                </>
            )}
            {createMode && (
                <>
                    <input type="hidden" name="create_new_property" value="true" />
                    <input type="hidden" name="new_property_title" value={newProperty.title} />
                    <input type="hidden" name="new_property_address" value={newProperty.address} />
                    <input type="hidden" name="new_property_price" value={newProperty.price} />
                </>
            )}
        </div>
    );
}
