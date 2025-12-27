"use client"

import { useState } from 'react';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTenantModal } from "./AddTenantModal";

interface AddTenantButtonProps {
    ownerId: string;
}

export function AddTenantButton({ ownerId }: AddTenantButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 rounded-lg h-9 px-4 font-medium text-sm transition-all"
            >
                <Plus className="w-4 h-4 mr-1.5" /> Nouveau
            </Button>

            <AddTenantModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ownerId={ownerId}
            />
        </>
    );
}
