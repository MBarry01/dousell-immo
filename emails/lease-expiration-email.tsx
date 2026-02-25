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

interface LeaseExpirationEmailProps {
    monthsRemaining: 3 | 6;
    endDateStr: string;
    tenantName: string;
    propertyName: string;
    monthlyAmountFormatted: string;
    teamName?: string;
}

/**
 * LeaseExpirationEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export const LeaseExpirationEmail = ({
    monthsRemaining = 6,
    endDateStr = "01 Janvier 2027",
    tenantName = "Moussa Diop",
    propertyName = "Appartement Plateau",
    monthlyAmountFormatted = "450 000",
    teamName = "Doussel Immo",
}: LeaseExpirationEmailProps) => {
    const isUrgent = monthsRemaining <= 3;

    return (
        <Html lang="fr">
            <Head />
            <Preview>{`Alerte de fin de bail — ${monthsRemaining} mois restants`}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Fin de bail à l'horizon</Heading>

                        <Text style={text}>
                            Bonjour,
                        </Text>

                        <Text style={text}>
                            Le contrat de bail pour <strong>{propertyName}</strong> arrive à échéance dans {monthsRemaining} mois (le {endDateStr}).
                        </Text>

                        {/* Note Juridique - Aplat Gris */}
                        <Section style={infoBox}>
                            <Text style={infoTitle}>🇸🇳 CONTEXTE JURIDIQUE SÉNÉGALAIS</Text>
                            <Text style={infoText}>
                                {monthsRemaining === 6
                                    ? "Si vous souhaitez récupérer ce bien (congé pour reprise), la loi exige souvent un préavis de 6 mois signifié par huissier. C'est le moment idéal pour agir si vous ne souhaitez pas renouveler."
                                    : "Sans action de votre part, ce bail pourrait faire l'objet d'une tacite reconduction aux mêmes conditions. Il est recommandé d'initier les discussions de renouvellement dès maintenant."}
                            </Text>
                        </Section>

                        {/* Détails du Bail */}
                        <Section style={detailsBox}>
                            <Text style={detailsTitle}>DÉTAILS DU CONTRAT EN COURS</Text>

                            <Section style={detailsRow}>
                                <Text style={label}>Locataire</Text>
                                <Text style={value}>{tenantName}</Text>
                            </Section>

                            <Section style={detailsRow}>
                                <Text style={label}>Loyer mensuel</Text>
                                <Text style={value}>{monthlyAmountFormatted} FCFA</Text>
                            </Section>

                            <Section style={detailsRow}>
                                <Text style={label}>Échéance du contrat</Text>
                                <Text style={valueUrgent}>{endDateStr}</Text>
                            </Section>
                        </Section>

                        <Section style={buttonAction}>
                            <Button style={button} href="https://dousell-immo.app/gestion">
                                Gérer ce bail sur la plateforme
                            </Button>
                        </Section>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} {teamName} — Assistant de Gestion Locative
                        </Text>
                        <Text style={footerLink}>
                            Doussel Immo — Plateforme de Gestion Immobilière Intelligente
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default LeaseExpirationEmail;

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
    borderLeft: "2px solid #0f172a",
    padding: "16px 20px",
    margin: "32px 0",
};

const infoTitle = {
    color: "#18181b",
    fontSize: "11px",
    fontWeight: "700" as const,
    letterSpacing: "0.05em",
    marginBottom: "8px",
};

const infoText = {
    color: "#3f3f46",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0",
};

const detailsBox = {
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "24px",
    margin: "32px 0",
};

const detailsTitle = {
    color: "#71717a",
    fontSize: "11px",
    fontWeight: "600" as const,
    letterSpacing: "0.05em",
    marginBottom: "16px",
    marginTop: "0",
};

const detailsRow = {
    marginBottom: "12px",
};

const label = {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: "0 0 4px 0",
};

const value = {
    color: "#18181b",
    fontSize: "14px",
    fontWeight: "500" as const,
    margin: "0",
};

const valueUrgent = {
    color: "#0f172a", // On reste sobre même en cas d'urgence
    fontSize: "14px",
    fontWeight: "700" as const,
    margin: "0",
};

const buttonAction = {
    textAlign: "center" as const,
    marginTop: "32px",
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
