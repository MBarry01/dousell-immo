import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import ReactPDF from '@react-pdf/renderer';
import { createPreavisDocument } from '@/components/pdf/PreavisPDF';
import { render } from '@react-email/render';
import { LegalNoticeEmail } from '@/emails/LegalNoticeEmail';


export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données de la requête
    const data = await request.json();

    console.log('📧 Génération du préavis pour:', data.tenantEmail);

    // 2. Validation basique
    if (!data.tenantEmail) {
      return NextResponse.json(
        { success: false, error: 'Email du locataire manquant' },
        { status: 400 }
      );
    }

    if (!data.tenantName || !data.noticeType || !data.endDate) {
      return NextResponse.json(
        { success: false, error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // 3. Générer le PDF en mémoire
    console.log('📄 Génération du PDF préavis...');
    const pdfDocument = createPreavisDocument(data);

    // Utiliser renderToStream
    const stream = await ReactPDF.renderToStream(pdfDocument);

    // Convertir le stream en buffer
    const chunks: Uint8Array[] = [];
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    console.log('✅ PDF préavis généré:', pdfBuffer.length, 'bytes');

    // 4. Configuration de Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 5. Déterminer le sujet et le contenu selon le type
    const isJ180 = data.noticeType === 'J-180';

    const subject = isJ180
      ? `⚠️ Préavis de Congé - Échéance ${new Date(data.endDate).toLocaleDateString('fr-FR')}`
      : `📅 Notification de Reconduction Tacite - ${new Date(data.endDate).toLocaleDateString('fr-FR')}`;

    const _title = isJ180
      ? 'Préavis de Congé pour Reprise'
      : 'Notification de Reconduction Tacite';

    const urgency = isJ180
      ? "Il vous reste environ 6 mois avant l'échéance du bail."
      : "Il vous reste environ 3 mois avant l'échéance du bail.";

    const action = isJ180
      ? "Vous devrez libérer les lieux à la date d'échéance mentionnée dans le document ci-joint."
      : "En l'absence de congé, le bail sera reconduit tacitement aux mêmes conditions.";

    // 6. Email du propriétaire pour la copie (CC)
    const ownerEmailForCC = data.ownerEmail || data.ownerAccountEmail;

    // Log pour vérifier les destinataires
    console.log('📧 Destinataires email:');
    console.log('   → TO (Locataire):', data.tenantEmail);
    console.log('   → CC (Propriétaire):', ownerEmailForCC);

    // 7. Préparer l'email avec React Email
    const noticeTitle = isJ180
      ? 'Préavis de Congé pour Reprise'
      : 'Notification de Reconduction Tacite';

    const mainContent = isJ180
      ? `Nous vous informons par la présente de notre intention de reprendre le logement que vous occupez actuellement. ${urgency} ${action}`
      : `Nous vous informons de l'arrivée prochaine de l'échéance de votre contrat de bail. ${urgency} ${action}`;

    const emailHtml = await render(
      <LegalNoticeEmail
        tenantName={data.tenantName}
        propertyAddress={data.propertyAddress}
        noticeType={isJ180 ? 'termination' : 'general'}
        noticeTitle={noticeTitle}
        mainContent={mainContent}
        effectiveDate={new Date(data.endDate).toLocaleDateString('fr-FR')}
        senderName={data.ownerName}
        senderAddress={data.ownerAddress}
      />
    );

    const pdfFilename = isJ180
      ? `Preavis_Conge_${data.noticeNumber}.pdf`
      : `Notification_Reconduction_${data.noticeNumber}.pdf`;

    const mailOptions = {
      from: `${data.ownerName} <${process.env.GMAIL_USER}>`,
      to: data.tenantEmail,
      cc: ownerEmailForCC,
      subject: subject,
      html: emailHtml,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };



    // 8. Envoyer l'email
    console.log("📤 Envoi de l'email...");
    await transporter.sendMail(mailOptions);

    console.log("✅ Email envoyé avec succès à:", data.tenantEmail);

    return NextResponse.json({
      success: true,
      message: `Préavis ${data.noticeType} envoyé avec succès à ${data.tenantName}`,
      pdfSize: pdfBuffer.length,
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du préavis:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'envoi du préavis",
      },
      { status: 500 }
    );
  }
}
