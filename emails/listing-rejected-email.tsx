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

type ListingRejectedEmailProps = {
  propertyTitle: string;
  rejectionReason: string;
  editUrl: string;
  teamName?: string;
};

/**
 * ListingRejectedEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function ListingRejectedEmail({
  propertyTitle = "Villa avec vue sur mer",
  rejectionReason = "Les photos sont de trop basse qualité et ne respectent pas nos standards de visibilité.",
  editUrl = "https://dousell-immo.app/gestion/biens/edit/1",
  teamName = "Doussel Immo",
}: ListingRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action requise : Votre annonce a été refusée — {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Action requise pour votre annonce</Heading>

            <Text style={text}>
              Bonjour,
            </Text>

            <Text style={text}>
              Votre annonce <strong>"{propertyTitle}"</strong> a été examinée par notre équipe de modération. Malheureusement, elle ne peut pas être publiée en l'état.
            </Text>

            {/* Encadré Motif - Aplat Gris Clair / Bordure Neutre */}
            <Section style={reasonBox}>
              <Text style={reasonTitle}>MOTIF DU REFUS</Text>
              <Text style={reasonText}>
                {rejectionReason}
              </Text>
            </Section>

            <Text style={text}>
              Ne vous inquiétez pas, il vous suffit de corriger les points mentionnés ci-dessus et de soumettre à nouveau votre annonce pour validation.
            </Text>

            <Section style={buttonAction}>
              <Button style={button} href={editUrl}>
                Modifier mon annonce
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Conseil :</strong> Des photos lumineuses et une description détaillée augmentent vos chances de validation rapide et de vente.
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
              Doussel Immo — Plateforme Immobilière Professionnelle
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ListingRejectedEmail;

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

const reasonBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #f4f4f5",
  borderRadius: "6px",
  padding: "24px",
  margin: "32px 0",
};

const reasonTitle = {
  color: "#71717a",
  fontSize: "11px",
  fontWeight: "600" as const,
  letterSpacing: "0.05em",
  marginBottom: "12px",
  marginTop: "0",
};

const reasonText = {
  color: "#18181b",
  fontSize: "14px",
  lineHeight: "1.6",
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

