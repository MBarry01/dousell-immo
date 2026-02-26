import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { InvoiceEmail } from "../emails/invoice-email";

/**
 * Service d'envoi d'emails via l'API Resend
 * Utilise RESEND_API_KEY depuis les variables d'environnement
 */

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not defined");
    }
    return new Resend(apiKey);
};

export type SendEmailOptions = {
    to: string | string[];
    subject: string;
    html?: string;
    react?: React.ReactElement;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
    replyTo?: string;
    from?: string;
};

/**
 * Envoie un email via l'API Resend
 */
export async function sendEmailResend({
    to,
    subject,
    html,
    react,
    attachments,
    replyTo,
    from,
}: SendEmailOptions) {
    try {
        const resend = getResendClient();

        // Convertir React en HTML si nécessaire
        let emailHtml = html;
        if (react && !html) {
            emailHtml = await render(react);
        }

        if (!emailHtml) {
            return { error: "No content provided (html or react)" };
        }

        // Préparer l'expéditeur (priorité à l'option 'from', puis NOREPLY, puis env, puis défaut)
        const isNoReply = replyTo === 'noreply' || from?.includes('noreply');
        const sender = from || (isNoReply ? process.env.NOREPLY_EMAIL : process.env.FROM_EMAIL) || "Dousel Support <contact@dousel.com>";
        const reply_to = isNoReply ? undefined : (replyTo || process.env.CONTACT_EMAIL || "contact@dousel.com");

        const { data, error } = await resend.emails.send({
            from: sender,
            to: Array.isArray(to) ? to : [to],
            subject,
            html: emailHtml,
            replyTo: reply_to,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
            })),
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            return { error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (err) {
        console.error("❌ Resend Service Error:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
}

/**
 * Envoie une facture via Resend
 */
export async function sendInvoiceEmailResend({
    to,
    clientName,
    pdfBuffer,
    invoiceNumber,
    amount,
}: {
    to: string;
    clientName: string;
    pdfBuffer: Buffer;
    invoiceNumber?: string;
    amount?: number;
}) {
    return sendEmailResend({
        to,
        subject: `Votre facture Dousel${invoiceNumber ? ` - ${invoiceNumber}` : ""}`,
        react: React.createElement(InvoiceEmail, {
            clientName,
            invoiceNumber,
            amount,
        }),
        attachments: [
            {
                filename: `Facture-Dousel-${invoiceNumber || 'draft'}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });
}
