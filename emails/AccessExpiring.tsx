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
  permission: string;
  permissionLabel?: string;
  expiresAt: string; // ISO date string
  hoursRemaining: number;
  teamName: string;
  requestUrl?: string;
}

/**
 * Email envoyé 1h avant l'expiration d'une permission temporaire
 */
export function AccessExpiring({
  userName = "Jean Dupont",
  permission = "leases.edit",
  permissionLabel = "Édition des baux",
  expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  hoursRemaining = 1,
  teamName = "Mon Équipe",
  requestUrl = "https://dousell.com/gestion",
}: AccessExpiringProps) {
  const expirationDate = new Date(expiresAt);
  const formattedTime = expirationDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Head />
      <Preview>
        {`Votre accès temporaire expire dans ${hoursRemaining}h`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⏰ Accès temporaire bientôt expiré</Heading>

          <Text style={text}>
            Bonjour {userName},
          </Text>

          <Text style={text}>
            Ceci est un rappel que votre accès temporaire à la fonctionnalité{" "}
            <strong>{permissionLabel || permission}</strong> expire bientôt.
          </Text>

          <Section style={expiringBox}>
            <div style={clockIcon}>⏰</div>
            <Text style={expiringLabel}>Expire dans</Text>
            <Text style={expiringValue}>
              {hoursRemaining < 1
                ? `${Math.round(hoursRemaining * 60)} minutes`
                : `${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""}`}
            </Text>
            <Text style={expiringTime}>à {formattedTime}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Après l'expiration, vous ne pourrez plus utiliser cette
            fonctionnalité. Pensez à terminer vos tâches en cours avant la
            date limite.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ <strong>Important :</strong> Sauvegardez votre travail en
              cours. L'accès sera automatiquement révoqué après l'expiration.
            </Text>
          </Section>

          {requestUrl && (
            <>
              <Text style={text}>
                Si vous avez besoin d'un accès prolongé, vous pouvez faire une
                nouvelle demande :
              </Text>

              <Section style={buttonContainer}>
                <Button style={button} href={requestUrl}>
                  Demander un accès prolongé
                </Button>
              </Section>
            </>
          )}

          <Section style={infoBox}>
            <Text style={infoText}>
              💡 <strong>Besoin d'un accès permanent ?</strong>
              <br />
              Si vous avez régulièrement besoin de cette fonctionnalité,
              contactez votre responsable d'équipe pour ajuster votre rôle de
              manière permanente.
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

export default AccessExpiring;

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

const expiringBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #f59e0b",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 40px",
  textAlign: "center" as const,
};

const clockIcon = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const expiringLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const expiringValue = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 4px 0",
};

const expiringTime = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 40px",
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

const buttonContainer = {
  padding: "24px 40px",
};

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
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

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 40px",
  marginTop: "32px",
};
