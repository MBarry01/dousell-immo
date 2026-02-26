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

interface WelcomePackEmailProps {
    tenantName: string;
    propertyAddress: string;
    monthlyAmount: string;
    startDate: string;
    billingDay: number;
    inviteLink: string;
    documentsList: string[];
    ownerName: string;
    ownerAddress?: string;
}

/**
 * WelcomePackEmail - Template pour le pack de bienvenue locataire
 * Design Minimaliste SaaS
 */
export function WelcomePackEmail({
    tenantName = "Locataire",
    propertyAddress = "Adresse du bien",
    monthlyAmount = "150 000",
    startDate = "01/01/2026",
    billingDay = 5,
    inviteLink = "https://dousel.com/invite/test",
    documentsList = ["Contrat de bail", "Quittance 1 mois de loyer", "Reçu de caution"],

    ownerName = "M. Thiam",
    ownerAddress = "Dakar, Sénégal",
}: WelcomePackEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{`Bienvenue chez vous, ${tenantName} ! 🎉`}</Preview>

            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSEL</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Bienvenue dans votre nouveau foyer</Heading>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Text style={text}>
                            Nous sommes ravis de vous compter parmi nos locataires. Votre bail a été configuré avec succès pour le bien situé à <strong>{propertyAddress}</strong>.
                        </Text>

                        {/* Récapitulatif du bail */}
                        <Section style={infoBox}>
                            <Text style={infoTitle}>Récapitulatif de votre bail</Text>
                            <Section style={detailsGrid}>
                                <Text style={detailsItem}>
                                    <strong>Loyer mensuel :</strong> {monthlyAmount} FCFA
                                </Text>
                                <Text style={detailsItem}>
                                    <strong>Date de début :</strong> {startDate}
                                </Text>
                                <Text style={detailsItem}>
                                    <strong>Jour de paiement :</strong> Le {billingDay} de chaque mois
                                </Text>
                            </Section>
                        </Section>

                        {/* Accès Espace Locataire */}
                        <Section style={ctaSection}>
                            <Text style={text}>
                                Vous pouvez accéder dès maintenant à votre espace personnel pour suivre vos paiements et télécharger vos documents :
                            </Text>
                            <Section style={buttonAction}>
                                <Button style={button} href={inviteLink}>
                                    Accéder à mon espace
                                </Button>
                            </Section>
                        </Section>

                        {/* Documents joints */}
                        {documentsList.length > 0 && (
                            <Section style={docsSection}>
                                <Text style={docsTitle}>Documents inclus dans cet envoi :</Text>
                                <Section style={docsList}>
                                    {documentsList.map((doc, index) => (
                                        <Text key={index} style={docItem}>
                                            • {doc}
                                        </Text>
                                    ))}
                                </Section>
                            </Section>
                        )}
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            Cordialement,<br />
                            <strong>{ownerName}</strong><br />
                            {ownerAddress && <span style={ownerAddr}>{ownerAddress}</span>}
                        </Text>

                        <Section style={footerBottom}>
                            <Text style={footerTextSubtle}>
                                © {new Date().getFullYear()} Dousel — Écosystème Immobilier
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default WelcomePackEmail;

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

const infoBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "24px",
    margin: "32px 0",
};

const infoTitle = {
    fontSize: "14px",
    fontWeight: "bold" as const,
    color: "#18181b",
    marginBottom: "16px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
};

const detailsGrid = {
    fontSize: "14px",
};

const detailsItem = {
    color: "#3f3f46",
    margin: "4px 0",
};

const ctaSection = {
    margin: "40px 0",
};

const buttonAction = {
    textAlign: "center" as const,
    marginTop: "24px",
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

const docsSection = {
    marginTop: "32px",
};

const docsTitle = {
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "#18181b",
    marginBottom: "12px",
};

const docsList = {
    paddingLeft: "8px",
};

const docItem = {
    fontSize: "14px",
    color: "#71717a",
    margin: "4px 0",
};

const footer = {
    paddingTop: "32px",
};

const footerSignature = {
    color: "#18181b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 32px 0",
};

const ownerAddr = {
    color: "#71717a",
    fontSize: "13px",
};

const footerBottom = {
    textAlign: "center" as const,
    marginTop: "32px",
};

const footerTextSubtle = {
    color: "#a1a1aa",
    fontSize: "11px",
    margin: "0",
};
