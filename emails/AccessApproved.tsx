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
  permission: string;
  permissionLabel?: string;
  expiresAt: string; // ISO date string
  durationHours: number;
  reviewerName: string;
  reviewNotes?: string;
  teamName: string;
  dashboardUrl: string;
}

/**
 * Email envoyé au membre quand sa demande d'accès est approuvée
 */
export function AccessApproved({
  userName = "Jean Dupont",
  permission = "leases.edit",
  permissionLabel = "Édition des baux",
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  durationHours = 24,
  reviewerName = "Marie Martin",
  reviewNotes,
  teamName = "Mon Équipe",
  dashboardUrl = "https://dousell.com/gestion",
}: AccessApprovedProps) {
  const expirationDate = new Date(expiresAt);
  const formattedDate = expirationDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Head />
      <Preview>
        Votre demande d&apos;accès temporaire a été approuvée ✅
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Accès temporaire accordé</Heading>

          <Text style={text}>
            Bonjour {userName},
          </Text>

          <Text style={text}>
            Bonne nouvelle ! Votre demande d&apos;accès temporaire a été{" "}
            <strong style={{ color: "#10b981" }}>approuvée</strong> par{" "}
            {reviewerName}.
          </Text>

          <Section style={accessBox}>
            <div style={accessIcon}>🔓</div>
            <Text style={accessLabel}>Permission accordée</Text>
            <Text style={accessValue}>
              {permissionLabel || permission}
            </Text>
            <Text style={accessDuration}>
              Valable pendant {durationHours} heure{durationHours > 1 ? "s" : ""}
            </Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoLabel}>⏰ Date d&apos;expiration</Text>
            <Text style={infoValue}>{formattedDate}</Text>
          </Section>

          {reviewNotes && (
            <Section style={notesBox}>
              <Text style={notesLabel}>📝 Note du responsable</Text>
              <Text style={notesText}>{reviewNotes}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            Vous pouvez maintenant utiliser cette fonctionnalité jusqu&apos;à la date
            d&apos;expiration. Après cette date, l&apos;accès sera automatiquement révoqué.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Accéder au tableau de bord
            </Button>
          </Section>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ <strong>Important :</strong> Cet accès est temporaire et expire
              automatiquement. Si vous avez besoin d&apos;un accès prolongé, contactez
              votre responsable d&apos;équipe.
            </Text>
          </Section>

          <Text style={footer}>
            Équipe {teamName} - Dousell Immo
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessApproved;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 40px",
};

const text = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "16px 0",
};

const accessBox = {
  backgroundColor: "#f0fdf4",
  border: "2px solid #10b981",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 40px",
  textAlign: "center" as const,
};

const accessIcon = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const accessLabel = {
  color: "#059669",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const accessValue = {
  color: "#18181b",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const accessDuration = {
  color: "#059669",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const infoBox = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 40px",
};

const infoLabel = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};

const infoValue = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const notesBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "16px",
  margin: "16px 40px",
  borderRadius: "4px",
};

const notesLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const notesText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  fontStyle: "italic" as const,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 40px",
};

const buttonContainer = {
  padding: "24px 40px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const warningBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  padding: "16px",
  margin: "24px 40px",
  borderRadius: "4px",
};

const warningText = {
  color: "#7f1d1d",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 40px",
  marginTop: "32px",
};
