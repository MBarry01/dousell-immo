"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  allowCustom?: boolean;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat",
  className = "",
  allowCustom = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full flex items-center justify-between bg-zinc-800/30 border rounded-lg px-4 py-3 text-left transition-all",
            open
              ? "border-[#F4C430]/50 ring-1 ring-[#F4C430]/20"
              : "border-zinc-800 hover:border-zinc-700",
            className
          )}
        >
          <span className={selectedOption ? "text-white" : "text-zinc-500"}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-500 transition-transform",
                open && "rotate-180"
              )}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <span className="text-zinc-500">{emptyText}</span>
              {allowCustom && search && (
                <button
                  type="button"
                  onClick={() => handleSelect(search)}
                  className="block w-full mt-2 px-3 py-2 bg-zinc-800 rounded-lg text-white hover:text-primary transition-all active:scale-95"
                >
                  Ajouter &quot;{search}&quot;
                </button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0 text-primary",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className={option.value === value ? "text-primary font-medium" : ""}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
