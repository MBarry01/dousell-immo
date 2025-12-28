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
}

// Styles compacts pour tenir sur une page
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
  },
  logo: {
    width: 70,
    height: 45,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyInfo: {
    fontSize: 7,
    color: '#666',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    backgroundColor: '#f9f9f9',
    padding: 6,
    border: '1px solid #eee',
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  box: {
    width: '48%',
    padding: 8,
    border: '1px solid #ddd',
    borderRadius: 4,
  },
  boxHighlight: {
    width: '48%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#F4C430',
    borderRadius: 4,
    backgroundColor: '#fffdf5',
  },
  boxTitle: {
    fontSize: 7,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  boxName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  boxText: {
    fontSize: 8,
    color: '#555',
    marginBottom: 2,
  },
  propertyInfo: {
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 8,
  },
  legalText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: 'justify',
  },
  table: {
    marginTop: 8,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  col1: { width: '40%', fontSize: 8 },
  col2: { width: '30%', fontSize: 8, textAlign: 'right' },
  col3: { width: '30%', fontSize: 8, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 7,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  signatureBlock: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signature: {
    width: 90,
    height: 40,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 7,
    color: '#ccc',
    fontStyle: 'italic',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 6,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});

// Helper pour formater les montants
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(amount);
};

// Fonction pour générer le Document PDF
export const createQuittanceDocument = (data: QuittanceData) => {
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {data.ownerLogo && (
              <Image src={data.ownerLogo} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{data.ownerName}</Text>
            {data.ownerAddress && (
              <Text style={styles.companyInfo}>{data.ownerAddress}</Text>
            )}
            {data.ownerNinea && (
              <Text style={styles.companyInfo}>NINEA: {data.ownerNinea}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>Quittance N°</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>
              {data.receiptNumber}
            </Text>
            <Text style={styles.companyInfo}>Date d&apos;émission</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{today}</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>QUITTANCE DE LOYER</Text>

        {/* Blocs d'infos */}
        <View style={styles.infoBlock}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bailleur / Mandataire</Text>
            <Text style={styles.boxName}>{data.ownerName}</Text>
            {data.ownerAddress && (
              <Text style={styles.boxText}>{data.ownerAddress}</Text>
            )}
          </View>
          <View style={styles.boxHighlight}>
            <Text style={[styles.boxTitle, { color: '#B8860B' }]}>Locataire</Text>
            <Text style={styles.boxName}>{data.tenantName}</Text>
            {data.tenantAddress && data.tenantAddress !== 'Adresse non renseignée' && (
              <Text style={styles.boxText}>{data.tenantAddress}</Text>
            )}
            {data.tenantEmail && (
              <Text style={styles.boxText}>{data.tenantEmail}</Text>
            )}
            {data.tenantPhone && (
              <Text style={styles.boxText}>{data.tenantPhone}</Text>
            )}
          </View>
        </View>

        {/* Adresse du bien - Seulement si renseignée */}
        {data.propertyAddress && data.propertyAddress !== 'Adresse non renseignée' && (
          <View style={styles.propertyInfo}>
            <Text>
              <Text style={{ fontWeight: 'bold' }}>Adresse du bien loué : </Text>
              {data.propertyAddress}
            </Text>
          </View>
        )}

        {/* Texte légal */}
        <Text style={styles.legalText}>
          Je soussigné(e) <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou mandataire
          {data.propertyAddress && data.propertyAddress !== 'Adresse non renseignée' ? (
            <> du bien situé au <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text></>
          ) : ''}, reconnais avoir reçu de{' '}
          <Text style={{ fontWeight: 'bold' }}>{data.tenantName}</Text>, locataire dudit bien, la somme détaillée
          ci-dessous au titre du loyer et des charges pour la période concernée.
        </Text>

        {/* Tableau */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.tableHeaderText]}>Désignation</Text>
            <Text style={[styles.col2, styles.tableHeaderText]}>Période</Text>
            <Text style={[styles.col3, styles.tableHeaderText]}>Montant</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Loyer et charges</Text>
            <Text style={styles.col2}>Du {data.periodStart} au {data.periodEnd}</Text>
            <Text style={styles.col3}>{formatAmount(data.amount)} FCFA</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={[styles.col1, { fontWeight: 'bold' }]}>TOTAL ACQUITTÉ</Text>
            <Text style={styles.col2}></Text>
            <Text style={[styles.col3, { fontWeight: 'bold', fontSize: 10 }]}>
              {formatAmount(data.amount)} FCFA
            </Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Le Bailleur (Signature)</Text>
          {data.ownerSignature ? (
            <Image src={data.ownerSignature} style={styles.signature} />
          ) : (
            <Text style={styles.signaturePlaceholder}>(Signé électroniquement)</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré automatiquement par Dousell Immo pour {data.ownerName}.{'\n'}
          Pour faire valoir ce que de droit.
        </Text>
      </Page>
    </Document>
  );
};

// Export du type
export type { QuittanceData };

// Composant React pour compatibilité
export const QuittancePDF: React.FC<{ data: QuittanceData }> = ({ data }) => {
  return createQuittanceDocument(data);
};
