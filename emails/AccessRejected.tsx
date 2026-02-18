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
  permission: string;
  permissionLabel?: string;
  reviewerName: string;
  reviewNotes?: string;
  teamName: string;
  contactUrl?: string;
}

/**
 * Email envoyé au membre quand sa demande d'accès est rejetée
 */
export function AccessRejected({
  userName = "Jean Dupont",
  permission = "leases.edit",
  permissionLabel = "Édition des baux",
  reviewerName = "Marie Martin",
  reviewNotes,
  teamName = "Mon Équipe",
  contactUrl = "https://dousell.com/gestion/equipe",
}: AccessRejectedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Votre demande d&apos;accès temporaire a été refusée
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Demande d&apos;accès refusée</Heading>

          <Text style={text}>
            Bonjour {userName},
          </Text>

          <Text style={text}>
            Votre demande d&apos;accès temporaire à la fonctionnalité{" "}
            <strong>{permissionLabel || permission}</strong> a été examinée par{" "}
            {reviewerName} et n&apos;a pas pu être approuvée pour le moment.
          </Text>

          {reviewNotes && (
            <Section style={notesBox}>
              <Text style={notesLabel}>💬 Raison du refus</Text>
              <Text style={notesText}>{reviewNotes}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            Si vous pensez avoir besoin de cet accès de manière permanente,
            nous vous recommandons de discuter avec votre responsable d&apos;équipe
            pour éventuellement ajuster votre rôle.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              💡 <strong>Besoin d&apos;aide ?</strong>
              <br />
              Contactez votre responsable d&apos;équipe pour en savoir plus sur
              les raisons du refus ou pour demander un ajustement de vos
              permissions permanentes.
            </Text>
          </Section>

          {contactUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={contactUrl}>
                Contacter mon équipe
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Équipe {teamName} - Dousell Immo
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccessRejected;

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

const notesBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  padding: "16px",
  margin: "24px 40px",
  borderRadius: "4px",
};

const notesLabel = {
  color: "#7f1d1d",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const notesText = {
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 40px",
};

const infoBox = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 40px",
};

const infoText = {
  color: "#1e40af",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
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
