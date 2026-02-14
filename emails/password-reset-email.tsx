import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
} from "@react-email/components";
import React from "react";

interface PasswordResetEmailProps {
    userName: string;
    resetUrl: string;
}

export function PasswordResetEmail({
    userName,
    resetUrl,
}: PasswordResetEmailProps) {
    return (
        <Html lang="fr">
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>Doussel Immo</Text>
                        <Text style={tagline}>Votre partenaire immobilier à Dakar</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={title}>Réinitialisation de votre mot de passe 🔒</Text>

                        <Text style={text}>
                            Bonjour <strong>{userName}</strong>,
                        </Text>

                        <Text style={text}>
                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Doussel Immo.
                            Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={resetUrl}>
                                Changer mon mot de passe
                            </Button>
                        </Section>

                        <Text style={text}>
                            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre
                            navigateur :
                        </Text>

                        <Text style={link}>{resetUrl}</Text>

                        <Hr style={hr} />

                        <Text style={footer}>
                            Ce lien est valide pendant 60 minutes. Si vous n&apos;avez pas demandé de
                            réinitialisation de mot de passe, vous pouvez ignorer cet email en toute sécurité.
                            Votre mot de passe actuel restera inchangé.
                        </Text>

                        <Text style={footer}>
                            Pour toute question, contactez-nous à{" "}
                            <a href="mailto:support@dousell-immo.app" style={linkStyle}>
                                support@dousell-immo.app
                            </a>
                        </Text>
                    </Section>

                    <Section style={footerSection}>
                        <Text style={footerText}>
                            <strong>Doussel Immo</strong>
                        </Text>
                        <Text style={footerText}>Dakar, Sénégal</Text>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Doussel Immo. Tous droits réservés.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles (identiques à verification-email pour la cohérence)
const main = {
    backgroundColor: "#05080c",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "0",
    marginBottom: "64px",
    maxWidth: "600px",
    borderRadius: "8px",
    overflow: "hidden",
};

const header = {
    backgroundColor: "#f59e0b",
    padding: "32px 40px",
    textAlign: "center" as const,
};

const logo = {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
};

const tagline = {
    color: "#ffffff",
    fontSize: "14px",
    margin: "0",
    opacity: 0.9,
};

const content = {
    padding: "40px",
};

const title = {
    color: "#05080c",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 24px 0",
};

const text = {
    color: "#333333",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px 0",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#f59e0b",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 32px",
};

const link = {
    color: "#f59e0b",
    fontSize: "14px",
    wordBreak: "break-all" as const,
    margin: "16px 0",
};

const linkStyle = {
    color: "#f59e0b",
    textDecoration: "underline",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "32px 0",
};

const footer = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "16px 0 0 0",
};

const footerSection = {
    backgroundColor: "#f9fafb",
    padding: "24px 40px",
    textAlign: "center" as const,
};

const footerText = {
    color: "#666666",
    fontSize: "12px",
    margin: "4px 0",
};
