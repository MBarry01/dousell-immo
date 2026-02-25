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
  Button,
} from "@react-email/components";
import * as React from "react";

type VisitRequestEmailProps = {
  fullName: string;
  phone: string;
  projectType: string;
  availability: string;
  message: string;
  teamName?: string;
  adminUrl?: string;
};

/**
 * VisitRequestEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export default function VisitRequestEmail({
  fullName = "Jean Dupont",
  phone = "+221 77 000 00 00",
  projectType = "location",
  availability = "Samedi matin",
  message = "Je suis très intéressé par cet appartement, disponible pour une visite rapide.",
  teamName = "Doussel Immo",
  adminUrl = "https://dousell-immo.app/admin/visits",
}: VisitRequestEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Nouvelle demande de visite — {fullName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête discret */}
          <Section style={header}>
            <Text style={logo}>DOUSSEL IMMO</Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Corps de l'email */}
          <Section style={content}>
            <Heading style={h1}>Demande de visite reçue</Heading>

            <Text style={text}>
              Une nouvelle demande de visite a été soumise via la conciergerie digitale. Voici les détails du contact :
            </Text>

            {/* Carte Détails - Aplat Gris Clair */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>INFORMATIONS DU CONTACT</Text>

              <Section style={detailsRow}>
                <Text style={label}>Nom complet</Text>
                <Text style={value}>{fullName}</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Téléphone</Text>
                <Text style={value}>{phone}</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Type de projet</Text>
                <Text style={value}>
                  {projectType === "achat" ? "Achat immobilier" : "Location immobilière"}
                </Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Disponibilité souhaitée</Text>
                <Text style={value}>{availability}</Text>
              </Section>

              <Section style={detailsRow}>
                <Text style={label}>Brief / Message</Text>
                <Text style={valueMessage}>"{message}"</Text>
              </Section>
            </Section>

            <Section style={buttonAction}>
              <Button style={button} href={adminUrl}>
                Voir dans le tableau de bord
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Recommandation :</strong> Pour un taux de conversion optimal, nous conseillons de rappeler ce contact dans les 30 minutes suivant la réception de cette demande.
              </Text>
            </Section>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {teamName} — Conciergerie Immobilière
            </Text>
            <Text style={footerLink}>
              Doussel Immo — Plateforme de Gestion Locative & Vente
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
  padding: "24px",
  margin: "32px 0",
};

const detailsTitle = {
  color: "#71717a",
  fontSize: "11px",
  fontWeight: "600" as const,
  letterSpacing: "0.05em",
  marginBottom: "16px",
  marginTop: "0",
};

const detailsRow = {
  marginBottom: "16px",
};

const label = {
  color: "#a1a1aa",
  fontSize: "11px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px 0",
};

const value = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: "500" as const,
  margin: "0",
};

const valueMessage = {
  color: "#3f3f46",
  fontSize: "14px",
  fontStyle: "italic",
  lineHeight: "1.5",
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


