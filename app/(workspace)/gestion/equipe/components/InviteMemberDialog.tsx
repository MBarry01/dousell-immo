"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteTeamMember } from "../actions";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { TEAM_ROLE_CONFIG, INVITABLE_ROLES } from "@/lib/team-permissions-config";
import type { TeamRole } from "@/types/team";
import { RoleBadge } from "./RoleBadge";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface InviteMemberDialogProps {
  teamId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({ teamId, onSuccess, trigger }: InviteMemberDialogProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<TeamRole, "owner">>("agent");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: result, error } = await inviteTeamMember({
      teamId,
      email,
      role,
      message: message || undefined,
    });

    setLoading(false);

    if (result?.success) {
      toast.success("Invitation envoyée !", {
        description: `Un email a été envoyé à ${email}`,
      });
      setOpen(false);
      setEmail("");
      setRole("agent");
      setMessage("");
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(error || "Erreur lors de l'envoi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          isDark ? "bg-slate-900 border-slate-700" : "bg-white"
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            Inviter un membre
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Email */}
          <div>
            <Label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
              required
            >
              <Mail className="w-4 h-4" />
              Adresse email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collegue@example.com"
              required
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>

          {/* Rôle */}
          <div>
            <Label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
              required
            >
              Rôle
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger
                className={cn(
                  isDark && "bg-slate-800 border-slate-700 text-white"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={cn(isDark && "bg-slate-800 border-slate-700", "max-w-[calc(100vw-2rem)]")}
              >
                {INVITABLE_ROLES.map((r) => {
                  const config = TEAM_ROLE_CONFIG[r];
                  return (
                    <SelectItem
                      key={r}
                      value={r}
                      className={cn(isDark && "text-white focus:bg-slate-700")}
                    >
                      <div className="flex items-center gap-3 max-w-full overflow-hidden">
                        <RoleBadge role={r} size="sm" />
                        <span
                          className={cn(
                            "text-xs truncate",
                            isDark ? "text-slate-400" : "text-gray-500"
                          )}
                        >
                          {config.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Aperçu du rôle sélectionné */}
          <div
            className={cn(
              "p-3 rounded-lg border",
              isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <RoleBadge role={role} size="sm" />
            </div>
            <p
              className={cn(
                "text-xs",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            >
              {TEAM_ROLE_CONFIG[role].description}
            </p>
          </div>

          {/* Message personnalisé */}
          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Message personnalisé (optionnel)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bienvenue dans l'équipe !"
              rows={3}
              maxLength={500}
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
            <p
              className={cn(
                "text-xs mt-1",
                isDark ? "text-slate-500" : "text-gray-400"
              )}
            >
              {message.length}/500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className={cn(
                isDark && "border-slate-700 text-slate-300 hover:bg-slate-800"
              )}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Envoyer l&apos;invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
