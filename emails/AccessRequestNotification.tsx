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

interface AccessRequestNotificationProps {
  requesterName: string;
  requesterEmail: string;
  permissionLabel?: string;
  reason?: string;
  teamName: string;
  reviewUrl: string;
}

/**
 * AccessRequestNotification - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function AccessRequestNotification({
  requesterName = "Jean Dupont",
  requesterEmail = "jean.dupont@example.com",
  permissionLabel = "Édition des baux",
  reason = "Je dois corriger une erreur de saisie dans le bail",
  teamName = "Mon Équipe",
  reviewUrl = "https://dousel.com/gestion/access-control",
}: AccessRequestNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle demande d'accès de {requesterName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>Dousel</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Nouvelle demande d'accès</Heading>

            <Text style={text}>
              <strong>{requesterName}</strong> ({requesterEmail}) a demandé un accès temporaire à une fonctionnalité de votre équipe <strong>{teamName}</strong>.
            </Text>

            {/* Encadré Détails - Aplat Gris Clair */}
            <Section style={detailsBox}>
              <Text style={detailsText}>
                <strong>Permission :</strong> {permissionLabel}
              </Text>
            </Section>

            {/* Raison - Citation discrète */}
            {reason && (
              <Section style={quoteBox}>
                <Text style={quoteText}>"{reason}"</Text>
              </Section>
            )}

            <Text style={text}>
              En tant que responsable, vous pouvez examiner les détails de cette demande et décider de l'approuver ou de la rejeter.
            </Text>

            <Section style={buttonAction}>
              <Button style={button} href={reviewUrl}>
                Examiner la demande
              </Button>
            </Section>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
            </Text>
            <Text style={footerLink}>
              Dousel — Notification Système
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessRequestNotification;

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
  padding: "16px 20px",
  margin: "32px 0",
};

const detailsText = {
  color: "#18181b",
  fontSize: "14px",
  margin: "0",
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
