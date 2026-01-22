import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { PropertyProfitability } from '../expenses-actions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register a font (optional, using default Helvetica for now which supports basic French)
// For better support, we could register fonts like Roboto or Open Sans

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 5,
        color: '#0F172A',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        color: '#64748B',
    },
    section: {
        marginBottom: 10,
        padding: 10,
    },
    grid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 5,
        border: '1px solid #E2E8F0',
    },
    cardLabel: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    cardValueGreen: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    cardValueRed: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    table: {
        display: "flex",
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#E2E8F0',
        marginTop: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableColHeader: {
        width: "15%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        backgroundColor: '#F1F5F9',
        padding: 4,
    },
    tableCol: {
        width: "15%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 4,
    },
    tableColAddress: {
        width: "36%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 4,
    },
    tableColHeaderAddress: {
        width: "36%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        backgroundColor: '#F1F5F9',
        padding: 4,
    },
    tableCellHeader: {
        margin: "auto",
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        color: '#334155',
    },
    tableCellRight: {
        margin: "auto",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 'auto',
        marginRight: 0,
        fontSize: 9,
        color: '#334155',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    }
});

interface FinancialReportPDFProps {
    year: number;
    globalStats: {
        revenue: number;
        expenses: number;
        profit: number;
        margin: number;
    };
    properties: PropertyProfitability[];
}

const formatCurrency = (amount: number) => {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' FCFA';
};

export const FinancialReportPDF = ({ year, globalStats, properties }: FinancialReportPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>DOUSSEL IMMO</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>
                    Généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                </Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Rapport Financier Annuel</Text>
            <Text style={styles.subtitle}>Année {year}</Text>

            {/* Summary Cards */}
            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Revenus Totaux</Text>
                    <Text style={styles.cardValue}>{formatCurrency(globalStats.revenue)}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Dépenses Totales</Text>
                    <Text style={styles.cardValue}>{formatCurrency(globalStats.expenses)}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Bénéfice Net</Text>
                    <Text style={globalStats.profit >= 0 ? styles.cardValueGreen : styles.cardValueRed}>
                        {formatCurrency(globalStats.profit)}
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Marge Globale</Text>
                    <Text style={globalStats.margin >= 0 ? styles.cardValueGreen : styles.cardValueRed}>
                        {globalStats.margin.toFixed(1)}%
                    </Text>
                </View>
            </View>

            {/* Properties Table */}
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#0F172A' }}>
                Détail par Propriété
            </Text>

            <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableRow}>
                    <View style={styles.tableColHeaderAddress}>
                        <Text style={styles.tableCellHeader}>Propriété / Locataire</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Revenus</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Dépenses</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Bénéfice Net</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Marge</Text>
                    </View>
                </View>

                {/* Table Rows */}
                {properties.map((prop, index) => (
                    <View style={styles.tableRow} key={index}>
                        <View style={styles.tableColAddress}>
                            <Text style={styles.tableCell}>{prop.propertyAddress}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellRight}>{formatCurrency(prop.totalRevenue)}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellRight}>{formatCurrency(prop.totalExpenses)}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCellRight, color: prop.netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                                {formatCurrency(prop.netProfit)}
                            </Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCellRight, color: prop.profitMargin >= 0 ? '#10B981' : '#EF4444' }}>
                                {prop.profitMargin.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Doussel Immo - Gestion Locative Simplifiée</Text>
            </View>
        </Page>
    </Document>
);
