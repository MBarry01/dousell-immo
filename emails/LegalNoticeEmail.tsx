import {
    Body,
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

interface LegalNoticeEmailProps {
    tenantName: string;
    propertyAddress: string;
    noticeType: "termination" | "formal_notice" | "general";
    noticeTitle: string;
    mainContent: string;
    effectiveDate?: string;
    senderName: string;
    senderAddress?: string;
}

/**
 * LegalNoticeEmail - Template pour préavis, mises en demeure et actes juridiques
 * Design Sobre & Professionnel
 */
export function LegalNoticeEmail({
    tenantName = "Locataire",
    propertyAddress = "123 Rue de la République, Dakar",
    noticeType = "general",
    noticeTitle = "Notification Importante",
    mainContent = "Ceci est une notification officielle concernant votre bail.",
    effectiveDate,
    senderName = "Service de Gestion",
    senderAddress = "Dakar, Sénégal",
}: LegalNoticeEmailProps) {
    const getNoticeColor = () => {
        switch (noticeType) {
            case "termination": return "#dc2626"; // Rouge
            case "formal_notice": return "#ea580c"; // Orange
            default: return "#18181b"; // Noir
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{noticeTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO — GESTION JURIDIQUE</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={{ ...h1, color: getNoticeColor() }}>
                            {noticeTitle}
                        </Heading>

                        <Section style={recipientBox}>
                            <Text style={recipientText}>
                                <strong>À l'attention de :</strong> {tenantName}<br />
                                <strong>Concerne le bien situé au :</strong> {propertyAddress}
                            </Text>
                        </Section>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Section style={mainContentSection}>
                            <Text style={text}>{mainContent}</Text>
                        </Section>

                        {effectiveDate && (
                            <Section style={highlightBox}>
                                <Text style={highlightText}>
                                    <strong>Date d'effet :</strong> {effectiveDate}
                                </Text>
                            </Section>
                        )}

                        <Text style={textSubtle}>
                            Cette notification vous est envoyée par voie électronique conformément aux conditions générales de votre contrat de gestion. Nous vous recommandons d'en conserver une copie pour vos archives.
                        </Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            Fait à Dakar, le {new Date().toLocaleDateString('fr-FR')}<br /><br />
                            <strong>{senderName}</strong><br />
                            {senderAddress && <span style={senderAddr}>{senderAddress}</span>}
                        </Text>

                        <Section style={footerBottom}>
                            <Text style={footerTextSubtle}>
                                © {new Date().getFullYear()} Doussel Immo — Conformité Locative
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default LegalNoticeEmail;

// Styles Inline
const main = {
    backgroundColor: "#ffffff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "600px",
    border: "1px solid #f4f4f5",
    borderRadius: "8px",
};

const header = {
    paddingBottom: "20px",
};

const logo = {
    fontSize: "12px",
    fontWeight: "bold" as const,
    letterSpacing: "2px",
    color: "#a1a1aa",
    margin: "0",
    textTransform: "uppercase" as const,
};

const hrSubtle = {
    borderColor: "#f4f4f5",
    margin: "0",
};

const content = {
    padding: "40px 0",
};

const h1 = {
    fontSize: "22px",
    fontWeight: "700" as const,
    marginBottom: "32px",
    marginTop: "0",
    lineHeight: "1.3",
};

const recipientBox = {
    marginBottom: "32px",
    padding: "16px",
    backgroundColor: "#fafafa",
    borderRadius: "4px",
};

const recipientText = {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#3f3f46",
    margin: "0",
};

const text = {
    color: "#18181b",
    fontSize: "15px",
    lineHeight: "1.7",
    marginBottom: "20px",
};

const mainContentSection = {
    marginTop: "24px",
};

const highlightBox = {
    borderLeft: "4px solid #18181b",
    backgroundColor: "#f4f4f5",
    padding: "16px 20px",
    margin: "32px 0",
};

const highlightText = {
    fontSize: "15px",
    color: "#18181b",
    margin: "0",
};

const textSubtle = {
    color: "#71717a",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "40px",
    fontStyle: "italic" as const,
};

const footer = {
    paddingTop: "32px",
};

const footerSignature = {
    color: "#18181b",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 32px 0",
};

const senderAddr = {
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
