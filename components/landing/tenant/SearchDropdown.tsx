"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const transition = {
    type: "spring" as const,
    mass: 0.5,
    damping: 11.5,
    stiffness: 100,
    restDelta: 0.001,
    restSpeed: 0.001,
};

interface DropdownOption {
    value: string;
    label: string;
}

interface SearchDropdownProps {
    options: DropdownOption[];
    placeholder: string;
    value: string;
    onValueChange: (value: string) => void;
    icon: React.ReactNode;
    align?: "left" | "center" | "right";
}

export default function SearchDropdown({
    options,
    placeholder,
    value,
    onValueChange,
    icon,
    align = "center",
}: SearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

    // Positioning offset based on alignment
    const getAlignmentClass = () => {
        if (align === "left") return "left-0 origin-top-left";
        if (align === "right") return "right-0 origin-top-right";
        return "left-1/2 -translate-x-1/2 origin-top";
    };

    return (
        <div
            ref={triggerRef}
            className="relative flex-1 h-12 md:h-16"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Trigger */}
            <div className="flex items-center h-full px-4 cursor-pointer">
                <div className="mr-2 md:mr-3">{icon}</div>
                <span
                    className={`text-sm font-medium ${value ? "text-white" : "text-gray-400"} hover:text-[#F4C430] transition-colors`}
                >
                    {selectedLabel}
                </span>
            </div>

            {/* Dropdown Content - Positioned Absolutely relative to container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={transition}
                        className={`absolute top-[calc(100%+4px)] ${getAlignmentClass()} z-50 min-w-[200px] w-full`}
                    >
                        <div className="bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-[#F4C430]/20">
                            <div className="p-2">
                                <div className="flex flex-col space-y-1">
                                    {options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                onValueChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all ${value === option.value
                                                ? "bg-[#F4C430] text-black font-semibold"
                                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
