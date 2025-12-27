import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface QuittanceData {
  // Locataire
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;

  // Montants
  amount: number;

  // Période
  periodMonth: string;
  periodStart: string;
  periodEnd: string;

  // Référence
  receiptNumber: string;

  // Propriétaire
  ownerName: string;
  ownerAddress: string;
  ownerNinea?: string;
  ownerLogo?: string;
  ownerSignature?: string;

  // Propriété
  propertyAddress: string;
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },

  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
  },

  // Titre
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
    backgroundColor: '#f9f9f9',
    padding: 15,
    border: '1px solid #eee',
  },

  // Blocs d'infos
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  box: {
    width: '48%',
    padding: 15,
    border: '1px solid #ddd',
    borderRadius: 4,
  },
  boxHighlight: {
    width: '48%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#F4C430',
    borderRadius: 4,
    backgroundColor: '#fffdf5',
  },
  boxTitle: {
    fontSize: 9,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  boxName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  boxText: {
    fontSize: 10,
    color: '#555',
    marginBottom: 3,
  },

  // Propriété
  propertyInfo: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
    fontSize: 10,
  },

  // Tableau
  table: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontWeight: 'bold',
  },
  col1: { width: '40%', fontSize: 10 },
  col2: { width: '30%', fontSize: 10, textAlign: 'right' },
  col3: { width: '30%', fontSize: 10, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 9,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Texte légal
  legalText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 30,
    textAlign: 'justify',
  },

  // Signature
  signatureBlock: {
    marginTop: 40,
    alignItems: 'flex-end',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signature: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 9,
    color: '#ccc',
    fontStyle: 'italic',
    marginTop: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
});

// Export du type pour pouvoir l'utiliser ailleurs
export type { QuittanceData };

// Fonction helper pour formater les montants
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(amount);
};

// Fonction pour générer le Document PDF (pour l'API)
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
            <Text style={styles.companyInfo}>{data.ownerAddress}</Text>
            {data.ownerNinea && (
              <Text style={styles.companyInfo}>NINEA: {data.ownerNinea}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>Quittance N°</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>
              {data.receiptNumber}
            </Text>
            <Text style={styles.companyInfo}>Date d'émission</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{today}</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>QUITTANCE DE LOYER</Text>

        {/* Blocs d'infos */}
        <View style={styles.infoBlock}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bailleur / Mandataire</Text>
            <Text style={styles.boxName}>{data.ownerName}</Text>
            <Text style={styles.boxText}>{data.ownerAddress}</Text>
          </View>
          <View style={styles.boxHighlight}>
            <Text style={[styles.boxTitle, { color: '#B8860B' }]}>Locataire</Text>
            <Text style={styles.boxName}>{data.tenantName}</Text>
            {data.tenantAddress && (
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

        {/* Adresse du bien */}
        <View style={styles.propertyInfo}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Adresse du bien loué : </Text>
            {data.propertyAddress}
          </Text>
        </View>

        {/* Texte légal */}
        <Text style={styles.legalText}>
          Je soussigné(e) <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou mandataire du bien
          situé au <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text>, reconnais avoir reçu de{' '}
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
            <Text style={[styles.col3, { fontWeight: 'bold', fontSize: 12 }]}>
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

export const QuittancePDF: React.FC<{ data: QuittanceData }> = ({ data }) => {
  return createQuittanceDocument(data);
};

// Ancienne version (gardée pour compatibilité)
const QuittancePDFOld: React.FC<{ data: QuittanceData }> = ({ data }) => {
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
            <Text style={styles.companyInfo}>{data.ownerAddress}</Text>
            {data.ownerNinea && (
              <Text style={styles.companyInfo}>NINEA: {data.ownerNinea}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>Quittance N°</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>
              {data.receiptNumber}
            </Text>
            <Text style={styles.companyInfo}>Date d'émission</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{today}</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>QUITTANCE DE LOYER</Text>

        {/* Blocs d'infos */}
        <View style={styles.infoBlock}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bailleur / Mandataire</Text>
            <Text style={styles.boxName}>{data.ownerName}</Text>
            <Text style={styles.boxText}>{data.ownerAddress}</Text>
          </View>
          <View style={styles.boxHighlight}>
            <Text style={[styles.boxTitle, { color: '#B8860B' }]}>Locataire</Text>
            <Text style={styles.boxName}>{data.tenantName}</Text>
            {data.tenantAddress && (
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

        {/* Adresse du bien */}
        <View style={styles.propertyInfo}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Adresse du bien loué : </Text>
            {data.propertyAddress}
          </Text>
        </View>

        {/* Texte légal */}
        <Text style={styles.legalText}>
          Je soussigné(e) <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou mandataire du bien
          situé au <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text>, reconnais avoir reçu de{' '}
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
            <Text style={[styles.col3, { fontWeight: 'bold', fontSize: 12 }]}>
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
