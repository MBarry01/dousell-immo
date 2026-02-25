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
} from "@react-email/components";
import * as React from "react";

interface ActivationRejectedEmailProps {
    firstName: string;
    reason: string;
    teamName?: string;
}

/**
 * ActivationRejectedEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export const ActivationRejectedEmail = ({
    firstName = "Utilisateur",
    reason = "Les documents fournis sont incomplets ou illisibles.",
    teamName = "Doussel Immo",
}: ActivationRejectedEmailProps) => {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Mise à jour de votre demande d'activation — {teamName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Mise à jour de votre demande</Heading>

                        <Text style={text}>
                            Bonjour <strong>{firstName}</strong>,
                        </Text>

                        <Text style={text}>
                            Nous avons examiné votre demande d'activation pour le service de Gestion Locative. Malheureusement, nous ne pouvons pas l'approuver pour le moment.
                        </Text>

                        {/* Encadré Motif - Aplat Gris Clair/Neutre */}
                        <Section style={reasonBox}>
                            <Text style={reasonTitle}>MOTIF DE LA DÉCISION</Text>
                            <Text style={reasonText}>
                                {reason}
                            </Text>
                        </Section>

                        <Text style={text}>
                            Vous pouvez soumettre une nouvelle demande en vous assurant de corriger les points mentionnés ci-dessus. Notre équipe se tient prête à réexaminer votre dossier dès réception des éléments manquants.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={infoText}>
                                <strong>Des questions ?</strong> Si vous estimez qu'il s'agit d'une erreur ou si vous avez besoin de précisions, n'hésitez pas à répondre directement à cet email.
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
                            Doussel Immo — Plateforme Immobilière Professionnelle
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default ActivationRejectedEmail;

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

const reasonBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "24px",
    margin: "32px 0",
};

const reasonTitle = {
    color: "#71717a",
    fontSize: "11px",
    fontWeight: "600" as const,
    letterSpacing: "0.05em",
    marginBottom: "12px",
    marginTop: "0",
};

const reasonText = {
    color: "#18181b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
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
