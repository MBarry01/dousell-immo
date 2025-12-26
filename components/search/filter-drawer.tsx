"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BatteryCharging, Droplets, Minus, Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";

const propertyTypes: Array<NonNullable<PropertyFilters["type"]>> = [
  "Maison",
  "Appartement",
  "Studio",
];

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
};

export const FilterDrawer = ({
  open,
  onOpenChange,
  filters,
  onApply,
}: FilterDrawerProps) => {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [, startTransition] = useTransition();

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
      localFilters.maxPrice ?? 1_000_000_000,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[92vh] overflow-y-auto pb-28">
        <SheetHeader>
          <SheetTitle>Filtrer</SheetTitle>
          <SheetDescription>
            Ajuste les critères pour affiner la sélection.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Budget
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Slider
                value={sliderValue}
                min={0}
                max={1_000_000_000}
                step={10000}
                onValueChange={([min, max]) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minPrice: min === 0 ? undefined : min,
                    maxPrice: max === 1_000_000_000 ? undefined : max,
                  }))
                }
              />
              <div className="flex justify-between text-sm text-white/70">
                <span>{formatCurrency(sliderValue[0])}</span>
                <span>{formatCurrency(sliderValue[1])}</span>
              </div>
            </div>
          </section>

          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Type de bien
            </p>
            <ToggleGroup
              type="multiple"
              className="mt-4 flex flex-wrap gap-2"
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
                  type: undefined, // Nettoyer l'ancien filtre type si présent
                }));
              }}
            >
              {propertyTypes.map((type) => (
                <ToggleGroupItem
                  key={type}
                  value={type}
                  aria-label={`Filtrer par ${type}`}
                >
                  {type}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <section className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
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
                      className="h-10 w-10 rounded-full border border-white/10 bg-white/5"
                      onClick={() => handleCounterChange(item.key, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => handleCounterChange(item.key, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Infrastructures critiques
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={localFilters.hasBackupGenerator ? "secondary" : "ghost"}
                className={`rounded-full border ${
                  localFilters.hasBackupGenerator
                    ? "border-white bg-white/10 text-white"
                    : "border-white/10 text-white/70"
                }`}
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
                variant={localFilters.hasWaterTank ? "secondary" : "ghost"}
                className={`rounded-full border ${
                  localFilters.hasWaterTank
                    ? "border-white bg-white/10 text-white"
                    : "border-white/10 text-white/70"
                }`}
                onClick={() =>
                  toggleFeature("hasWaterTank", !localFilters.hasWaterTank)
                }
              >
                <Droplets className="mr-2 h-4 w-4" />
                Réservoir / Surpresseur
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Certification
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={localFilters.isVerified ? "secondary" : "ghost"}
                className={`rounded-full border ${
                  localFilters.isVerified
                    ? "border-[#F4C430] bg-[#F4C430]/20 text-white"
                    : "border-white/10 text-white/70"
                }`}
                onClick={() =>
                  toggleFeature("isVerified", !localFilters.isVerified)
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Biens certifiés uniquement
              </Button>
            </div>
          </section>
        </div>

        <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#0b0f18]/95 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-lg">
          <Button
            className="w-full rounded-2xl"
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

