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

interface LeaseRenewalEmailProps {
    tenantName: string;
    propertyAddress: string;
    currentEndDate: string;
    newEndDate: string;
    newMonthlyAmount: string;
    acceptanceLink: string;
    ownerName: string;
    ownerAddress?: string;
}

/**
 * LeaseRenewalEmail - Template pour proposition de renouvellement de bail
 * Design Minimaliste SaaS
 */
export function LeaseRenewalEmail({
    tenantName = "Locataire",
    propertyAddress = "Adresse du bien",
    currentEndDate = "31/12/2025",
    newEndDate = "31/12/2026",
    newMonthlyAmount = "150 000",
    acceptanceLink = "https://dousell-immo.app/locataire/renouvellement",
    ownerName = "Propriétaire",
    ownerAddress = "Dakar, Sénégal",
}: LeaseRenewalEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{`Votre bail pour ${propertyAddress} est renouvelé !`}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Renouvellement de votre bail</Heading>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Text style={text}>
                            Votre contrat de bail pour le bien situé à <strong>{propertyAddress}</strong> arrive à échéance le {currentEndDate}. Nous avons le plaisir de vous proposer son renouvellement.
                        </Text>

                        {/* Détails du renouvellement */}
                        <Section style={renewalBox}>
                            <Text style={renewalTitle}>Nouvelles conditions proposées</Text>
                            <Section style={detailsGrid}>
                                <Text style={detailsItem}>
                                    <strong>Nouvelle date de fin :</strong> {newEndDate}
                                </Text>
                                <Text style={detailsItem}>
                                    <strong>Nouveau loyer mensuel :</strong> {newMonthlyAmount} FCFA
                                </Text>
                            </Section>
                        </Section>

                        <Text style={text}>
                            Si ces conditions vous conviennent, vous pouvez valider le renouvellement directement en ligne en cliquant sur le bouton ci-dessous :
                        </Text>

                        <Section style={buttonAction}>
                            <Button style={button} href={acceptanceLink}>
                                Valider le renouvellement
                            </Button>
                        </Section>

                        <Text style={textSubtle}>
                            Une fois validé, votre nouveau contrat sera généré automatiquement et disponible dans votre espace locataire.
                        </Text>
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
                                © {new Date().getFullYear()} Doussel Immo — Écosystème Immobilier
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default LeaseRenewalEmail;

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

const renewalBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "24px",
    margin: "32px 0",
};

const renewalTitle = {
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
    margin: "6px 0",
};

const buttonAction = {
    textAlign: "center" as const,
    marginTop: "32px",
    marginBottom: "32px",
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

const textSubtle = {
    color: "#71717a",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "24px",
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
