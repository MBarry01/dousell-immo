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

// Styles similaires à QuittancePDF_v2 avec couleur dorée pour la caution
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
        borderBottomColor: '#B8860B', // Or foncé pour la caution
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
        backgroundColor: '#FFF8E1', // Fond or clair
        padding: 6,
        border: '1px solid #B8860B',
        color: '#8B6914',
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
        borderColor: '#B8860B',
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
    amountBlock: {
        backgroundColor: '#FFF8E1',
        border: '2px solid #B8860B',
        borderRadius: 6,
        padding: 15,
        marginVertical: 12,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 9,
        color: '#8B6914',
        textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    amountValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#8B6914',
        marginBottom: 5,
    },
    amountDetail: {
        fontSize: 8,
        color: '#666',
    },
    legalNotice: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: 4,
        padding: 10,
        marginTop: 10,
    },
    legalNoticeTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    legalNoticeText: {
        fontSize: 7,
        color: '#555',
        lineHeight: 1.4,
        textAlign: 'justify',
    },
    signatureBlock: {
        marginTop: 15,
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
export const createDepositReceiptDocument = (data: DepositReceiptData) => {
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
                        <Text style={styles.companyInfo}>Reçu N°</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3, color: '#B8860B' }}>
                            {data.receiptNumber}
                        </Text>
                        <Text style={styles.companyInfo}>Date d&apos;émission</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{today}</Text>
                    </View>
                </View>

                {/* Titre */}
                <Text style={styles.title}>REÇU DE DÉPÔT DE GARANTIE (CAUTION)</Text>

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
                        {data.tenantEmail && (
                            <Text style={styles.boxText}>{data.tenantEmail}</Text>
                        )}
                        {data.tenantPhone && (
                            <Text style={styles.boxText}>{data.tenantPhone}</Text>
                        )}
                    </View>
                </View>

                {/* Adresse du bien */}
                {data.propertyAddress && (
                    <View style={styles.propertyInfo}>
                        <Text>
                            <Text style={{ fontWeight: 'bold' }}>Bien concerné : </Text>
                            {data.propertyAddress}
                        </Text>
                        <Text style={{ marginTop: 3 }}>
                            <Text style={{ fontWeight: 'bold' }}>Début du bail : </Text>
                            {data.leaseStartDate}
                        </Text>
                    </View>
                )}

                {/* Texte de reconnaissance */}
                <Text style={styles.legalText}>
                    Je soussigné(e) <Text style={{ fontWeight: 'bold' }}>{data.ownerName}</Text>, propriétaire ou mandataire
                    du bien situé au <Text style={{ fontWeight: 'bold' }}>{data.propertyAddress}</Text>, reconnais avoir reçu de{' '}
                    <Text style={{ fontWeight: 'bold' }}>{data.tenantName}</Text> la somme ci-dessous à titre de dépôt de garantie
                    (caution) conformément au contrat de bail.
                </Text>

                {/* Bloc montant principal */}
                <View style={styles.amountBlock}>
                    <Text style={styles.amountLabel}>Montant du dépôt de garantie</Text>
                    <Text style={styles.amountValue}>{formatAmount(data.depositAmount)} FCFA</Text>
                    <Text style={styles.amountDetail}>
                        ({data.depositMonths} mois × {formatAmount(data.monthlyRent)} FCFA de loyer mensuel)
                    </Text>
                </View>

                {/* Mentions légales */}
                <View style={styles.legalNotice}>
                    <Text style={styles.legalNoticeTitle}>Conditions de restitution</Text>
                    <Text style={styles.legalNoticeText}>
                        Ce dépôt de garantie sera restitué au locataire à la fin du bail, dans un délai maximum de deux mois
                        suivant la remise des clés, déduction faite, le cas échéant, des sommes restant dues au bailleur et des
                        sommes dont celui-ci pourrait être tenu en lieu et place du locataire, sous réserve qu&apos;elles soient
                        dûment justifiées (réparations locatives, loyers impayés, charges...).
                    </Text>
                    <Text style={[styles.legalNoticeText, { marginTop: 5 }]}>
                        L&apos;état des lieux de sortie servira de base à la comparaison avec l&apos;état des lieux d&apos;entrée
                        pour déterminer les éventuelles retenues.
                    </Text>
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
                    Document généré automatiquement par Dousel pour {data.ownerName}.{'\n'}
                    Ce reçu fait foi de la réception du dépôt de garantie pour le bien mentionné ci-dessus.
                </Text>
            </Page>
        </Document>
    );
};

// Export du type
export type { DepositReceiptData };

// Composant React pour compatibilité
export const DepositReceiptPDF: React.FC<{ data: DepositReceiptData }> = ({ data }) => {
    return createDepositReceiptDocument(data);
};
