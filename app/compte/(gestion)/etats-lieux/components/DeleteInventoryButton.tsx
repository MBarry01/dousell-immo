'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { deleteInventoryReport } from '../actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function DeleteInventoryButton({ id }: { id: string }) {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation if inside one
        e.stopPropagation(); // Stop propagation just in case

        if (!confirm('Êtes-vous sûr de vouloir supprimer cet état des lieux ? Cette action est irréversible.')) return;

        setDeleting(true);
        const res = await deleteInventoryReport(id);

        if (res?.error) {
            toast.error(res.error);
            setDeleting(false);
        } else {
            toast.success('État des lieux supprimé');
            router.refresh();
            // No need to setDeleting(false) as the component will likely unmount or refresh
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-lg z-10"
            title="Supprimer"
        >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
    );
}
