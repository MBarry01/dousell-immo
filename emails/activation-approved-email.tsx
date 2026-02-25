import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Button,
} from "@react-email/components";
import * as React from "react";

interface ActivationApprovedEmailProps {
    firstName: string;
    loginUrl?: string;
    teamName?: string;
}

/**
 * ActivationApprovedEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export const ActivationApprovedEmail = ({
    firstName = "Utilisateur",
    loginUrl = "https://dousell-immo.app/compte",
    teamName = "Doussel Immo",
}: ActivationApprovedEmailProps) => {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Félicitations ! Votre accès est activé 🎉 — {teamName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Bienvenue dans la Gestion Locative</Heading>

                        <Text style={text}>
                            Bonjour <strong>{firstName}</strong>,
                        </Text>

                        <Text style={text}>
                            Bonne nouvelle ! Votre demande d'activation de la <strong>Gestion Locative</strong> a été approuvée par notre équipe. Vous pouvez maintenant profiter de toute la puissance de notre plateforme.
                        </Text>

                        {/* Liste des fonctionnalités - Design épuré */}
                        <Section style={featureBox}>
                            <Text style={featureTitle}>CE QUE VOUS POUVEZ FAIRE DÉSORMAIS</Text>

                            <Section style={featureItem}>
                                <Text style={featureText}>• Création et gestion complète de vos biens et baux</Text>
                            </Section>
                            <Section style={featureItem}>
                                <Text style={featureText}>• Suivi automatisé des paiements et quittances</Text>
                            </Section>
                            <Section style={featureItem}>
                                <Text style={featureText}>• Gestion simplifiée de vos relations locataires</Text>
                            </Section>
                        </Section>

                        <Section style={buttonAction}>
                            <Button style={button} href={loginUrl}>
                                Accéder à mon espace gestion
                            </Button>
                        </Section>

                        <Text style={text}>
                            Nous sommes ravis de vous accompagner dans la digitalisation de votre patrimoine immobilier.
                        </Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} {teamName} — Dakar, Sénégal
                        </Text>
                        <Text style={footerLink}>
                            Doussel Immo — Votre partenaire immobilier de confiance
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default ActivationApprovedEmail;

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

const featureBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "24px",
    margin: "32px 0",
};

const featureTitle = {
    color: "#71717a",
    fontSize: "11px",
    fontWeight: "600" as const,
    letterSpacing: "0.05em",
    marginBottom: "16px",
    marginTop: "0",
};

const featureItem = {
    marginBottom: "8px",
};

const featureText = {
    color: "#18181b",
    fontSize: "14px",
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
