"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye } from "lucide-react";

interface LeadMessageDialogProps {
  fullName: string;
  message: string;
  projectType: string;
  availability: string;
}

export function LeadMessageDialog({
  fullName,
  message,
  projectType,
  availability,
}: LeadMessageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-2 text-left hover:bg-white/5 rounded-lg group flex items-start gap-2 w-full"
        >
          <p className="truncate text-white/70 text-xs group-hover:text-white/90 transition-colors flex-1">
            {message}
          </p>
          <Eye className="h-3.5 w-3.5 text-white/40 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Message de {fullName}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Type: <span className="capitalize text-white/80">{projectType}</span> ·
            Disponibilité: <span className="text-white/80">{availability}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

