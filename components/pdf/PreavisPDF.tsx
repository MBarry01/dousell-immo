import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface PreaviseData {
  // Informations bail
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;
  propertyAddress: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;

  // Type de préavis
  noticeType: 'J-180' | 'J-90'; // 6 mois ou 3 mois
  noticeDate: string; // Date d'émission du préavis

  // Informations propriétaire
  ownerName: string;
  ownerAddress: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerNinea?: string;
  ownerLogo?: string;
  ownerSignature?: string;

  // Numéro unique
  noticeNumber: string;
}

// Styles professionnels pour document juridique
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
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyInfo: {
    fontSize: 7,
    color: '#666',
    marginBottom: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 12,
    textTransform: 'uppercase',
    textDecoration: 'underline',
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#333',
  },
  paragraph: {
    fontSize: 9,
    textAlign: 'justify',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '35%',
  },
  infoValue: {
    fontSize: 8,
    width: '65%',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 8,
    color: '#856404',
    lineHeight: 1.3,
  },
  legalText: {
    fontSize: 7,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 6,
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  signatureText: {
    fontSize: 8,
    marginBottom: 2,
  },
  signatureImage: {
    width: 100,
    height: 45,
    marginTop: 8,
    objectFit: 'contain',
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
    paddingTop: 6,
  },
});

// Contenu des préavis selon le type
const getNoticeContent = (data: PreaviseData) => {
  const isJ180 = data.noticeType === 'J-180';

  return {
    title: isJ180
      ? 'PRÉAVIS DE CONGÉ POUR REPRISE'
      : 'NOTIFICATION DE RECONDUCTION TACITE',

    subject: isJ180
      ? 'Notification de Congé - 6 mois avant échéance'
      : 'Reconduction du bail - 3 mois avant échéance',

    mainText: isJ180
      ? `Par la présente, je vous notifie mon intention de ne pas renouveler le bail de location concernant le bien situé ${data.propertyAddress}, dont le contrat arrivera à échéance le ${new Date(data.endDate).toLocaleDateString('fr-FR')}.

Conformément aux dispositions de la loi sénégalaise n° 2014-22 du 24 février 2014 portant loi d'orientation sur l'habitat social et aux articles du Code des Obligations Civiles et Commerciales (COCC), je vous informe par la présente de ma décision de reprendre les lieux loués.

Ce préavis respecte le délai légal de SIX (6) MOIS avant l'échéance du bail, comme l'exige la législation en vigueur.`

      : `Je vous informe que le bail de location concernant le bien situé ${data.propertyAddress} arrivera à échéance le ${new Date(data.endDate).toLocaleDateString('fr-FR')}.

Conformément aux dispositions de la loi sénégalaise n° 2014-22 du 24 février 2014 et aux articles du Code des Obligations Civiles et Commerciales (COCC), en l'absence de congé signifié dans les délais légaux, le bail sera automatiquement reconduit aux mêmes conditions.

Nous sommes dans le délai de TROIS (3) MOIS avant l'échéance, période durant laquelle vous pouvez encore manifester votre intention concernant le renouvellement du bail.`,

    actionRequired: isJ180
      ? `Vous êtes prié(e) de libérer les lieux au plus tard à la date d'échéance mentionnée ci-dessus, soit le ${new Date(data.endDate).toLocaleDateString('fr-FR')}.`
      : `Si vous souhaitez donner congé ou négocier de nouvelles conditions, veuillez me contacter dans les meilleurs délais. À défaut, le bail sera renouvelé tacitement pour la même durée.`,

    legalReference: isJ180
      ? 'Article relatif au préavis de congé - Loi n° 2014-22 du 24 février 2014 & COCC Sénégal'
      : 'Article relatif à la reconduction tacite - Loi n° 2014-22 du 24 février 2014 & COCC Sénégal'
  };
};

// Document PDF
const PreaviseDocument = ({ data }: { data: PreaviseData }) => {
  const content = getNoticeContent(data);
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(data.monthlyAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête avec logo */}
        <View style={styles.header}>
          <View>
            {data.ownerLogo ? (
              <Image src={data.ownerLogo} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{data.ownerName}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{data.ownerName}</Text>
            <Text style={styles.companyInfo}>{data.ownerAddress}</Text>
            {data.ownerEmail && <Text style={styles.companyInfo}>{data.ownerEmail}</Text>}
            {data.ownerPhone && <Text style={styles.companyInfo}>{data.ownerPhone}</Text>}
            {data.ownerNinea && <Text style={styles.companyInfo}>NINEA: {data.ownerNinea}</Text>}
          </View>
        </View>

        {/* Numéro et date */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 9, textAlign: 'right', color: '#666' }}>
            Préavis N° {data.noticeNumber}
          </Text>
          <Text style={{ fontSize: 9, textAlign: 'right', color: '#666' }}>
            Émis le {new Date(data.noticeDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Destinataire */}
        <View style={styles.section}>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>À l&apos;attention de :</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>{data.tenantName}</Text>
          {data.tenantAddress && <Text style={{ fontSize: 9 }}>{data.tenantAddress}</Text>}
        </View>

        {/* Titre */}
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subject}</Text>

        {/* Informations du bail */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bien loué :</Text>
            <Text style={styles.infoValue}>{data.propertyAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loyer mensuel :</Text>
            <Text style={styles.infoValue}>{formattedAmount} FCFA</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de début :</Text>
            <Text style={styles.infoValue}>{new Date(data.startDate).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d&apos;échéance :</Text>
            <Text style={styles.infoValue}>{new Date(data.endDate).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type de préavis :</Text>
            <Text style={styles.infoValue}>{data.noticeType === 'J-180' ? '6 mois (Congé pour reprise)' : '3 mois (Reconduction tacite)'}</Text>
          </View>
        </View>

        {/* Corps du préavis */}
        <Text style={styles.paragraph}>{content.mainText}</Text>

        {/* Action requise */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ ACTION REQUISE</Text>
          <Text style={styles.warningText}>{content.actionRequired}</Text>
        </View>

        {/* Référence légale */}
        <Text style={styles.legalText}>
          {content.legalReference}
        </Text>

        {/* Formule de politesse */}
        <Text style={styles.paragraph}>
          Je vous prie d&apos;agréer, Madame, Monsieur, l&apos;expression de mes salutations distinguées.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Propriétaire</Text>
            <Text style={styles.signatureText}>{data.ownerName}</Text>
            {data.ownerSignature && (
              <Image src={data.ownerSignature} style={styles.signatureImage} />
            )}
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Locataire (pour réception)</Text>
            <Text style={styles.signatureText}>{data.tenantName}</Text>
            <View style={{ height: 60, borderBottomWidth: 1, borderBottomColor: '#ddd', marginTop: 15 }} />
            <Text style={{ fontSize: 8, color: '#999', marginTop: 5 }}>Signature et date</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Document généré automatiquement par Dousel</Text>
          <Text>Conforme à la loi n° 2014-22 du 24 février 2014 & Code des Obligations Civiles et Commerciales du Sénégal</Text>
        </View>
      </Page>
    </Document>
  );
};

// Export de la fonction de création
export const createPreavisDocument = (data: PreaviseData) => {
  return <PreaviseDocument data={data} />;
};
