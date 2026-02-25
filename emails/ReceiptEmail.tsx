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

interface ReceiptEmailProps {
    tenantName: string;
    receiptNumber: string;
    periodDisplay: string;
    amountFormatted: string;
    isGuarantee?: boolean;
    ownerName: string;
    ownerAddress: string;
}

/**
 * ReceiptEmail - Template pour quittances et dépôts de garantie
 * Design Minimaliste SaaS
 */
export function ReceiptEmail({
    tenantName = "Locataire",
    receiptNumber = "QUITT-123456",
    periodDisplay = "Janvier 2026",
    amountFormatted = "150 000",
    isGuarantee = false,
    ownerName = "Propriétaire",
    ownerAddress = "Dakar, Sénégal",
}: ReceiptEmailProps) {
    const documentType = isGuarantee ? "Attestation de dépôt" : "Quittance de loyer";

    return (
        <Html>
            <Head />
            <Preview>
                {documentType} - {periodDisplay}
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={h1}>{documentType}</Heading>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Text style={text}>
                            Veuillez trouver ci-joint votre{" "}
                            {isGuarantee
                                ? "attestation de dépôt de garantie"
                                : `quittance de loyer pour le mois de ${periodDisplay}`}
                            .
                        </Text>

                        {/* Encadré Détails */}
                        <Section style={detailsBox}>
                            <Text style={detailsItem}>
                                <strong>N° Document :</strong> {receiptNumber}
                            </Text>
                            <Text style={detailsItem}>
                                <strong>{isGuarantee ? "Nature" : "Période"} :</strong> {periodDisplay}
                            </Text>
                            <Text style={detailsItem}>
                                <strong>Montant acquitté :</strong> {amountFormatted} FCFA
                            </Text>
                        </Section>

                        <Text style={text}>
                            {isGuarantee
                                ? "Nous accusons réception de votre dépôt de garantie. Ce montant vous sera restitué conformément aux termes de votre contrat de bail."
                                : "Nous accusons réception du paiement de votre loyer."}
                        </Text>

                        <Text style={textSubtle}>
                            Ce document est également archivé en toute sécurité dans votre espace locataire.
                        </Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            Cordialement,<br />
                            <strong>{ownerName}</strong><br />
                            <span style={ownerAddr}>{ownerAddress}</span>
                        </Text>

                        <Section style={footerBottom}>
                            <Text style={footerTextSubtle}>
                                © {new Date().getFullYear()} Doussel Immo — Dakar, Sénégal
                            </Text>
                            <Text style={footerLink}>
                                Email généré automatiquement • Ne pas répondre
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default ReceiptEmail;

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
    padding: "20px",
    margin: "32px 0",
};

const detailsItem = {
    color: "#18181b",
    fontSize: "14px",
    margin: "0 0 8px 0",
    lineHeight: "1.4",
};

const textSubtle = {
    color: "#71717a",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "24px",
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

const ownerAddr = {
    color: "#71717a",
    fontSize: "13px",
};

const footerBottom = {
    textAlign: "center" as const,
    marginTop: "32px",
};

const footerTextSubtle = {
    color: "#a1a1aa",
    fontSize: "12px",
    marginBottom: "8px",
    marginTop: "0",
};

const footerLink = {
    color: "#d4d4d8",
    fontSize: "11px",
    margin: "0",
};
