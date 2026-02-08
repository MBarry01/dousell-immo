"use client";

/**
 * AccessRequestModal - Modal pour demander un accès temporaire
 *
 * Utilisé quand un utilisateur n'a pas la permission nécessaire
 * pour effectuer une action mais peut demander un accès temporaire.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockKey, Check, X, ClockCounterClockwise } from "@phosphor-icons/react";
import { submitAccessRequest } from "@/app/(workspace)/gestion/access-control/actions";
import type { TeamPermissionKey } from "@/lib/team-permissions";

interface AccessRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  permission: TeamPermissionKey;
  permissionLabel?: string;
  permissionDescription?: string;
}

/**
 * Modal pour demander un accès temporaire à une fonctionnalité
 */
export function AccessRequestModal({
  open,
  onOpenChange,
  teamId,
  permission,
  permissionLabel,
  permissionDescription,
}: AccessRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErrorMessage("Veuillez indiquer une raison pour cette demande");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data: result, error } = await submitAccessRequest({
        teamId,
        permission,
        reason: reason.trim(),
      });

      if (result?.success) {
        setStatus('success');
        setTimeout(() => {
          onOpenChange(false);
          setReason("");
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(error || "Erreur lors de la demande");
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && status !== 'success') {
      onOpenChange(false);
      setReason("");
      setStatus('idle');
      setErrorMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {status === 'success' ? (
              <Check size={32} className="text-green-500" />
            ) : status === 'error' ? (
              <X size={32} className="text-red-500" />
            ) : (
              <LockKey size={32} className="text-primary" />
            )}
          </div>
          <DialogTitle className="text-xl text-center">
            {status === 'success'
              ? "Demande envoyée !"
              : status === 'error'
                ? "Erreur"
                : "Demander un accès temporaire"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {status === 'success' ? (
              "Votre demande a été envoyée aux responsables de l'équipe."
            ) : status === 'error' ? (
              errorMessage
            ) : (
              <>
                Vous n'avez pas la permission{" "}
                <span className="font-semibold text-foreground">
                  {permissionLabel || permission}
                </span>
                .{" "}
                {permissionDescription && (
                  <span className="block mt-2">{permissionDescription}</span>
                )}
                <span className="block mt-2">
                  Expliquez pourquoi vous avez besoin de cet accès temporaire.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Raison de la demande *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Je dois éditer ce bail pour corriger une erreur de saisie..."
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Cette demande sera envoyée aux responsables de votre équipe (owner/manager)
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <ClockCounterClockwise size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Accès temporaire</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Si votre demande est approuvée, vous recevrez un accès temporaire
                    à cette fonctionnalité (durée définie par le responsable).
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !reason.trim()}
                className="flex-1"
              >
                {isSubmitting ? "Envoi..." : "Envoyer la demande"}
              </Button>
            </DialogFooter>
          </>
        )}

        {status === 'success' && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Vous serez notifié lorsque votre demande sera traitée.
            </p>
          </div>
        )}

        {status === 'error' && (
          <DialogFooter>
            <Button
              type="button"
              onClick={handleClose}
              className="w-full"
            >
              Fermer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook pour gérer le modal d'accès
 */
export function useAccessRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    teamId: string;
    permission: TeamPermissionKey;
    permissionLabel?: string;
    permissionDescription?: string;
  } | null>(null);

  const open = (params: {
    teamId: string;
    permission: TeamPermissionKey;
    permissionLabel?: string;
    permissionDescription?: string;
  }) => {
    setConfig(params);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 300);
  };

  const Modal = config
    ? () => (
      <AccessRequestModal
        open={isOpen}
        onOpenChange={setIsOpen}
        teamId={config.teamId}
        permission={config.permission}
        permissionLabel={config.permissionLabel}
        permissionDescription={config.permissionDescription}
      />
    )
    : () => null;

  return { open, close, Modal, isOpen };
}
