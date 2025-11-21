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
} from "@react-email/components";

type VisitRequestEmailProps = {
  fullName: string;
  phone: string;
  projectType: string;
  availability: string;
  message: string;
};

export default function VisitRequestEmail({
  fullName,
  phone,
  projectType,
  availability,
  message,
}: VisitRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle demande de visite Doussel Immo</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>Nouvelle demande de visite</Heading>
          <Text style={styles.text}>
            Une nouvelle demande vient d&apos;arriver depuis la conciergerie.
          </Text>
          <Section style={styles.card}>
            <Text style={styles.label}>Nom complet</Text>
            <Text style={styles.value}>{fullName}</Text>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{phone}</Text>
            <Text style={styles.label}>Type de projet</Text>
            <Text style={styles.value}>
              {projectType === "achat" ? "Achat" : "Location"}
            </Text>
            <Text style={styles.label}>Disponibilité</Text>
            <Text style={styles.value}>{availability}</Text>
            <Text style={styles.label}>Brief</Text>
            <Text style={styles.value}>{message}</Text>
          </Section>
          <Text style={styles.footer}>
            Merci de rappeler ce contact sous 30 minutes pour planifier la
            visite.
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
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "32px auto",
    padding: "32px",
    borderRadius: "24px",
    maxWidth: "600px",
    boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
  },
  title: {
    fontSize: "24px",
    marginBottom: "16px",
    color: "#0f172a",
  },
  text: {
    fontSize: "15px",
    color: "#475569",
  },
  card: {
    marginTop: "24px",
    padding: "20px",
    borderRadius: "20px",
    backgroundColor: "#f8fafc",
  },
  label: {
    marginTop: "12px",
    fontSize: "12px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  value: {
    fontSize: "15px",
    color: "#0f172a",
    marginTop: "2px",
  },
  footer: {
    marginTop: "24px",
    fontSize: "13px",
    color: "#94a3b8",
  },
};


