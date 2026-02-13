"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BatteryCharging,
  Droplets,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  Home,
  Building2,
  PanelTop,
  Map as MapIcon,
  Building
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PropertyFilters } from "@/services/propertyService";
import { cn } from "@/lib/utils";

const propertyTypeOptions = [
  {
    value: "Villa",
    label: "Villa",
    icon: Home
  },
  {
    value: "Appartement",
    label: "Appartement",
    icon: Building2
  },
  {
    value: "Studio",
    label: "Studio",
    icon: PanelTop
  },
  {
    value: "Terrain",
    label: "Terrain",
    icon: MapIcon
  },
  {
    value: "Immeuble",
    label: "Immeuble",
    icon: Building
  },
];

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
};

// Max slider value set to 500 Millions FCFA to cover sales and high-end rentals
const MAX_PRICE_SLIDER = 500_000_000;
const PRICE_STEP = 100_000;

export const FilterDrawer = ({
  open,
  onOpenChange,
  filters,
  onApply,
}: FilterDrawerProps) => {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [, startTransition] = useTransition();

  // Sync when opening
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setLocalFilters(filters);
      });
    }
  }, [open, filters, startTransition]);

  const sliderValue = useMemo<[number, number]>(() => {
    return [
      localFilters.minPrice ?? 0,
      Math.min(localFilters.maxPrice ?? MAX_PRICE_SLIDER, MAX_PRICE_SLIDER),
    ];
  }, [localFilters.minPrice, localFilters.maxPrice]);

  const handleCounterChange = (key: "rooms" | "bedrooms", delta: number) => {
    setLocalFilters((prev) => {
      const current = prev[key] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next || undefined };
    });
  };

  const toggleFeature = (
    key: "hasBackupGenerator" | "hasWaterTank" | "isVerified",
    value: boolean
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value ? true : undefined,
    }));
  };

  const resetFilters = () => {
    setLocalFilters({
      limit: localFilters.limit,
      minPrice: undefined,
      maxPrice: undefined,
      type: undefined,
      types: undefined,
      rooms: undefined,
      bedrooms: undefined,
      hasBackupGenerator: undefined,
      hasWaterTank: undefined,
      isVerified: undefined,
    });
  };

  const handleMinPriceChange = (val: string) => {
    const num = val === "" ? undefined : parseInt(val.replace(/\s/g, ""), 10);
    setLocalFilters((prev) => ({ ...prev, minPrice: num }));
  };

  const handleMaxPriceChange = (val: string) => {
    const num = val === "" ? undefined : parseInt(val.replace(/\s/g, ""), 10);
    setLocalFilters((prev) => ({ ...prev, maxPrice: num }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto pb-28">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between pr-12">
            <SheetTitle>Filtrer</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-2 px-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          </div>
          <SheetDescription>
            Ajuste les critères pour affiner la sélection.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">

          {/* Budget Section - Full Width */}
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430] mb-4">
              Budget (FCFA)
            </p>
            <div className="space-y-6 px-1">
              <Slider
                value={sliderValue}
                min={0}
                max={MAX_PRICE_SLIDER}
                step={PRICE_STEP}
                onValueChange={([min, max]) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minPrice: min === 0 ? undefined : min,
                    maxPrice: max === MAX_PRICE_SLIDER ? undefined : max,
                  }))
                }
              />
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice ?? ""}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Max (Illimité)"
                  value={localFilters.maxPrice ?? ""}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl"
                />
              </div>
            </div>
          </section>

          {/* Type Section - Horizontal */}
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430] mb-4">
              Type de bien
            </p>
            <ToggleGroup
              type="multiple"
              className="flex justify-start gap-4"
              value={
                localFilters.types && localFilters.types.length > 0
                  ? localFilters.types
                  : localFilters.type
                    ? [localFilters.type]
                    : []
              }
              onValueChange={(values) => {
                setLocalFilters((prev) => ({
                  ...prev,
                  types: values.length > 0 ? (values as PropertyFilters["types"]) : undefined,
                  type: undefined,
                }));
              }}
            >
              {propertyTypeOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={`Filtrer par ${option.label}`}
                  className="flex h-auto flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white/60 transition-all hover:bg-white/10 hover:text-white data-[state=on]:border-[#F4C430] data-[state=on]:bg-[#F4C430]/10 data-[state=on]:text-[#F4C430]"
                >
                  <option.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          {/* Composition & Features - Grid Layout for efficiency */}
          <div className="grid gap-8 md:grid-cols-2">
            <section className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
                Composition
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Pièces",
                    key: "rooms" as const,
                    value: localFilters.rooms ?? 0,
                  },
                  {
                    label: "Chambres",
                    key: "bedrooms" as const,
                    value: localFilters.bedrooms ?? 0,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white/60">{item.label}</p>
                      <p className="text-xl font-semibold">{item.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => handleCounterChange(item.key, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
                        onClick={() => handleCounterChange(item.key, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
                Infrastructures & Certification
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "rounded-full border transition-all",
                    localFilters.hasBackupGenerator
                      ? "border-[#F4C430] bg-[#F4C430]/10 text-[#F4C430]"
                      : "border-white/10 text-white/70 bg-white/5 hover:bg-white/10"
                  )}
                  onClick={() =>
                    toggleFeature(
                      "hasBackupGenerator",
                      !localFilters.hasBackupGenerator
                    )
                  }
                >
                  <BatteryCharging className="mr-2 h-4 w-4" />
                  Groupe électrogène
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "rounded-full border transition-all",
                    localFilters.hasWaterTank
                      ? "border-[#F4C430] bg-[#F4C430]/10 text-[#F4C430]"
                      : "border-white/10 text-white/70 bg-white/5 hover:bg-white/10"
                  )}
                  onClick={() =>
                    toggleFeature("hasWaterTank", !localFilters.hasWaterTank)
                  }
                >
                  <Droplets className="mr-2 h-4 w-4" />
                  Réservoir / Surpresseur
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "rounded-full border transition-all",
                    localFilters.isVerified
                      ? "border-green-500 bg-green-500/10 text-green-500"
                      : "border-white/10 text-white/70 bg-white/5 hover:bg-white/10"
                  )}
                  onClick={() =>
                    toggleFeature("isVerified", !localFilters.isVerified)
                  }
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Biens certifiés
                </Button>
              </div>
            </section>
          </div>
        </div>

        <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#0b0f18]/95 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-lg">
          <Button
            className="w-full rounded-2xl bg-[#F4C430] h-12 text-black font-bold hover:bg-[#F4C430]/90"
            onClick={() => {
              onApply(localFilters);
              onOpenChange(false);
            }}
          >
            Appliquer les filtres
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
