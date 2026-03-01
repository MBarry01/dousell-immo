import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface PreaviseData {
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;
  propertyAddress: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  noticeType: 'J-180' | 'J-90';
  noticeDate: string;
  noticeNumber: string;
  ownerName: string;
  ownerAddress: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerNinea?: string;
  ownerLogo?: string;
  ownerSignature?: string;
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
    lineHeight: 1.45,
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
    paddingBottom: 12,
    marginBottom: 4,
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

  // ─── Référence document ──────────────────────────────────
  docRef: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 16,
  },
  docRefText: {
    fontSize: 7.5,
    color: C.muted,
    textAlign: 'right',
  },

  // ─── Destinataire ────────────────────────────────────────
  recipientBlock: {
    marginBottom: 18,
  },
  recipientIntro: {
    fontSize: 8.5,
    color: C.mid,
    marginBottom: 3,
  },
  recipientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: C.black,
    marginBottom: 2,
  },
  recipientAddress: {
    fontSize: 8.5,
    color: C.dark,
  },

  // ─── Titre ───────────────────────────────────────────────
  titleWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  titleLine: {
    width: 40,
    height: 1,
    backgroundColor: C.gold,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 8,
    color: C.muted,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  titleLineBtm: {
    width: 40,
    height: 1,
    backgroundColor: C.gold,
    marginTop: 8,
  },

  // ─── Tableau récapitulatif bail ──────────────────────────
  infoBox: {
    backgroundColor: C.stripe,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 2,
    marginBottom: 14,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.mid,
    width: '38%',
  },
  infoValue: {
    fontSize: 8.5,
    color: C.dark,
    width: '62%',
  },

  // ─── Corps texte ─────────────────────────────────────────
  paragraph: {
    fontSize: 9,
    textAlign: 'justify',
    marginBottom: 10,
    lineHeight: 1.55,
    color: C.dark,
  },

  // ─── Encadré d'action requise ────────────────────────────
  actionBox: {
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.stripe,
    borderLeftWidth: 3,
    borderLeftColor: C.dark,
    borderRadius: 2,
  },
  actionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.black,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 8.5,
    color: C.dark,
    lineHeight: 1.5,
    textAlign: 'justify',
  },

  // ─── Référence légale ────────────────────────────────────
  legalRef: {
    fontSize: 7.5,
    color: C.muted,
    fontStyle: 'italic',
    marginBottom: 12,
  },

  // ─── Signatures ──────────────────────────────────────────
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 8.5,
    color: C.dark,
    marginBottom: 2,
  },
  signatureImage: {
    width: 100,
    height: 45,
    marginTop: 8,
    objectFit: 'contain',
  },
  signatureLine: {
    marginTop: 40,
    height: 1,
    backgroundColor: C.border,
  },
  signatureHint: {
    fontSize: 7,
    color: C.light,
    marginTop: 4,
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

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return d;
  }
};

const getContent = (data: PreaviseData) => {
  const isJ180 = data.noticeType === 'J-180';
  const endDateFR = fmtDate(data.endDate);

  return {
    title: isJ180 ? 'Préavis de congé pour reprise' : 'Notification de reconduction tacite',
    subject: isJ180
      ? 'Congé délivré six mois avant l\'échéance du bail'
      : 'Information locataire — trois mois avant l\'échéance',
    body: isJ180
      ? `Par la présente, je vous notifie ma décision de ne pas renouveler le bail de location portant sur le bien situé au ${data.propertyAddress}, dont l'échéance est fixée au ${endDateFR}.\n\nConformément aux dispositions de la loi sénégalaise n° 2014-22 du 24 février 2014 portant loi d'orientation sur l'habitat social, ainsi qu'aux articles pertinents du Code des Obligations Civiles et Commerciales (COCC), je vous informe de ma décision de reprendre les lieux loués à ladite échéance.\n\nLe présent préavis est délivré dans le respect du délai légal de six (6) mois avant l'échéance du bail, conformément à la législation en vigueur.`
      : `Je vous informe que le bail de location portant sur le bien situé au ${data.propertyAddress} arrive à échéance le ${endDateFR}.\n\nConformément aux dispositions de la loi sénégalaise n° 2014-22 du 24 février 2014 et aux articles du Code des Obligations Civiles et Commerciales (COCC), en l'absence de congé signifié dans les délais légaux, le bail sera automatiquement reconduit aux mêmes conditions.\n\nNous nous trouvons actuellement dans la période de trois (3) mois précédant l'échéance, durant laquelle il vous est possible de manifester votre intention quant au renouvellement du bail.`,
    action: isJ180
      ? `Vous êtes prié(e) de libérer les lieux au plus tard à la date d'échéance, soit le ${endDateFR}, et de restituer les clés au bailleur à cette date.`
      : `Si vous souhaitez donner congé ou négocier de nouvelles conditions, je vous invite à me contacter dans les meilleurs délais. À défaut de toute manifestation de votre part, le bail sera reconduit tacitement pour la même durée.`,
    legalRef: isJ180
      ? 'Référence : art. relatifs au préavis de congé — Loi n° 2014-22 du 24 février 2014 & COCC Sénégal'
      : 'Référence : art. relatifs à la reconduction tacite — Loi n° 2014-22 du 24 février 2014 & COCC Sénégal',
  };
};

