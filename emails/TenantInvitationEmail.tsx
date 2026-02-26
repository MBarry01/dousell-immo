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

interface TenantInvitationEmailProps {
    tenantName: string;
    propertyAddress: string;
    magicLink: string;
    ownerName: string;
}

/**
 * TenantInvitationEmail - Template pour invitation au portail locataire
 * Design Moderne & Sécurisant
 */
export function TenantInvitationEmail({
    tenantName = "Locataire",
    propertyAddress = "Adresse du bien",
    magicLink = "https://dousel.com/locataire/login?token=xyz",
    ownerName = "Propriétaire",
}: TenantInvitationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Invitation à votre Espace Locataire Dousel — {propertyAddress}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>Dousel</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Votre espace locataire est prêt</Heading>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Text style={text}>
                            <strong>{ownerName}</strong> vous invite à rejoindre votre espace locataire personnel pour le bien situé à :
                        </Text>

                        <Section style={addressBox}>
                            <Text style={addressText}>{propertyAddress}</Text>
                        </Section>

                        {/* Avantages de l'espace */}
                        <Section style={perksSection}>
                            <Text style={perkItem}>✅ Payer votre loyer en ligne en quelques clics</Text>
                            <Text style={perkItem}>✅ Télécharger vos quittances et documents</Text>
                            <Text style={perkItem}>✅ Signaler un incident ou besoin de maintenance</Text>
                        </Section>

                        <Section style={ctaSection}>
                            <Text style={text}>
                                Cliquez sur le bouton ci-dessous pour accéder à votre espace de manière sécurisée (sans mot de passe requis) :
                            </Text>
                            <Section style={buttonAction}>
                                <Button style={button} href={magicLink}>
                                    Accéder à mon espace
                                </Button>
                            </Section>
                            <Text style={tokenNote}>
                                Ce lien est personnel et expirera dans 7 jours par mesure de sécurité.
                            </Text>
                        </Section>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            À très vite sur Dousel,<br />
                            <strong>L'équipe Dousel</strong>
                        </Text>

                        <Section style={footerBottom}>
                            <Text style={footerTextSubtle}>
                                © {new Date().getFullYear()} Dousel — Simplifiez votre gestion locative
                            </Text>
                            <Text style={footerLink}>
                                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default TenantInvitationEmail;

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

const addressBox = {
    backgroundColor: "#f4f4f5",
    borderRadius: "6px",
    padding: "16px 20px",
    margin: "24px 0",
};

const addressText = {
    fontSize: "14px",
    color: "#18181b",
    fontWeight: "500" as const,
    margin: "0",
};

const perksSection = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "8px",
    padding: "20px",
    margin: "32px 0",
};

const perkItem = {
    fontSize: "14px",
    color: "#18181b",
    margin: "8px 0",
};

const ctaSection = {
    marginTop: "40px",
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

const tokenNote = {
    fontSize: "12px",
    color: "#a1a1aa",
    textAlign: "center" as const,
    marginTop: "16px",
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

const footerBottom = {
    textAlign: "center" as const,
    marginTop: "32px",
};

const footerTextSubtle = {
    color: "#a1a1aa",
    fontSize: "11px",
    margin: "0",
};

const footerLink = {
    color: "#d4d4d8",
    fontSize: "11px",
    marginTop: "8px",
};
