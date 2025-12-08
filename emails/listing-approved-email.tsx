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
} from "@react-email/components";

type ListingApprovedEmailProps = {
  propertyTitle: string;
  propertyUrl: string;
  isPaid?: boolean;
  invoiceNumber?: string;
  hasInvoice?: boolean;
  // Détails de l'annonce
  propertyType?: string; // Type de bien (Appartement, Villa, etc.)
  transactionType?: string; // Vente, Location, etc.
  price?: number;
  // Localisation
  region?: string;
  city?: string; // Ville/Commune
  address?: string;
  // Paiement
  paymentAmount?: number;
  serviceName?: string;
};

export function ListingApprovedEmail({
  propertyTitle,
  propertyUrl,
  isPaid = false,
  invoiceNumber,
  hasInvoice = false,
  propertyType,
  transactionType,
  price,
  region,
  city,
  address,
  paymentAmount,
  serviceName,
}: ListingApprovedEmailProps) {
  return (
    <Html>
      <Head>
        <style>
          {`
            @media (prefers-color-scheme: dark) {
              .body { background-color: #18181b !important; }
              .container { background-color: #27272a !important; color: #ffffff !important; }
              .text { color: #d4d4d8 !important; }
              .heading { color: #ffffff !important; }
              .card { background-color: #3f3f46 !important; border-color: #52525b !important; }
              .label { color: #a1a1aa !important; }
              .value { color: #ffffff !important; }
              .divider { border-color: #52525b !important; }
              .receipt-card { background-color: #14532d !important; border-color: #166534 !important; }
              .receipt-text { color: #dcfce7 !important; }
              .receipt-value { color: #ffffff !important; }
            }
          `}
        </style>
      </Head>
      <Preview>Votre annonce est en ligne sur Dousell Immo</Preview>
      <Body style={main} className="body">
        <Container style={container} className="container">
          {/* Header avec Logo (Simulé par texte stylisé si image pas dispo, ou image externe) */}
          <Section style={header}>
            <Heading style={brandName}>Dousell Immo</Heading>
            <Text style={brandSubtitle}>L'immobilier de confiance</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2} className="heading">Félicitations ! 🎉</Heading>
            <Text style={paragraph} className="text">
              Votre annonce <strong>"{propertyTitle}"</strong> a été validée par notre équipe. Elle est désormais visible par des milliers de visiteurs potentiels.
            </Text>

            <Section style={card} className="card">
              <Heading style={cardTitle} className="heading">Détails de l'annonce</Heading>

              <div style={grid}>
                <div style={column}>
                  <Text style={label} className="label">Type de bien</Text>
                  <Text style={value} className="value">{propertyType || "Non spécifié"}</Text>
                </div>
                <div style={column}>
                  <Text style={label} className="label">Transaction</Text>
                  <Text style={value} className="value">{transactionType || "Non spécifié"}</Text>
                </div>
              </div>

              <div style={divider} className="divider"></div>

              <div style={grid}>
                <div style={column}>
                  <Text style={label} className="label">Prix</Text>
                  <Text style={valuePrice} className="value">{price ? price.toLocaleString("fr-SN") + " FCFA" : "Non spécifié"}</Text>
                </div>
                <div style={column}>
                  <Text style={label} className="label">Localisation</Text>
                  <Text style={value} className="value">
                    {[city, region].filter(Boolean).join(", ") || address || "Sénégal"}
                  </Text>
                </div>
              </div>
            </Section>

            <Section style={buttonContainer}>
              <Link href={propertyUrl} style={button}>
                Voir mon annonce en ligne
              </Link>
            </Section>

            {isPaid && (
              <Section style={receiptCard} className="receipt-card">
                <Heading style={receiptTitle} className="receipt-text">Reçu de paiement</Heading>
                <Text style={receiptRow}>
                  <span style={receiptLabel} className="receipt-text">Service :</span>
                  <span style={receiptValue} className="receipt-value">{serviceName || "Option Visibilité"}</span>
                </Text>
                <Text style={receiptRow}>
                  <span style={receiptLabel} className="receipt-text">Montant réglé :</span>
                  <span style={receiptValuePrice} className="receipt-value">{(paymentAmount || 0).toLocaleString("fr-SN")} FCFA</span>
                </Text>
                <Text style={receiptRow}>
                  <span style={receiptLabel} className="receipt-text">Référence :</span>
                  <span style={receiptValue} className="receipt-value">{invoiceNumber || "N/A"}</span>
                </Text>
                {hasInvoice && (
                  <Text style={attachmentNote}>
                    📎 La facture détaillée (PDF) est jointe à cet email.
                  </Text>
                )}
              </Section>
            )}

            <Text style={paragraph} className="text">
              Pour toute question ou modification, notre équipe support est à votre disposition.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerContact}>Besoin d'aide ? Contactez nos agents :</Text>
            <Text style={footerPhone}>🇫🇷 +33 07 51 08 15 79</Text>
            <Text style={footerPhone}>🇸🇳 +221 77 138 52 81</Text>
            <Text style={footerLinks}>
              <Link href="https://dousell-immo.com" style={link}>Site Web</Link> •{" "}
              <Link href="mailto:contact@doussel-immo.com" style={link}>Contact</Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Dousell Immo. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  borderRadius: "12px",
  overflow: "hidden",
  maxWidth: "600px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
};

