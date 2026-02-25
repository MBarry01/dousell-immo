import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface StandardNotificationEmailProps {
    title: string;
    previewText?: string;
    greeting?: string;
    mainContent: string;
    ctaText?: string;
    ctaUrl?: string;
    footerText?: string;
}

/**
 * StandardNotificationEmail - Template polyvalent pour les notifications simples
 * Design Minimaliste SaaS
 */
export function StandardNotificationEmail({
    title = "Notification Doussel Immo",
    previewText = "Vous avez une nouvelle notification",
    greeting = "Bonjour,",
    mainContent = "Ceci est une notification automatique de votre plateforme immobilière.",
    ctaText,
    ctaUrl,
    footerText = "L'équipe Doussel Immo",
}: StandardNotificationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Text style={h1}>{title}</Text>

                        <Text style={text}>{greeting}</Text>

                        <Text style={text}>{mainContent}</Text>

                        {/* Button Action if provided */}
                        {ctaText && ctaUrl && (
                            <Section style={buttonAction}>
                                <Button style={button} href={ctaUrl}>
                                    {ctaText}
                                </Button>
                            </Section>
                        )}
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            Cordialement,<br />
                            <strong>{footerText}</strong>
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

export default StandardNotificationEmail;

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
    fontSize: "20px",
    fontWeight: "600" as const,
    marginBottom: "24px",
    marginTop: "0",
};

const text = {
    color: "#3f3f46",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "20px",
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
    padding: "12px 32px",
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
