import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { createClient } from '@supabase/supabase-js';

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
          const fileName = `${lease.owner_id}/quittances/${data.receiptNumber}_${Date.now()}.pdf`;

          // Upload vers Storage
          const { error: uploadError } = await supabaseAdmin.storage
            .from('verification-docs')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (!uploadError) {
            // Créer l'entrée dans user_documents
            await supabaseAdmin.from('user_documents').insert({
              user_id: lease.owner_id,
              file_name: `Quittance_${data.receiptNumber}.pdf`,
              file_path: fileName,
              file_type: 'quittance',
              file_size: pdfBuffer.length,
              mime_type: 'application/pdf',
              source: 'generated',
              lease_id: data.leaseId,
              category: 'quittance'
            });
            console.log('💾 Quittance sauvegardée dans la GED:', fileName);
          } else {
            console.error('⚠️ Erreur upload Storage:', uploadError.message);
          }
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

    // 8. Préparer l'email
    const mailOptions = {
      from: `${data.ownerName} <${process.env.GMAIL_USER}>`,
      to: data.tenantEmail,
      cc: ownerEmailForCC, // Mettre le propriétaire en copie
      subject: `${documentType} - ${periodDisplay}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
          <p>Bonjour <strong>${data.tenantName}</strong>,</p>

          <p>Veuillez trouver ci-joint ${isGuarantee
          ? `votre attestation de dépôt de garantie.`
          : `votre quittance de loyer pour le mois de <strong>${data.periodMonth}</strong>.`
        }</p>

          <p><strong>Détails ${isGuarantee ? 'du dépôt' : 'de la quittance'} :</strong></p>
          <ul>
            <li><strong>N° ${isGuarantee ? 'Attestation' : 'Quittance'} :</strong> ${data.receiptNumber}</li>
            <li><strong>${isGuarantee ? 'Nature' : 'Période'} :</strong> ${periodDisplay}</li>
            <li><strong>Montant acquitté :</strong> ${amountFormatted} FCFA</li>
          </ul>

          <p>${isGuarantee
          ? 'Nous accusons réception de votre dépôt de garantie. Ce montant vous sera restitué conformément aux termes de votre contrat de bail.'
          : 'Nous accusons réception du paiement de votre loyer.'
        }</p>

          <p>Cordialement,<br>
          <strong>${data.ownerName}</strong><br>
          ${data.ownerAddress}</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">Email généré automatiquement par Dousell Immo</p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Quittance_${data.receiptNumber}.pdf`,
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
