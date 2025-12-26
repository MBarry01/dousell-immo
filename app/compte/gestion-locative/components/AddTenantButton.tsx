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
                className="bg-white text-black hover:bg-gray-200 rounded-xl h-12 px-6 font-bold transition-all transform hover:scale-105"
            >
                <Plus className="w-5 h-5 mr-2" /> Nouveau Locataire
            </Button>

            <AddTenantModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ownerId={ownerId}
            />
        </>
    );
}
