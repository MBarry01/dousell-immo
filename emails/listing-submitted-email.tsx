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

type ListingSubmittedEmailProps = {
  propertyTitle: string;
  propertyPrice: number;
  ownerEmail: string;
  serviceType: string;
  adminUrl: string;
  teamName?: string;
};

/**
 * ListingSubmittedEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function ListingSubmittedEmail({
  propertyTitle = "Appartement de standing",
  propertyPrice = 750000,
  ownerEmail = "client@exemple.com",
  serviceType = "Standard",
  adminUrl = "https://dousell-immo.app/admin/listings/1",
  teamName = "Doussel Immo",
}: ListingSubmittedEmailProps) {
  const formattedPrice = new Intl.NumberFormat("fr-SN", {
    maximumFractionDigits: 0,
  }).format(propertyPrice);

  return (
    <Html>
      <Head />
      <Preview>Nouvelle annonce en attente — {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Nouvelle annonce à valider</Heading>

            <Text style={text}>
              Une nouvelle annonce a été soumise sur la plateforme et nécessite une revue de modération avant sa mise en ligne.
            </Text>

            {/* Carte Détails - Aplat Gris Clair */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>DÉTAILS DE LA SOUMISSION</Text>

              <Section style={detailsRow}>
                <Text style={label}>Titre :</Text>
                <Text style={value}>{propertyTitle}</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Prix :</Text>
                <Text style={valuePrice}>{formattedPrice} FCFA</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Soumis par :</Text>
                <Text style={value}>{ownerEmail}</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Service :</Text>
                <Text style={value}>{serviceType}</Text>
              </Section>
            </Section>

            <Section style={buttonAction}>
              <Button style={button} href={adminUrl}>
                Accéder à la modération
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Note :</strong> Pensez à vérifier la qualité des photos et la conformité de la description selon nos standards habituels.
              </Text>
            </Section>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Système de Modération
            </Text>
            <Text style={footerLink}>
              Doussel Immo Admin Panel
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ListingSubmittedEmail;

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

const detailsRow = {
  marginBottom: "12px",
};

const label = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "0 0 4px 0",
  display: "block",
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

