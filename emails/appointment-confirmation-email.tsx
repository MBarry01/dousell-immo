import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

type AppointmentConfirmationEmailProps = {
  userName: string;
  date: string;
  time: string;
  meetingType: string;
  phone?: string;
  location?: string;
  teamName?: string;
};

/**
 * AppointmentConfirmationEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export default function AppointmentConfirmationEmail({
  userName = "Jean Dupont",
  date = "25 Février 2026",
  time = "14:00",
  meetingType = "Visite Immobilière",
  phone,
  location,
  teamName = "Dousel",
}: AppointmentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirmation de votre rendez-vous — {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>Dousel</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Rendez-vous confirmé</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Nous vous confirmons que votre rendez-vous avec l'équipe <strong>{teamName}</strong> est bien enregistré.
            </Text>

            {/* Encadré Détails - Aplat Gris Clair */}
            <Section style={detailsBox}>
              <Text style={detailsText}>
                <strong>Date :</strong> {date}
              </Text>
              <Text style={detailsText}>
                <strong>Heure :</strong> {time}
              </Text>
              <Text style={detailsText}>
                <strong>Type :</strong> {meetingType}
              </Text>
              {location && (
                <Text style={detailsText}>
                  <strong>Lieu :</strong> {location}
                </Text>
              )}
            </Section>

            <Text style={text}>
              Un conseiller vous contactera{phone ? ` au ${phone}` : ""} en cas de besoin pour affiner les derniers détails.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Note :</strong> En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance pour nous permettre de réorganiser notre planning.
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
              Dousel — Votre partenaire immobilier
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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
  marginBottom: "8px",
  marginTop: "0",
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
