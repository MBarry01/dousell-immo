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

type ListingSubmittedEmailProps = {
  propertyTitle: string;
  propertyPrice: number;
  ownerEmail: string;
  serviceType: string;
  adminUrl: string;
};

export function ListingSubmittedEmail({
  propertyTitle,
  propertyPrice,
  ownerEmail,
  serviceType,
  adminUrl,
}: ListingSubmittedEmailProps) {
  const formattedPrice = new Intl.NumberFormat("fr-SN", {
    maximumFractionDigits: 0,
  }).format(propertyPrice);

  return (
    <Html>
      <Head />
      <Preview>Nouvelle annonce en attente de validation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Dousell Immo</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Nouvelle annonce en attente de validation</Heading>
            <Text style={text}>
              Une nouvelle annonce de particulier nécessite votre validation.
            </Text>
            <Section style={details}>
              <Text style={label}>Titre :</Text>
              <Text style={value}>{propertyTitle}</Text>
              <Text style={label}>Prix :</Text>
              <Text style={value}>{formattedPrice} FCFA</Text>
              <Text style={label}>Propriétaire :</Text>
              <Text style={value}>{ownerEmail}</Text>
              <Text style={label}>Service :</Text>
              <Text style={value}>{serviceType}</Text>
            </Section>
            <Section style={buttonContainer}>
              <Link href={adminUrl} style={button}>
                Voir l&apos;annonce
              </Link>
            </Section>
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
  margin: "0 0 24px",
};

const details = {
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const label = {
  color: "#666666",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "8px 0 4px",
};

const value = {
  color: "#05080c",
  fontSize: "16px",
  margin: "0 0 16px",
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

const footer = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#999999",
  fontSize: "12px",
  margin: "0",
};

