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
  permission: string;
  reason?: string;
  teamName: string;
  reviewUrl: string;
}

/**
 * Email envoyé aux owners/managers quand un membre demande un accès temporaire
 */
export function AccessRequestNotification({
  requesterName = "Jean Dupont",
  requesterEmail = "jean.dupont@example.com",
  permission = "leases.edit",
  reason = "Je dois corriger une erreur de saisie dans le bail",
  teamName = "Mon Équipe",
  reviewUrl = "https://dousell.com/gestion/access-control",
}: AccessRequestNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Nouvelle demande d'accès temporaire de {requesterName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔑 Nouvelle demande d'accès</Heading>

          <Text style={text}>
            <strong>{requesterName}</strong> ({requesterEmail}) a demandé un
            accès temporaire à une fonctionnalité de votre équipe{" "}
            <strong>{teamName}</strong>.
          </Text>

          <Section style={permissionBox}>
            <Text style={permissionLabel}>Permission demandée</Text>
            <Text style={permissionValue}>{permission}</Text>
          </Section>

          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Raison</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            En tant que responsable de l'équipe, vous pouvez approuver ou
            rejeter cette demande.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={reviewUrl}>
              Traiter la demande
            </Button>
          </Section>

          <Text style={footer}>
            Vous recevez cet email car vous êtes responsable de l'équipe{" "}
            {teamName} sur Dousell Immo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessRequestNotification;

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
};

const permissionBox = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 40px",
};

const permissionLabel = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
};

const permissionValue = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  fontFamily: "monospace",
  margin: "0",
};

const reasonBox = {
  backgroundColor: "#fafafa",
  borderLeft: "4px solid #3b82f6",
  padding: "16px",
  margin: "16px 40px",
};

const reasonLabel = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#3f3f46",
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
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 40px",
  marginTop: "32px",
};
