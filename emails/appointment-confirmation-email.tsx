"use client";

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

type AppointmentConfirmationEmailProps = {
  userName: string;
  date: string;
  time: string;
  meetingType: string;
  phone?: string;
};

export default function AppointmentConfirmationEmail({
  userName,
  date,
  time,
  meetingType,
  phone,
}: AppointmentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre rendez-vous Dousell Immo est confirmé - {date} à {time}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.checkmark}>✓</Text>
          <Heading style={styles.title}>Rendez-vous confirmé !</Heading>
          <Text style={styles.greeting}>
            Bonjour {userName},
          </Text>
          <Text style={styles.text}>
            Votre rendez-vous avec l&apos;équipe Dousell Immo est bien enregistré.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.label}>📅 DATE</Text>
            <Text style={styles.value}>{date}</Text>

            <Text style={styles.label}>🕐 HEURE</Text>
            <Text style={styles.value}>{time}</Text>

            <Text style={styles.label}>📍 TYPE</Text>
            <Text style={styles.value}>{meetingType}</Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.info}>
            Un conseiller Dousell vous contactera{phone ? ` au ${phone}` : ""} pour confirmer les détails de votre rendez-vous.
          </Text>

          <Text style={styles.footer}>
            À très bientôt !
          </Text>
          <Text style={styles.team}>
            L&apos;équipe Dousell Immo
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    margin: "0",
    padding: "0",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "32px auto",
    padding: "32px",
    borderRadius: "24px",
    maxWidth: "600px",
    boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
  },
  checkmark: {
    fontSize: "32px",
    textAlign: "center",
    margin: "0 0 16px 0",
  },
  title: {
    fontSize: "24px",
    marginBottom: "16px",
    color: "#0f172a",
    textAlign: "center",
  },
  greeting: {
    fontSize: "16px",
    color: "#0f172a",
    marginBottom: "8px",
  },
  text: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: "1.5",
  },
  card: {
    marginTop: "24px",
    marginBottom: "24px",
    padding: "20px",
    borderRadius: "16px",
    backgroundColor: "#fef9e7",
    border: "1px solid #F4C430",
  },
  label: {
    fontSize: "11px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#94a3b8",
    margin: "12px 0 2px 0",
  },
  value: {
    fontSize: "16px",
    color: "#0f172a",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "24px 0",
  },
  info: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
  },
  footer: {
    marginTop: "24px",
    fontSize: "14px",
    color: "#0f172a",
    textAlign: "center",
  },
  team: {
    fontSize: "14px",
    color: "#F4C430",
    fontWeight: "600",
    textAlign: "center",
    margin: "4px 0 0 0",
  },
};
