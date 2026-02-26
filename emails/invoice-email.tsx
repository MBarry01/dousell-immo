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
    Link,
} from "@react-email/components";
import * as React from "react";

interface InvoiceEmailProps {
    clientName: string;
    invoiceNumber?: string;
    amount?: number;
    teamName?: string;
}

/**
 * InvoiceEmail - Nouveau Design SaaS Minimaliste
 * Refactorisation par Antigravity
 */
export const InvoiceEmail = ({
    clientName = "Client",
    invoiceNumber = "INV-2026-001",
    amount = 250000,
    teamName = "Dousel",
}: InvoiceEmailProps) => {
    return (
        <Html lang="fr">
            <Head />
            <Preview>Votre facture {invoiceNumber ? ` - ${invoiceNumber}` : ""} — {teamName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête discret */}
                    <Section style={header}>
                        <Text style={logo}>DOUSEL</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>Votre facture est disponible</Heading>

                        <Text style={text}>
                            Bonjour <strong>{clientName}</strong>,
                        </Text>

                        <Text style={text}>
                            Nous vous remercions pour votre confiance. Vous trouverez ci-joint votre facture correspondante à vos services récents sur la plateforme {teamName}.
                        </Text>

                        {/* Carte Détails de la facture - Aplat Gris Clair */}
                        {(invoiceNumber || amount !== undefined) && (
                            <Section style={detailsBox}>
                                <Text style={detailsTitle}>DÉTAILS DE LA FACTURE</Text>

                                {invoiceNumber && (
                                    <Section style={detailsRow}>
                                        <Text style={label}>Numéro de facture</Text>
                                        <Text style={value}>{invoiceNumber}</Text>
                                    </Section>
                                )}

                                {amount !== undefined && (
                                    <Section style={detailsRow}>
                                        <Text style={label}>Montant total</Text>
                                        <Text style={valuePrice}>{amount.toLocaleString("fr-SN")} FCFA</Text>
                                    </Section>
                                )}
                            </Section>
                        )}

                        <Text style={text}>
                            Le document PDF est joint à cet email pour vos archives comptables.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={infoText}>
                                <strong>Besoin d'aide ?</strong> Si vous avez des questions concernant cette facture ou si vous remarquez une erreur, notre support est à votre disposition en répondant directement à cet email.
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
                            Dousel — Plateforme Immobilière Professionnelle
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default InvoiceEmail;

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

const detailsBox = {
    backgroundColor: "#fafafa",
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

const valuePrice = {
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: "700" as const,
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
