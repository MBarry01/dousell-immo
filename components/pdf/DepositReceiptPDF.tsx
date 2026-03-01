import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface DepositReceiptData {
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  depositAmount: number;
  depositMonths: number;
  monthlyRent: number;
  receiptNumber: string;
  ownerName: string;
  ownerAddress: string;
  ownerNinea?: string;
  ownerLogo?: string;
  ownerSignature?: string;
  propertyAddress: string;
  leaseStartDate: string;
}

const C = {
  black:  '#111111',
  dark:   '#2C2C2C',
  mid:    '#555555',
  muted:  '#888888',
  light:  '#BBBBBB',
  border: '#D8D8D8',
  stripe: '#F6F6F6',
  white:  '#FFFFFF',
  gold:   '#C8A84B',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: C.dark,
    backgroundColor: C.white,
  },

  // ─── En-tête ─────────────────────────────────────────────
  headerAccent: {
    height: 3,
    backgroundColor: C.gold,
    marginBottom: 14,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: {
    width: 64,
    height: 40,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.black,
    marginBottom: 2,
  },
  companyInfo: {
    fontSize: 7.5,
    color: C.muted,
    marginBottom: 1,
  },
  headerRight: {
    textAlign: 'right',
  },
  refLabel: {
    fontSize: 7,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  refValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.black,
    marginBottom: 6,
  },

  // ─── Titre ───────────────────────────────────────────────
  titleWrapper: {
    marginVertical: 16,
    alignItems: 'center',
  },
  titleLine: {
    width: 40,
    height: 1,
    backgroundColor: C.gold,
    marginBottom: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  titleLineBtm: {
    width: 40,
    height: 1,
    backgroundColor: C.gold,
    marginTop: 6,
  },

  // ─── Parties ─────────────────────────────────────────────
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partyBox: {
    width: '47%',
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 2,
  },
  partyLabel: {
    fontSize: 6.5,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  partyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.black,
    marginBottom: 3,
  },
  partyText: {
    fontSize: 8,
    color: C.mid,
    marginBottom: 2,
  },

  // ─── Bien loué ───────────────────────────────────────────
  propertyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.stripe,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 2,
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.mid,
    marginRight: 6,
  },
  propertyValue: {
    fontSize: 8.5,
    color: C.dark,
  },

  // ─── Texte légal ─────────────────────────────────────────
  legalText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    marginBottom: 14,
    textAlign: 'justify',
    color: C.dark,
  },

  // ─── Bloc montant ────────────────────────────────────────
  amountBlock: {
    marginVertical: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 2,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C.black,
    marginBottom: 4,
  },
  amountDetail: {
    fontSize: 8,
    color: C.muted,
  },

  // ─── Conditions légales ──────────────────────────────────
  legalBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.stripe,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
    borderRadius: 2,
  },
  legalBoxTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: C.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  legalBoxText: {
    fontSize: 7.5,
    color: C.mid,
    lineHeight: 1.5,
    textAlign: 'justify',
  },

  // ─── Signature ───────────────────────────────────────────
  signatureBlock: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.mid,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureImage: {
    width: 90,
    height: 40,
    objectFit: 'contain',
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: C.border,
    marginTop: 30,
  },

  // ─── Footer ──────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 6.5,
    color: C.light,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
});

// Intl.NumberFormat('fr-FR') génère \u202F (espace fine) non supporté par Helvetica → remplacé par espace normale
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const createDepositReceiptDocument = (data: DepositReceiptData) => {
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Bande d'accent */}
        <View style={styles.headerAccent} />

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {data.ownerLogo && <Image src={data.ownerLogo} style={styles.logo} />}
            <Text style={styles.companyName}>{data.ownerName}</Text>
            {data.ownerAddress && <Text style={styles.companyInfo}>{data.ownerAddress}</Text>}
            {data.ownerNinea && <Text style={styles.companyInfo}>NINEA : {data.ownerNinea}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.refLabel}>Reçu N°</Text>
            <Text style={styles.refValue}>{data.receiptNumber}</Text>
            <Text style={styles.refLabel}>Date d'émission</Text>
            <Text style={[styles.refValue, { fontSize: 9 }]}>{today}</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.titleWrapper}>
          <View style={styles.titleLine} />
          <Text style={styles.titleText}>Reçu de dépôt de garantie</Text>
          <View style={styles.titleLineBtm} />
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Bailleur / Mandataire</Text>
            <Text style={styles.partyName}>{data.ownerName}</Text>
            {data.ownerAddress && <Text style={styles.partyText}>{data.ownerAddress}</Text>}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Locataire</Text>
            <Text style={styles.partyName}>{data.tenantName}</Text>
            {data.tenantEmail && <Text style={styles.partyText}>{data.tenantEmail}</Text>}
            {data.tenantPhone && <Text style={styles.partyText}>{data.tenantPhone}</Text>}
          </View>
        </View>

        {/* Bien loué */}
        {data.propertyAddress && (
          <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>Bien concerné :</Text>
            <Text style={styles.propertyValue}>{data.propertyAddress}</Text>
            {'  '}
            <Text style={styles.propertyLabel}>Début du bail :</Text>
            <Text style={styles.propertyValue}>{data.leaseStartDate}</Text>
          </View>
        )}

        {/* Texte légal */}
        <Text style={styles.legalText}>
          Je soussigné(e), <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou
          mandataire du bien situé au{' '}
          <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text>, reconnais avoir reçu de{' '}
          <Text style={{ fontWeight: 'bold' }}>{data.tenantName}</Text> la somme ci-dessous à titre de
          dépôt de garantie, conformément au contrat de bail en date du {data.leaseStartDate}.
        </Text>

        {/* Bloc montant */}
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Montant du dépôt de garantie reçu</Text>
          <Text style={styles.amountValue}>{fmt(data.depositAmount)} FCFA</Text>
          <Text style={styles.amountDetail}>
            {data.depositMonths} mois × {fmt(data.monthlyRent)} FCFA (loyer mensuel)
          </Text>
        </View>

        {/* Conditions de restitution */}
        <View style={styles.legalBox}>
          <Text style={styles.legalBoxTitle}>Conditions de restitution</Text>
          <Text style={styles.legalBoxText}>
            Ce dépôt de garantie sera restitué au locataire à la fin du bail, dans un délai maximum de
            deux mois suivant la remise des clés, déduction faite, le cas échéant, des sommes restant
            dues au bailleur et des sommes dont celui-ci pourrait être tenu en lieu et place du
            locataire, sous réserve qu'elles soient dûment justifiées (réparations locatives, loyers
            impayés, charges).
          </Text>
          <Text style={[styles.legalBoxText, { marginTop: 5 }]}>
            L'état des lieux de sortie servira de référence, en comparaison avec l'état des lieux
            d'entrée, pour déterminer les éventuelles retenues.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Le Bailleur</Text>
          {data.ownerSignature
            ? <Image src={data.ownerSignature} style={styles.signatureImage} />
            : <View style={styles.signatureLine} />}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par Dousel pour {data.ownerName} — Ce reçu fait foi de la réception du dépôt de garantie.
        </Text>
      </Page>
    </Document>
  );
};

export type { DepositReceiptData };

export const DepositReceiptPDF: React.FC<{ data: DepositReceiptData }> = ({ data }) => {
  return createDepositReceiptDocument(data);
};
