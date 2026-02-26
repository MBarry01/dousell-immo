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

interface MaintenanceUpdateEmailProps {
    tenantName: string;
    description: string;
    artisanName: string;
    artisanPhone: string;
    artisanAddress?: string;
    interventionDate: string;
    status: "approved" | "completed" | "rescheduled";
}

/**
 * MaintenanceUpdateEmail - Template pour le suivi des demandes de maintenance
 * Design Moderne & Informatif
 */
export function MaintenanceUpdateEmail({
    tenantName = "Locataire",
    description = "Réparation de la fuite d'eau",
    artisanName = "Moussa Sarr (Plomberie)",
    artisanPhone = "+221 77 000 00 00",
    artisanAddress = "Dakar, Sénégal",
    interventionDate = "26/02/2026 à 10h00",
    status = "approved",
}: MaintenanceUpdateEmailProps) {
    const getStatusText = () => {
        switch (status) {
            case "approved": return "Intervention Validée";
            case "completed": return "Intervention Terminée";
            case "rescheduled": return "Intervention Reportée";
            default: return "Mise à jour d'intervention";
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "approved": return "#16a34a"; // Vert
            case "completed": return "#2563eb"; // Bleu
            case "rescheduled": return "#ea580c"; // Orange
            default: return "#18181b";
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{getStatusText()} — {description}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* En-tête */}
                    <Section style={header}>
                        <Text style={logo}>DOUSSEL IMMO — MAINTENANCE</Text>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Corps de l'email */}
                    <Section style={content}>
                        <Heading style={{ ...h1, color: getStatusColor() }}>
                            {getStatusText()}
                        </Heading>

                        <Text style={text}>Bonjour {tenantName},</Text>

                        <Text style={text}>
                            {status === "approved"
                                ? `Bonne nouvelle ! La demande d'intervention pour "${description}" a été validée. Un artisan a été assigné à votre dossier.`
                                : `Nous vous informons du nouveau statut de l'intervention pour "${description}".`}
                        </Text>

                        {/* Détails Artisan & Rendez-vous */}
                        <Section style={artisanBox}>
                            <Text style={boxTitle}>👷‍♂️ Informations Artisan</Text>
                            <Text style={artisanNameText}>{artisanName}</Text>
                            <Text style={artisanDetail}>
                                <strong>Téléphone :</strong>{" "}
                                <a href={`tel:${artisanPhone}`} style={link}>{artisanPhone}</a>
                            </Text>
                            {artisanAddress && (
                                <Text style={artisanDetail}>
                                    <strong>Adresse :</strong> {artisanAddress}
                                </Text>
                            )}

                            <Hr style={hrInner} />

                            <Text style={boxTitle}>📅 Rendez-vous</Text>
                            <Text style={interventionDateText}>{interventionDate}</Text>
                        </Section>

                        <Section style={noteBox}>
                            <Text style={noteText}>
                                <strong>Prochaine étape :</strong> L'artisan vous contactera directement par téléphone pour confirmer son arrivée. Merci de vous assurer que le logement est accessible à l'heure prévue.
                            </Text>
                        </Section>
                    </Section>

                    <Hr style={hrSubtle} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSignature}>
                            Cordialement,<br />
                            <strong>L'équipe de Gestion Dousel</strong>
                        </Text>

                        <Section style={footerBottom}>
                            <Text style={footerTextSubtle}>
                                © {new Date().getFullYear()} Doussel Immo — Service Technique
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default MaintenanceUpdateEmail;

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

const artisanBox = {
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "8px",
    padding: "24px",
    margin: "32px 0",
};

const boxTitle = {
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#71717a",
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
};

const artisanNameText = {
    fontSize: "18px",
    fontWeight: "700" as const,
    color: "#18181b",
    margin: "0 0 12px 0",
};

const artisanDetail = {
    fontSize: "14px",
    color: "#3f3f46",
    margin: "4px 0",
};

const interventionDateText = {
    fontSize: "16px",
    fontWeight: "600" as const,
    color: "#18181b",
    margin: "8px 0 0 0",
};

const hrInner = {
    borderColor: "#e4e4e7",
    margin: "20px 0",
};

const link = {
    color: "#2563eb",
    textDecoration: "none",
};

const noteBox = {
    backgroundColor: "#fffbeb", // Ambre très clair
    borderLeft: "4px solid #f59e0b",
    padding: "16px 20px",
    margin: "24px 0",
};

const noteText = {
    fontSize: "14px",
    color: "#92400e",
    lineHeight: "1.5",
    margin: "0",
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
