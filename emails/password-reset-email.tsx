import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
    Heading,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
    userName: string;
    resetUrl: string;
    teamName?: string;
}

/**
 * PasswordResetEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export function PasswordResetEmail({
    userName = "Jean Dupont",
    resetUrl = "https://dousel.com/auth/reset-password",
    teamName = "Doussel Immo",
}: PasswordResetEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Réinitialisation de votre mot de passe</Heading>

                        <Text style={text}>Bonjour {userName},</Text>

                        <Text style={text}>
                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>{teamName}</strong>. Si vous êtes à l'origine de cette demande, vous pouvez définir un nouveau mot de passe en cliquant sur le bouton ci-dessous.
                        </Text>

                        <Section style={buttonAction}>
                            <Button style={button} href={resetUrl}>
                                Réinitialiser mon mot de passe
                            </Button>
                        </Section>

                        <Text style={textSmall}>
                            Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
                        </Text>
                        <Text style={linkText}>{resetUrl}</Text>

                        <Section style={infoBox}>
                            <Text style={infoText}>
                                <strong>Sécurité :</strong> Ce lien est valable pendant 60 minutes. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel ne sera pas modifié.
                            </Text>
                        </Section>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
                        </Text>
                        <Text style={footerLink}>
                            Doussel Immo — Sécurité de votre compte
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default PasswordResetEmail;

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

const textSmall = {
    color: "#71717a",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "32px",
    marginBottom: "8px",
};

const linkText = {
    color: "#0f172a",
    fontSize: "12px",
    wordBreak: "break-all" as const,
    margin: "0",
};

const buttonAction = {
    textAlign: "center" as const,
    marginTop: "40px",
    marginBottom: "40px",
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

const infoBox = {
    backgroundColor: "#f8fafc",
    borderLeft: "2px solid #e2e8f0",
    padding: "16px 20px",
    margin: "32px 0",
};

const infoText = {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0",
};

const footer = {
    paddingTop: "32px",
    textAlign: "center" as const,
};

const footerText = {
    color: "#a1a1aa",
    fontSize: "12px",
    marginBottom: "8px",
    marginTop: "0",
};

const footerLink = {
    color: "#a1a1aa",
    fontSize: "11px",
    margin: "0",
};
