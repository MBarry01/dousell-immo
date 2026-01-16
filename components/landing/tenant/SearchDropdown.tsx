"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Positioning offset based on alignment
    const getTransformX = () => {
        if (align === "left") return "0%";
        if (align === "right") return "-100%";
        return "-50%"; // center
    };

    const getLeftOffset = () => {
        if (align === "left") return dropdownPosition.left;
        if (align === "right") return dropdownPosition.left + dropdownPosition.width;
        return dropdownPosition.left + dropdownPosition.width / 2; // center
    };

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: `${dropdownPosition.top}px`,
                        left: `${getLeftOffset()}px`,
                        transform: `translateX(${getTransformX()})`,
                        zIndex: 9999,
                    }}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    {/* Invisible bridge */}
                    <div className="h-4 w-full" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 10 }}
                        transition={transition}
                        className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-[#F4C430]/20 shadow-2xl"
                    >
                        <div className="w-max h-full p-4">
                            <div className="flex flex-col space-y-4 text-sm">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onValueChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className="text-left text-gray-400 hover:text-[#F4C430] transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
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
            </div>

            {/* Portal for dropdown */}
            {typeof window !== "undefined" && createPortal(dropdownContent, document.body)}
        </>
    );
}
