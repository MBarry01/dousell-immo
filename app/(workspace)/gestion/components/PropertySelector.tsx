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

                // Sélectionner le bien par défaut si ID fourni
                if (selectedPropertyId) {
                    const found = result.data.find((p) => p.id === selectedPropertyId);
                    if (found) {
                        setSelectedProperty(found);
                        onPropertySelect(found);
                    }
                }
                // OU essayer de matcher par adresse par défaut (mode démo / import)
                else if (defaultAddress && result.data.length > 0) {
                    const normalizedDefault = defaultAddress.toLowerCase().trim();

                    // Recherche exacte d'abord
                    let matched = result.data.find((p) =>
                        p.address.toLowerCase().includes(normalizedDefault) ||
                        normalizedDefault.includes(p.address.toLowerCase()) ||
                        p.city?.toLowerCase() === normalizedDefault.split(',')[0].trim()
                    );

                    // Si pas de match exact, recherche par mots-clés
                    if (!matched) {
                        const keywords = normalizedDefault.split(/[,\s]+/).filter(k => k.length > 2);
                        matched = result.data.find((p) =>
                            keywords.some(kw =>
                                p.address.toLowerCase().includes(kw) ||
                                p.title.toLowerCase().includes(kw) ||
                                p.city?.toLowerCase().includes(kw)
                            )
                        );
                    }

                    if (matched) {
                        setSelectedProperty(matched);
                        onPropertySelect(matched);
                    } else {
                        // Aucun bien trouvé, passer en mode création avec l'adresse pré-remplie
                        setCreateMode(true);
                        setNewProperty(prev => ({
                            ...prev,
                            address: defaultAddress,
                            price: defaultPrice || 0
                        }));
                    }
                }
            }
            setLoading(false);
        }
        loadProperties();
    }, [selectedPropertyId, defaultAddress]);

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
                <label className="text-sm font-medium text-foreground/80">
                    Bien immobilier <span className="text-destructive">*</span>
                </label>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                "w-full justify-between bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground",
                                !selectedProperty && !createMode && "text-muted-foreground"
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Chargement...
                                </span>
                            ) : selectedProperty ? (
                                <span className="flex items-center gap-2 truncate">
                                    <Home className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate">{selectedProperty.title}</span>
                                    <span className="text-muted-foreground text-xs shrink-0">
                                        {selectedProperty.price.toLocaleString()} FCFA
                                    </span>
                                </span>
                            ) : createMode ? (
                                <span className="flex items-center gap-2 text-primary">
                                    <Plus className="w-4 h-4" />
                                    Créer un nouveau bien...
                                </span>
                            ) : (
                                "Sélectionner un bien..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[400px] p-0 bg-popover border-border shadow-2xl">
                        <Command className="bg-popover">
                            <CommandInput
                                placeholder="Rechercher un bien..."
                                className="text-foreground border-border"
                            />
                            <CommandList>
                                <CommandEmpty className="text-muted-foreground py-6 text-center">
                                    Aucun bien vacant trouvé.
                                </CommandEmpty>

                                {properties.length > 0 && (
                                    <CommandGroup heading="Biens vacants" className="text-muted-foreground">
                                        {properties.map((property) => (
                                            <CommandItem
                                                key={property.id}
                                                value={property.title}
                                                onSelect={() => handleSelect(property)}
                                                className="flex items-center gap-3 cursor-pointer text-foreground hover:bg-accent aria-selected:bg-accent"
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 text-primary",
                                                        selectedProperty?.id === property.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate text-foreground">{property.title}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3" />
                                                        {property.address}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-mono text-primary shrink-0">
                                                    {property.price.toLocaleString()} F
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                <CommandSeparator className="bg-border" />

                                <CommandGroup>
                                    <CommandItem
                                        value="__create_new_property__"
                                        onSelect={handleCreateMode}
                                        className="flex items-center gap-2 cursor-pointer text-primary hover:bg-accent aria-selected:bg-accent"
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
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                            ✅ {selectedProperty.title} sélectionné
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {selectedProperty.address} • {selectedProperty.price.toLocaleString()} FCFA/mois
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire de création de bien en ligne */}
            {createMode && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <Plus className="w-4 h-4" />
                        Nouveau bien (création rapide)
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Nom du bien *</label>
                            <Input
                                placeholder="ex: Appart F2 Maristes"
                                value={newProperty.title}
                                onChange={(e) =>
                                    setNewProperty({ ...newProperty, title: e.target.value })
                                }
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Adresse *</label>
                            <Input
                                placeholder="ex: 58 rue Mariste, Dakar"
                                value={newProperty.address}
                                onChange={(e) =>
                                    setNewProperty({ ...newProperty, address: e.target.value })
                                }
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Loyer mensuel (FCFA) *</label>
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
                                className="bg-background border-border text-foreground font-mono"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground/60">
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