const header = {
  backgroundColor: "#05080c",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const brandName = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "-0.5px",
};

const brandSubtitle = {
  color: "#fbbf24", // Amber-400
  fontSize: "14px",
  margin: "8px 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "2px",
};

const content = {
  padding: "40px 32px",
};

const h2 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#52525b",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const card = {
  backgroundColor: "#fafafa",
  borderRadius: "12px",
  border: "1px solid #e4e4e7",
  padding: "24px",
  margin: "0 0 32px",
};

const cardTitle = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const grid = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const column = {
  width: "48%",
};

const label = {
  color: "#71717a",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
  fontWeight: "500",
};

const value = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: "500",
  margin: "0",
};

const valuePrice = {
  color: "#05080c",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const divider = {
  borderTop: "1px solid #e4e4e7",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 40px",
};

const button = {
  backgroundColor: "#fbbf24", // Amber-400
  color: "#05080c",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "50px",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)",
};

const receiptCard = {
  backgroundColor: "#f0fdf4", // Green-50
  border: "1px solid #bbf7d0", // Green-200
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px",
};

const receiptTitle = {
  color: "#15803d", // Green-700
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
  display: "flex",
  alignItems: "center",
};

const receiptRow = {
  display: "flex",
  justifyContent: "space-between",
  margin: "8px 0",
  borderBottom: "1px dashed #bbf7d0",
  paddingBottom: "8px",
};

const receiptLabel = {
  color: "#166534", // Green-800
  fontSize: "14px",
};

const receiptValue = {
  color: "#14532d", // Green-900
  fontSize: "14px",
  fontWeight: "500",
  float: "right" as const,
};

const receiptValuePrice = {
  color: "#14532d",
  fontSize: "14px",
  fontWeight: "700",
  float: "right" as const,
};

const attachmentNote = {
  color: "#15803d",
  fontSize: "13px",
  fontStyle: "italic",
  marginTop: "16px",
  textAlign: "center" as const,
};

const footer = {
  backgroundColor: "#18181b",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const footerContact = {
  color: "#a1a1aa",
  fontSize: "14px",
  margin: "0 0 12px",
};

const footerPhone = {
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "500",
  margin: "4px 0",
};

const footerLinks = {
  margin: "24px 0",
  color: "#71717a",
  fontSize: "14px",
};

const link = {
  color: "#fbbf24",
  textDecoration: "none",
};

const footerCopyright = {
  color: "#52525b",
  fontSize: "12px",
  margin: "0",
};
