import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AccessApprovedProps {
  userName: string;
  permissionLabel?: string;
  expiresAt: string;
  reviewerName: string;
  reviewNotes?: string;
  teamName: string;
  dashboardUrl: string;
}

/**
 * AccessApproved - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function AccessApproved({
  userName = "Jean Dupont",
  permissionLabel = "Édition des baux",
  expiresAt = "25 Février 2026 à 14:00",
  reviewerName = "Marie Martin",
  reviewNotes,
  teamName = "Dousel",
  dashboardUrl = "https://dousel.com/gestion",
}: AccessApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>Accès temporaire accordé ✅</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>Dousel</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Accès temporaire accordé</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Votre demande d'accès pour <strong>{permissionLabel}</strong> a été approuvée par {reviewerName}.
            </Text>

            {/* Encadré Validité - Aplat Gris Clair */}
            <Section style={validityBox}>
              <Text style={validityText}>
                <strong>Validité :</strong> Expire le {expiresAt}.
              </Text>
            </Section>

            {/* Note du responsable - Citation discrète */}
            {reviewNotes && (
              <Section style={quoteBox}>
                <Text style={quoteText}>"{reviewNotes}"</Text>
              </Section>
            )}

            <Section style={buttonAction}>
              <Button style={button} href={dashboardUrl}>
                Accéder au tableau de bord
              </Button>
            </Section>

            <Text style={textSubtle}>
              Cet accès est temporaire et sera révoqué automatiquement à la date d'expiration mentionnée ci-dessus.
            </Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer - Mentions légales et signature */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
            </Text>
            <Text style={footerLink}>
              Mentions légales • Politique de confidentialité
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessApproved;

// Styles Inline pour compatibilité maximale
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

const validityBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #f4f4f5",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "32px 0",
};

const validityText = {
  color: "#18181b",
  fontSize: "14px",
  margin: "0",
};

const quoteBox = {
  borderLeft: "2px solid #e4e4e7",
  paddingLeft: "20px",
  margin: "24px 0",
};

const quoteText = {
  color: "#71717a",
  fontSize: "14px",
  fontStyle: "italic" as const,
  margin: "0",
};

const buttonAction = {
  textAlign: "center" as const,
  marginTop: "40px",
  marginBottom: "40px",
};

const button = {
  backgroundColor: "#0f172a", // Navy Anthracite
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const textSubtle = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  marginTop: "24px",
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
