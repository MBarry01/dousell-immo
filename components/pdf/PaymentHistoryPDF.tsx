import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Types
interface PaymentHistoryData {
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyAddress: string;
    ownerName: string;
    ownerAddress: string;
    ownerNinea?: string;
    ownerLogo?: string;
    transactions: {
        id: string;
        period: string;
        amount: number;
        amountPaid: number;
        status: string;
        paidAt?: string | null;
    }[];
}

// Styles compacts pour tenir sur une page (basés sur QuittancePDF_v2)
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
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        backgroundColor: '#f9f9f9',
        padding: 6,
        border: '1px solid #eee',
    },
    infoBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
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
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    colPeriod: { width: '25%', fontSize: 8 },
    colAmount: { width: '15%', fontSize: 8, textAlign: 'right' },
    colPaid: { width: '15%', fontSize: 8, textAlign: 'right' },
    colDate: { width: '25%', fontSize: 8, textAlign: 'right' },
    colStatus: { width: '20%', fontSize: 8, textAlign: 'center' },

    tableHeaderText: {
        fontSize: 7,
        color: '#666',
        fontWeight: 'bold',
        textTransform: 'uppercase',
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
    statusBadge: {
        padding: '2 6',
        borderRadius: 8,
        fontSize: 7,
        textTransform: 'uppercase',
    },
});

// Helper pour formater les montants
const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
};

export const createPaymentHistoryDocument = (data: PaymentHistoryData) => {
    const today = new Date().toLocaleDateString('fr-FR');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#e6fffa'; // Light green bg
            case 'pending': return '#fffaf0'; // Light orange bg
            case 'overdue': return '#fff5f5'; // Light red bg
            default: return '#f7fafc';
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'paid': return '#2c7a7b'; // Dark green text
            case 'pending': return '#dd6b20'; // Dark orange text
            case 'overdue': return '#c53030'; // Dark red text
            default: return '#718096';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'PAYÉ';
            case 'pending': return 'EN ATTENTE';
            case 'overdue': return 'RETARD';
            default: return status;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* En-tête (Copie de QuittancePDF) */}
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
                        <Text style={styles.companyInfo}>Date d&apos;émission</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{today}</Text>
                    </View>
                </View>

                {/* Titre */}
                <Text style={styles.title}>HISTORIQUE DES PAIEMENTS</Text>

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
                        {data.propertyAddress && (
                            <Text style={styles.boxText}>{data.propertyAddress}</Text>
                        )}
                        {data.tenantEmail && (
                            <Text style={styles.boxText}>{data.tenantEmail}</Text>
                        )}
                        {data.tenantPhone && (
                            <Text style={styles.boxText}>{data.tenantPhone}</Text>
                        )}
                    </View>
                </View>

                {/* Tableau */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colPeriod, styles.tableHeaderText]}>Période</Text>
                        <Text style={[styles.colAmount, styles.tableHeaderText]}>Montant Dû</Text>
                        <Text style={[styles.colPaid, styles.tableHeaderText]}>Payé</Text>
                        <Text style={[styles.colDate, styles.tableHeaderText]}>Date Paiement</Text>
                        <Text style={[styles.colStatus, styles.tableHeaderText]}>Statut</Text>
                    </View>

                    {data.transactions.map((tx, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colPeriod}>{tx.period}</Text>
                            <Text style={styles.colAmount}>{formatAmount(tx.amount)}</Text>
                            <Text style={styles.colPaid}>{formatAmount(tx.amountPaid)}</Text>
                            <Text style={styles.colDate}>{tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('fr-FR') : '-'}</Text>
                            <View style={[styles.colStatus, {
                                backgroundColor: getStatusColor(tx.status),
                                borderRadius: 4,
                                paddingVertical: 1
                            }]}>
                                <Text style={{
                                    color: getStatusTextColor(tx.status),
                                    fontSize: 7,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    {getStatusLabel(tx.status)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Document généré automatiquement par Dousel pour {data.ownerName}.{'\n'}
                    Pour faire valoir ce que de droit.
                </Text>
            </Page>
        </Document>
    );
};

// Composant React pour compatibilité
export const PaymentHistoryPDF: React.FC<{ data: PaymentHistoryData }> = ({ data }) => {
    return createPaymentHistoryDocument(data);
};
