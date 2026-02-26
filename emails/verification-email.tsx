import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
  teamName?: string;
}

/**
 * VerificationEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 * Unifie Verification et Confirmation d'inscription
 */
export function VerificationEmail({
  userName = "Jean Dupont",
  verificationUrl = "https://dousel.com/auth/confirm",
  teamName = "Doussel Immo",
}: VerificationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Confirmez votre adresse email</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Merci de vous être inscrit sur <strong>{teamName}</strong>. Pour finaliser votre inscription et accéder à toutes nos fonctionnalités, veuillez confirmer votre adresse email.
            </Text>

            <Section style={buttonAction}>
              <Button style={button} href={verificationUrl}>
                Confirmer mon inscription
              </Button>
            </Section>

            <Text style={textSmall}>
              Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
            </Text>
            <Text style={linkText}>{verificationUrl}</Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Note :</strong> Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
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
              Doussel Immo — L'immobilier de confiance au Sénégal
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Composant Heading local (mimic @react-email/components/Heading if needed or use Text)
const Heading = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <Text style={style}>{children}</Text>
);

export default VerificationEmail;

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
  display: "block",
};

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "20px",
};

const textSmall = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  marginTop: "32px",
  marginBottom: "8px",
};

const linkText = {
  color: "#0f172a",
  fontSize: "12px",
  wordBreak: "break-all" as const,
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
  margin: "40px 0",
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











