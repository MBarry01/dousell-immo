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

type ListingApprovedEmailProps = {
  propertyTitle: string;
  propertyUrl: string;
};

export function ListingApprovedEmail({
  propertyTitle,
  propertyUrl,
}: ListingApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Félicitations, votre bien est en ligne !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Dousell Immo</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h2}>🎉 Félicitations !</Heading>
            <Text style={text}>
              Votre annonce <strong>{propertyTitle}</strong> a été approuvée et est maintenant en ligne.
            </Text>
            <Text style={text}>
              Elle est désormais visible par tous les visiteurs de Dousell Immo et peut générer des contacts.
            </Text>
            <Section style={buttonContainer}>
              <Link href={propertyUrl} style={button}>
                Voir mon annonce
              </Link>
            </Section>
            <Text style={text}>
              Partagez votre annonce avec vos proches pour maximiser sa visibilité !
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#25D366",
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