// Intl.NumberFormat('fr-FR') génère \u202F (espace fine) non supporté par Helvetica → espace normale
const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const PreavisDocument = ({ data }: { data: PreaviseData }) => {
  const content = getContent(data);
  const fmtAmt = fmtNum(data.monthlyAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Bande d'accent */}
        <View style={styles.headerAccent} />

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {data.ownerLogo
              ? <Image src={data.ownerLogo} style={styles.logo} />
              : <Text style={styles.companyName}>{data.ownerName}</Text>}
            {data.ownerLogo && <Text style={styles.companyName}>{data.ownerName}</Text>}
            {data.ownerAddress && <Text style={styles.companyInfo}>{data.ownerAddress}</Text>}
            {data.ownerEmail && <Text style={styles.companyInfo}>{data.ownerEmail}</Text>}
            {data.ownerPhone && <Text style={styles.companyInfo}>{data.ownerPhone}</Text>}
            {data.ownerNinea && <Text style={styles.companyInfo}>NINEA : {data.ownerNinea}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>Réf. : {data.noticeNumber}</Text>
            <Text style={[styles.companyInfo, { marginTop: 2 }]}>
              Fait le {fmtDate(data.noticeDate)}
            </Text>
          </View>
        </View>

        {/* Destinataire */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientIntro}>À l'attention de :</Text>
          <Text style={styles.recipientName}>{data.tenantName}</Text>
          {data.tenantAddress && (
            <Text style={styles.recipientAddress}>{data.tenantAddress}</Text>
          )}
        </View>

        {/* Titre */}
        <View style={styles.titleWrapper}>
          <View style={styles.titleLine} />
          <Text style={styles.titleText}>{content.title}</Text>
          <Text style={styles.titleSub}>{content.subject}</Text>
          <View style={styles.titleLineBtm} />
        </View>

        {/* Récapitulatif bail */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bien loué :</Text>
            <Text style={styles.infoValue}>{data.propertyAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loyer mensuel :</Text>
            <Text style={styles.infoValue}>{fmtAmt} FCFA</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de début du bail :</Text>
            <Text style={styles.infoValue}>{fmtDate(data.startDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d'échéance :</Text>
            <Text style={styles.infoValue}>{fmtDate(data.endDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type de préavis :</Text>
            <Text style={styles.infoValue}>
              {data.noticeType === 'J-180'
                ? 'Six (6) mois — Congé pour reprise'
                : 'Trois (3) mois — Reconduction tacite'}
            </Text>
          </View>
        </View>

        {/* Corps */}
        <Text style={styles.paragraph}>{content.body}</Text>

        {/* Action requise */}
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Action requise</Text>
          <Text style={styles.actionText}>{content.action}</Text>
        </View>

        {/* Référence légale */}
        <Text style={styles.legalRef}>{content.legalRef}</Text>

        {/* Formule de politesse */}
        <Text style={styles.paragraph}>
          Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
        </Text>

        {/* Signatures */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Propriétaire</Text>
            <Text style={styles.signatureName}>{data.ownerName}</Text>
            {data.ownerSignature
              ? <Image src={data.ownerSignature} style={styles.signatureImage} />
              : <View style={styles.signatureLine} />}
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Locataire (pour réception)</Text>
            <Text style={styles.signatureName}>{data.tenantName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureHint}>Signature et date</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par Dousel — Conforme à la loi n° 2014-22 du 24 février 2014 et au Code des Obligations Civiles et Commerciales du Sénégal.
        </Text>
      </Page>
    </Document>
  );
};

export const createPreavisDocument = (data: PreaviseData) => {
  return <PreavisDocument data={data} />;
};
