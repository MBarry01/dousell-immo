import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { createClient } from '@supabase/supabase-js';
import { storeDocumentInGED } from '@/lib/ged-utils';
import { render } from '@react-email/render';
import { ReceiptEmail } from '@/emails/ReceiptEmail';


export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données de la requête
    const data = await request.json();

    console.log('📧 Génération de la quittance pour:', data.tenantEmail);

    // 2. Validation basique
    if (!data.tenantEmail) {
      return NextResponse.json(
        { success: false, error: 'Email du locataire manquant' },
        { status: 400 }
      );
    }

    if (!data.tenantName || !data.amount) {
      return NextResponse.json(
        { success: false, error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // 3. Générer le PDF en mémoire
    console.log('📄 Génération du PDF...');
    const pdfDocument = createQuittanceDocument(data);

    // Utiliser renderToStream au lieu de renderToBuffer
    const stream = await ReactPDF.renderToStream(pdfDocument);

    // Convertir le stream en buffer
    const chunks: Uint8Array[] = [];
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    console.log('✅ PDF généré:', pdfBuffer.length, 'bytes');

    // 4. NOUVEAU: Sauvegarder le PDF dans Supabase Storage + user_documents
    if (data.leaseId) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Récupérer le owner_id depuis le bail
        const { data: lease } = await supabaseAdmin
          .from('leases')
          .select('owner_id')
          .eq('id', data.leaseId)
          .single();

        if (lease?.owner_id) {
          // Utiliser l'utilitaire centralisé pour le stockage
          await storeDocumentInGED({
            userId: lease.owner_id,
            fileBuffer: new Uint8Array(pdfBuffer),
            fileName: `Quittance_${data.receiptNumber}.pdf`,
            bucketName: 'receipts',
            documentType: 'quittance',
            metadata: {
              leaseId: data.leaseId,
              tenantName: data.tenantName,
              description: `Quittance - ${data.periodMonth} - ${data.tenantName}`
            }
          }, supabaseAdmin);
          console.log('💾 Quittance sauvegardée dans la GED via utility');
        }
      } catch (storageError) {
        // Ne pas bloquer l'envoi d'email si le stockage échoue
        console.error('⚠️ Erreur stockage GED (non bloquant):', storageError);
      }
    }

    // 5. Configuration de Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 5. Formatter le montant pour l'email
    const amountFormatted = new Intl.NumberFormat('fr-FR').format(data.amount);

    // 6. Déterminer l'email du propriétaire pour la copie (CC)
    // Priorité: ownerEmail (de la config) > email du compte utilisateur
    const ownerEmailForCC = data.ownerEmail || data.ownerAccountEmail;

    // 7. Déterminer si c'est une garantie (period_month = 0 ou flag explicite)
    const isGuarantee = data.isGuarantee === true;
    const documentType = isGuarantee ? 'Dépôt de garantie' : 'Quittance de loyer';
    const periodDisplay = isGuarantee ? 'Garantie' : data.periodMonth;

    // 8. Préparer l'email avec React Email
    const emailHtml = await render(
      renderReceiptEmail({
        tenantName: data.tenantName,
        receiptNumber: data.receiptNumber,
        periodDisplay: periodDisplay,
        amountFormatted: amountFormatted,
        isGuarantee: isGuarantee,
        ownerName: data.ownerName,
        ownerAddress: data.ownerAddress
      })
    );

    // Determine the subject based on document type
    let subject = `${documentType} - ${periodDisplay}`;

    // Determine the PDF filename based on document type
    let pdfFilename;
    if (data.isJ180 !== undefined) { // Assuming isJ180 indicates a notice document
      const isJ180 = data.isJ180 === true;
      pdfFilename = isJ180
        ? `Preavis_Conge_${data.noticeNumber}.pdf`
        : `Notification_Reconduction_${data.noticeNumber}.pdf`;
      subject = isJ180 ? `Préavis de congé - ${data.noticeNumber}` : `Notification de reconduction - ${data.noticeNumber}`;
    } else { // Default to receipt logic if not a notice
      pdfFilename = isGuarantee
        ? `Recu_Caution_${data.receiptNumber}.pdf`
        : `Quittance_${data.receiptNumber}.pdf`;
    }

    const mailOptions = {
      from: `${data.ownerName} <${process.env.GMAIL_USER}>`,
      to: data.tenantEmail,
      cc: ownerEmailForCC, // Mettre le propriétaire en copie
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
    console.log('📤 Envoi de l\'email à:', data.tenantEmail);
    if (ownerEmailForCC) {
      console.log('📧 Copie envoyée au propriétaire:', ownerEmailForCC);
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé:', info.messageId);

    // 9. Retourner le succès
    return NextResponse.json({
      success: true,
      message: `Email envoyé à ${data.tenantEmail}${ownerEmailForCC ? ` (copie à ${ownerEmailForCC})` : ''}`,
      messageId: info.messageId,
      receiptNumber: data.receiptNumber,
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email',
      },
      { status: 500 }
    );
  }
}

function renderReceiptEmail(props: any) {
  return (
    <ReceiptEmail
      tenantName={props.tenantName}
      receiptNumber={props.receiptNumber}
      periodDisplay={props.periodDisplay}
      amountFormatted={props.amountFormatted}
      isGuarantee={props.isGuarantee}
      ownerName={props.ownerName}
      ownerAddress={props.ownerAddress}
    />
  );
}
