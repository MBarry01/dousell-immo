'use client';

/**
 * Composant de prévisualisation du contrat avant génération
 * Affiche les données qui seront incluses dans le PDF
 */

import { useEffect, useState } from 'react';
import { FileText, User, Home, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getLeaseDataForContract } from '@/lib/actions/contract-actions';
import { ContractData } from '@/lib/contract-template';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContractPreviewProps {
  leaseId: string;
}

export function ContractPreview({ leaseId }: ContractPreviewProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getLeaseDataForContract(leaseId);

      if (result.success && result.data) {
        setContractData(result.data);
      } else {
        setError(result.error || 'Erreur de chargement');
      }
      setLoading(false);
    }

    fetchData();
  }, [leaseId]);

  if (loading) {
    return (
      <Card className="bg-[#0f172a] border-[#1e293b]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#F4C430]" />
        </CardContent>
      </Card>
    );
  }

  if (error || !contractData) {
    return (
      <Card className="bg-[#0f172a] border-[#1e293b]">
        <CardContent className="py-12 text-center text-red-400">
          {error || 'Impossible de charger les données'}
        </CardContent>
      </Card>
    );
  }

  const { landlord, tenant, property, lease: leaseTerms, signatures } = contractData;

  return (
    <Card className="bg-[#0f172a] border-[#1e293b]">
      <CardHeader>
        <CardTitle className="text-[#F4C430] flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Aperçu du Contrat de Bail
        </CardTitle>
        <CardDescription className="text-gray-400">
          Ces informations seront incluses dans le contrat PDF généré
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section Bailleur */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            Le Bailleur (Propriétaire)
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            {landlord.companyName ? (
              <>
                <p><span className="text-gray-400">Société :</span> {landlord.companyName}</p>
                {landlord.ninea && <p><span className="text-gray-400">NINEA :</span> {landlord.ninea}</p>}
              </>
            ) : (
              <p><span className="text-gray-400">Nom :</span> {landlord.firstName} {landlord.lastName}</p>
            )}
            <p><span className="text-gray-400">Adresse :</span> {landlord.address}</p>
            <p><span className="text-gray-400">Téléphone :</span> {landlord.phone}</p>
            {landlord.email && <p><span className="text-gray-400">Email :</span> {landlord.email}</p>}
          </div>
        </div>

        <Separator className="bg-[#1e293b]" />

        {/* Section Locataire */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            Le Preneur (Locataire)
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            <p><span className="text-gray-400">Nom :</span> {tenant.firstName} {tenant.lastName}</p>
            <p><span className="text-gray-400">Téléphone :</span> {tenant.phone}</p>
            {tenant.email && <p><span className="text-gray-400">Email :</span> {tenant.email}</p>}
            {tenant.birthDate && tenant.birthPlace && (
              <p><span className="text-gray-400">Né(e) le :</span> {tenant.birthDate} à {tenant.birthPlace}</p>
            )}
          </div>
        </div>

        <Separator className="bg-[#1e293b]" />

        {/* Section Propriété */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] flex items-center gap-2 mb-3">
            <Home className="h-4 w-4" />
            Le Bien Loué
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            <p><span className="text-gray-400">Adresse :</span> {property.address}</p>
            <p><span className="text-gray-400">Description :</span> {property.description}</p>
            {property.propertyType && (
              <p><span className="text-gray-400">Type :</span> {property.propertyType}</p>
            )}
          </div>
        </div>

        <Separator className="bg-[#1e293b]" />

        {/* Section Termes du Bail */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4" />
            Termes Financiers
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            <p>
              <span className="text-gray-400">Loyer mensuel :</span>{' '}
              <span className="font-semibold text-[#F4C430]">
                {leaseTerms.monthlyRent.toLocaleString('fr-SN')} FCFA
              </span>
            </p>
            <p>
              <span className="text-gray-400">Dépôt de garantie :</span>{' '}
              <span className="font-semibold">
                {leaseTerms.securityDeposit.toLocaleString('fr-SN')} FCFA
              </span>
              {' '}({leaseTerms.depositMonths} mois)
            </p>
            <p>
              <span className="text-gray-400">Jour de paiement :</span> Le {leaseTerms.billingDay} de chaque mois
            </p>
          </div>
        </div>

        <Separator className="bg-[#1e293b]" />

        {/* Section Durée */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" />
            Durée du Bail
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            <p>
              <span className="text-gray-400">Date de début :</span>{' '}
              {format(leaseTerms.startDate, 'dd MMMM yyyy', { locale: fr })}
            </p>
            <p>
              <span className="text-gray-400">Durée :</span> {leaseTerms.duration} mois
            </p>
            <p className="text-xs text-gray-500 italic">
              Le bail sera renouvelable par tacite reconduction sauf dénonciation
            </p>
          </div>
        </div>

        <Separator className="bg-[#1e293b]" />

        {/* Section Signature */}
        <div>
          <h3 className="text-sm font-semibold text-[#F4C430] mb-3">
            Signatures
          </h3>
          <div className="space-y-2 text-sm text-gray-300 ml-6">
            <p>
              <span className="text-gray-400">Lieu :</span> {signatures.signatureCity}
            </p>
            <p>
              <span className="text-gray-400">Date :</span>{' '}
              {format(signatures.signatureDate, 'dd MMMM yyyy', { locale: fr })}
            </p>
            {signatures.landlordSignatureUrl && (
              <p className="text-green-400 text-xs">✓ Signature propriétaire disponible</p>
            )}
          </div>
        </div>

        {/* Conformité légale */}
        <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-lg p-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="font-semibold text-[#F4C430]">🇸🇳 Conformité Juridique :</span>
            {' '}Ce contrat sera généré conformément aux dispositions des articles relatifs au louage d'immeubles du COCC en vigueur au Sénégal,
            au décret 2023 sur la caution (max 2 mois de loyer), et à la loi 2024 sur les baux d&apos;habitation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
