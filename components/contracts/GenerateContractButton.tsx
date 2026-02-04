'use client';

/**
 * Bouton de génération de contrat de bail
 * Design System: Luxe & Teranga (Dark Mode, Gold Accent)
 * Updated: Uses CMS Modal for customization
 */

import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadLeaseContract } from '@/lib/actions/contract-actions';
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';
import { toast } from 'sonner';

interface GenerateContractButtonProps {
  leaseId: string;
  tenantName: string;
  existingContractUrl?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function GenerateContractButton({
  leaseId,
  tenantName,
  existingContractUrl,
  variant = 'default',
  size = 'default',
  className,
}: GenerateContractButtonProps) {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(existingContractUrl || null);

  const hasExistingContract = Boolean(generatedUrl);

  const handleDownload = async () => {
    // IMPORTANT : Toujours demander une URL signée fraîche au serveur.
    const loadingToast = toast.loading('Préparation du téléchargement...');

    try {
      const result = await downloadLeaseContract(leaseId);

      toast.dismiss(loadingToast);

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Erreur de téléchargement', {
          description: result.error || 'Le fichier semble inaccessible',
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Erreur technique', { description: 'Impossible de contacter le serveur' });
    }
  };

  return (
    <div className="flex gap-2">
      <GenerateContractModal
        leaseId={leaseId}
        tenantName={tenantName}
        onSuccess={(url) => setGeneratedUrl(url)}
      >
        <Button
          variant={variant}
          size={size}
          className={className || "bg-primary text-primary-foreground hover:bg-primary/90"}
        >
          <FileText className="mr-2 h-4 w-4" />
          {hasExistingContract ? 'Regénérer le Contrat' : 'Générer le Contrat'}
        </Button>
      </GenerateContractModal>

      {hasExistingContract && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size={size}
          className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </Button>
      )}
    </div>
  );
}
