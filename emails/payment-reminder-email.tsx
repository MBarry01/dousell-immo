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

interface PaymentReminderEmailProps {
    tenantName: string;
    amountFormatted: string;
    dueDateStr: string;
    propertyId?: string;
    teamName?: string;
}

/**
 * PaymentReminderEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export const PaymentReminderEmail = ({
    tenantName = "Locataire",
    amountFormatted = "250 000",
    dueDateStr = "05 Janvier 2026",
    teamName = "Doussel Immo",
}: PaymentReminderEmailProps) => {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Rappel : Loyer en attente de règlement — {amountFormatted} FCFA</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Rappel de paiement</Heading>

                        <Text style={text}>
                            Bonjour <strong>{tenantName}</strong>,
                        </Text>

                        <Text style={text}>
                            Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de votre loyer d'un montant de <strong>{amountFormatted} FCFA</strong>, dont l'échéance était le {dueDateStr}.
                        </Text>

                        {/* Note Importante / Relance */}
                        <Section style={infoBox}>
                            <Text style={infoText}>
                                Nous vous prions de bien vouloir régulariser votre situation dans les meilleurs délais via votre espace locataire ou par virement bancaire habituel.
                            </Text>
                        </Section>

                        <Section style={buttonAction}>
                            <Button style={button} href="https://dousel.com/locataire">
                                Régulariser mon paiement
                            </Button>
                        </Section>

                        <Text style={textSmall}>
                            Si vous avez déjà effectué ce paiement dans les dernières 48 heures, merci de ne pas tenir compte de ce message automatique.
                        </Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} {teamName} — Service de Gestion Locative
                        </Text>
                        <Text style={footerLink}>
                            Doussel Immo — Dakar, Sénégal
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default PaymentReminderEmail;

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
    fontStyle: "italic",
    marginTop: "40px",
};

const infoBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "6px",
    padding: "20px",
    margin: "32px 0",
};

const infoText = {
    color: "#18181b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
};

const buttonAction = {
    textAlign: "center" as const,
    marginTop: "10px",
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
