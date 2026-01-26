"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelInvitation } from "../actions";
import { toast } from "sonner";

interface CancelInvitationButtonProps {
  teamId: string;
  invitationId: string;
}

export function CancelInvitationButton({
  teamId,
  invitationId,
}: CancelInvitationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelInvitation(teamId, invitationId);
    setLoading(false);

    if (result.success) {
      toast.success("Invitation annulée");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de l'annulation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Annuler l&apos;invitation ?
          </DialogTitle>
          <DialogDescription>
            Cette personne ne pourra plus rejoindre l&apos;équipe avec ce lien.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-700 text-slate-300"
          >
            Non, garder
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Oui, annuler"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
