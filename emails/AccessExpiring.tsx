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

interface AccessExpiringProps {
  userName: string;
  permissionLabel?: string;
  expiresAt: string;
  hoursRemaining: number;
  teamName: string;
  requestUrl?: string;
}

/**
 * AccessExpiring - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function AccessExpiring({
  userName = "Jean Dupont",
  permissionLabel = "Édition des baux",
  expiresAt = "25 Février 2026 à 18:00",
  hoursRemaining = 1,
  teamName = "Dousel",
  requestUrl = "https://dousel.com/gestion",
}: AccessExpiringProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Votre accès expire dans ${hoursRemaining}h ⏰`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>Dousel</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Expiration imminente de l'accès</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Ceci est un rappel que votre accès temporaire pour <strong>{permissionLabel}</strong> expire bientôt.
            </Text>

            {/* Encadré Expiration - Aplat Gris Clair */}
            <Section style={validityBox}>
              <Text style={validityText}>
                <strong>Expiration :</strong> Aujourd'hui à {expiresAt.split(' à ')[1] || expiresAt} (dans environ {hoursRemaining} heure{hoursRemaining > 1 ? "s" : ""}).
              </Text>
            </Section>

            <Text style={text}>
              Après cette échéance, l'accès sera automatiquement révoqué. Pensez à finaliser vos tâches en cours.
            </Text>

            {requestUrl && (
              <Section style={buttonAction}>
                <Button style={button} href={requestUrl}>
                  Prolonger l'accès
                </Button>
              </Section>
            )}

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Note :</strong> Si vous avez besoin de cet accès de manière permanente, veuillez contacter un administrateur.
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
              Dousel — Plateforme de Gestion Immobilière
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessExpiring;

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
