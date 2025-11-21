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
} from "@react-email/components";

type ListingRejectedEmailProps = {
  propertyTitle: string;
  rejectionReason: string;
  editUrl: string;
};

export function ListingRejectedEmail({
  propertyTitle,
  rejectionReason,
  editUrl,
}: ListingRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre annonce a été refusée</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Dousell Immo</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Annonce refusée</Heading>
            <Text style={text}>
              Votre annonce <strong>{propertyTitle}</strong> a été refusée lors de la modération.
            </Text>
            <Section style={alertBox}>
              <Text style={alertTitle}>Motif du refus :</Text>
              <Text style={alertText}>{rejectionReason}</Text>
            </Section>
            <Text style={text}>
              Vous pouvez modifier votre annonce pour corriger les points soulevés et la soumettre à nouveau.
            </Text>
            <Section style={buttonContainer}>
              <Link href={editUrl} style={button}>
                Modifier mon annonce
              </Link>
            </Section>
            <Text style={helpText}>
              Si vous avez des questions, n&apos;hésitez pas à nous contacter à{" "}
              <Link href="mailto:contact@dousell.immo" style={link}>
                contact@dousell.immo
              </Link>
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              Dousell Immo - L&apos;immobilier de confiance à Dakar
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#05080c",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#05080c",
  borderRadius: "8px 8px 0 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "32px 24px",
};

const h2 = {
  color: "#05080c",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#666666",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const alertBox = {
  backgroundColor: "#fee2e2",
  borderLeft: "4px solid #ef4444",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
};

const alertTitle = {
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const alertText = {
  color: "#7f1d1d",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#05080c",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const helpText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const link = {
  color: "#05080c",
  textDecoration: "underline",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#999999",
  fontSize: "12px",
  margin: "0",
};

