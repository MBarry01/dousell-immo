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

interface AccessRejectedProps {
  userName: string;
  permissionLabel?: string;
  reviewerName: string;
  reviewNotes?: string;
  teamName: string;
  contactUrl?: string;
}

/**
 * AccessRejected - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function AccessRejected({
  userName = "Jean Dupont",
  permissionLabel = "Édition des baux",
  reviewerName = "Marie Martin",
  reviewNotes,
  teamName = "Doussel Immo",
  contactUrl = "https://dousell-immo.app/gestion/equipe",
}: AccessRejectedProps) {
  return (
    <Html>
      <Head />
      <Preview>Mise à jour de votre demande d'accès</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Demande d'accès non approuvée</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Votre demande d'accès pour <strong>{permissionLabel}</strong> a été examinée par {reviewerName} et n'a pas pu être approuvée pour le moment.
            </Text>

            {/* Note du responsable - Citation discrète */}
            {reviewNotes && (
              <Section style={quoteBox}>
                <Text style={quoteText}>"{reviewNotes}"</Text>
              </Section>
            )}

            <Text style={text}>
              Si vous pensez que cet accès est nécessaire à votre activité, nous vous invitons à en discuter avec votre responsable d'équipe pour ajuster vos permissions.
            </Text>

            {contactUrl && (
              <Section style={buttonAction}>
                <Button style={button} href={contactUrl}>
                  Contacter l'équipe
                </Button>
              </Section>
            )}

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Aide :</strong> Vous pouvez également consulter la documentation interne sur la gestion des rôles et permissions.
              </Text>
            </Section>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
            </Text>
            <Text style={footerLink}>
              Doussel Immo — Plateforme de Gestion Immobilière
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessRejected;

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

const quoteBox = {
  borderLeft: "2px solid #e4e4e7",
  paddingLeft: "20px",
  margin: "32px 0",
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
