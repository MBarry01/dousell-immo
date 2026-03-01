import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface QuittanceData {
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;
  amount: number;
  periodMonth: string;
  periodStart: string;
  periodEnd: string;
  receiptNumber: string;
  ownerName: string;
  ownerAddress: string;
  ownerNinea?: string;
  ownerLogo?: string;
  ownerSignature?: string;
  propertyAddress: string;
  /** If true, this is a guarantee/deposit payment, not rent */
  isGuarantee?: boolean;
}

// Palette sobre et professionnelle
const C = {
  black:   '#111111',
  dark:    '#2C2C2C',
  mid:     '#555555',
  muted:   '#888888',
  light:   '#BBBBBB',
  border:  '#D8D8D8',
  stripe:  '#F6F6F6',
  white:   '#FFFFFF',
  gold:    '#C8A84B',  // or doux, utilisé uniquement pour l'accent header
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerAccent: {
    height: 3,
    backgroundColor: C.gold,
    marginBottom: 14,
    borderRadius: 1,
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

  // ─── Blocs parties ───────────────────────────────────────
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
    alignItems: 'baseline',
    backgroundColor: C.stripe,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 2,
    marginBottom: 14,
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

  // ─── Tableau ─────────────────────────────────────────────
  table: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.stripe,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 2,
    borderTopColor: C.dark,
  },
  col1: { width: '45%', fontSize: 8 },
  col2: { width: '30%', fontSize: 8, textAlign: 'right' },
  col3: { width: '25%', fontSize: 8, textAlign: 'right' },
  colHead: {
    fontSize: 7,
    color: C.muted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Signature ───────────────────────────────────────────
  signatureBlock: {
    alignItems: 'flex-end',
    marginTop: 10,
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

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export const createQuittanceDocument = (data: QuittanceData) => {
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Bande d'accent or */}
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
            <Text style={styles.refLabel}>Quittance N°</Text>
            <Text style={styles.refValue}>{data.receiptNumber}</Text>
            <Text style={styles.refLabel}>Date d'émission</Text>
            <Text style={[styles.refValue, { fontSize: 9 }]}>{today}</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.titleWrapper}>
          <View style={styles.titleLine} />
          <Text style={styles.titleText}>
            {data.isGuarantee ? 'Attestation de dépôt de garantie' : 'Quittance de loyer'}
          </Text>
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
            {data.tenantAddress && data.tenantAddress !== 'Adresse non renseignée' && (
              <Text style={styles.partyText}>{data.tenantAddress}</Text>
            )}
            {data.tenantEmail && <Text style={styles.partyText}>{data.tenantEmail}</Text>}
            {data.tenantPhone && <Text style={styles.partyText}>{data.tenantPhone}</Text>}
          </View>
        </View>

        {/* Adresse du bien */}
        {data.propertyAddress && data.propertyAddress !== 'Adresse non renseignée' && (
          <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>Bien loué :</Text>
            <Text style={styles.propertyValue}>{data.propertyAddress}</Text>
          </View>
        )}

        {/* Texte légal */}
        <Text style={styles.legalText}>
          Je soussigné(e), <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou
          mandataire{data.propertyAddress && data.propertyAddress !== 'Adresse non renseignée'
            ? <> du bien situé au <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text></>
            : ''}, reconnais avoir reçu de{' '}
          <Text style={{ fontWeight: 'bold' }}>{data.tenantName}</Text>, locataire dudit bien, la somme
          détaillée ci-dessous{' '}
          {data.isGuarantee
            ? 'à titre de dépôt de garantie.'
            : 'au titre du loyer et des charges pour la période concernée.'}
        </Text>

        {/* Tableau */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.colHead]}>Désignation</Text>
            <Text style={[styles.col2, styles.colHead]}>Période</Text>
            <Text style={[styles.col3, styles.colHead]}>Montant</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>
              {data.isGuarantee ? 'Dépôt de garantie' : 'Loyer et charges'}
            </Text>
            <Text style={styles.col2}>
              {data.isGuarantee
                ? data.periodMonth
                : `Du ${data.periodStart} au ${data.periodEnd}`}
            </Text>
            <Text style={styles.col3}>{fmt(data.amount)} FCFA</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={[styles.col1, { fontWeight: 'bold', color: C.black }]}>Total acquitté</Text>
            <Text style={styles.col2} />
            <Text style={[styles.col3, { fontWeight: 'bold', fontSize: 10, color: C.black }]}>
              {fmt(data.amount)} FCFA
            </Text>
          </View>
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
          Document généré par Dousel pour {data.ownerName} — Pour faire valoir ce que de droit.
        </Text>
      </Page>
    </Document>
  );
};

export type { QuittanceData };

export const QuittancePDF: React.FC<{ data: QuittanceData }> = ({ data }) => {
  return createQuittanceDocument(data);
};
