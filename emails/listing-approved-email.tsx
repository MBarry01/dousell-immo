import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from "@react-email/components";

type ListingApprovedEmailProps = {
  propertyTitle: string;
  propertyUrl: string;
  isPaid?: boolean;
  invoiceNumber?: string;
  hasInvoice?: boolean;
  propertyType?: string;
  transactionType?: string;
  price?: number;
  region?: string;
  city?: string;
  address?: string;
  paymentAmount?: number;
  serviceName?: string;
  teamName?: string;
};

/**
 * ListingApprovedEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function ListingApprovedEmail({
  propertyTitle = "Villa de Luxe aux Almadies",
  propertyUrl = "https://dousell-immo.app/biens/1",
  isPaid = false,
  invoiceNumber,
  hasInvoice = false,
  propertyType = "Villa",
  transactionType = "Vente",
  price = 250000000,
  region = "Dakar",
  city = "Dakar",
  address = "Almadies",
  paymentAmount,
  serviceName,
  teamName = "Doussel Immo",
}: ListingApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre annonce est en ligne — {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Votre annonce est en ligne</Heading>

            <Text style={text}>
              Félicitations ! Votre annonce <strong>"{propertyTitle}"</strong> a été validée par notre équipe et est désormais visible sur la plateforme.
            </Text>

            {/* Carte de l'annonce - Aplat Gris Clair */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>DÉTAILS DE L'ANNONCE</Text>

              <Section style={gridRow}>
                <Section style={gridCol}>
                  <Text style={label}>Type</Text>
                  <Text style={value}>{propertyType}</Text>
                </Section>
                <Section style={gridCol}>
                  <Text style={label}>Transaction</Text>
                  <Text style={value}>{transactionType}</Text>
                </Section>
              </Section>

              <Section style={gridRow}>
                <Section style={gridCol}>
                  <Text style={label}>Prix</Text>
                  <Text style={valuePrice}>
                    {price ? price.toLocaleString("fr-SN") + " FCFA" : "Prix non spécifié"}
                  </Text>
                </Section>
                <Section style={gridCol}>
                  <Text style={label}>Localisation</Text>
                  <Text style={value}>
                    {[city, region].filter(Boolean).join(", ") || "Sénégal"}
                  </Text>
                </Section>
              </Section>
            </Section>

            {/* Section Paiement (si applicable) */}
            {isPaid && (
              <Section style={receiptBox}>
                <Text style={detailsTitle}>REÇU DE PAIEMENT</Text>
                <Text style={receiptText}>
                  <strong>Service :</strong> {serviceName || "Option Visibilité"}<br />
                  <strong>Montant :</strong> {(paymentAmount || 0).toLocaleString("fr-SN")} FCFA<br />
                  <strong>Référence :</strong> {invoiceNumber || "N/A"}
                </Text>
                {hasInvoice && (
                  <Text style={infoText}>
                    📎 La facture détaillée est jointe à cet email au format PDF.
                  </Text>
                )}
              </Section>
            )}

            <Section style={buttonAction}>
              <Button style={button} href={propertyUrl}>
                Voir mon annonce
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Aide :</strong> Besoin de modifier votre annonce ? Connectez-vous à votre tableau de bord pour effectuer vos changements à tout moment.
              </Text>
            </Section>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section style={footer}>
            <Section style={footerContacts}>
              <Text style={footerContactText}>Besoin d'aide ?</Text>
              <Text style={footerPhone}>🇸🇳 +221 77 138 52 81</Text>
            </Section>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
            </Text>
            <Text style={footerLink}>
              Doussel Immo — Plateforme Immobilière
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ListingApprovedEmail;

// Styles Inline
const main = {
  backgroundColor: "#ffffff",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  paddingBottom: "20px",
};

const logo = {
  fontSize: "14px",
  fontWeight: "bold" as const,
  letterSpacing: "1px",
  color: "#18181b",
  margin: "0",
};

const hrSubtle = {
  borderColor: "#f4f4f5",
  margin: "0",
};

const content = {
  padding: "40px 0",
};

const h1 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "600" as const,
  marginBottom: "32px",
  marginTop: "0",
};

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "20px",
};

const detailsBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #f4f4f5",
  borderRadius: "6px",
  padding: "24px",
  margin: "32px 0",
};

const detailsTitle = {
  color: "#71717a",
  fontSize: "11px",
  fontWeight: "600" as const,
  letterSpacing: "0.05em",
  marginBottom: "16px",
  marginTop: "0",
};

const gridRow = {
  display: "table",
  width: "100%",
  marginBottom: "16px",
};

const gridCol = {
  display: "table-cell",
  width: "50%",
  verticalAlign: "top",
};

const label = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const value = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "500" as const,
  margin: "0",
};

const valuePrice = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "700" as const,
  margin: "0",
};

const receiptBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #f1f5f9",
  borderRadius: "6px",
  padding: "24px",
  margin: "32px 0",
};

const receiptText = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const buttonAction = {
  textAlign: "center" as const,
  marginTop: "40px",
  marginBottom: "40px",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  borderLeft: "2px solid #e2e8f0",
  padding: "16px 20px",
  margin: "32px 0",
};

const infoText = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const footer = {
  paddingTop: "32px",
  textAlign: "center" as const,
};

const footerContacts = {
  marginBottom: "24px",
};

const footerContactText = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const footerPhone = {
  color: "#71717a",
  fontSize: "13px",
  fontWeight: "500" as const,
  margin: "0",
};

const footerText = {
  color: "#a1a1aa",
  fontSize: "12px",
  marginBottom: "8px",
  marginTop: "0",
};

const footerLink = {
  color: "#a1a1aa",
  fontSize: "11px",
  margin: "0",
};
