// app/api/admin/generate-article/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  await requireAnyRole(['admin', 'superadmin']);

  const body = await req.json();
  const { sujet, categorie, angle, public_cible, longueur, email_notif } = body;

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL non configuré' }, { status: 500 });
  }

  const payload = {
    'Actualité Chaude (Mode Auto)': false,
    sujet: sujet || '',
    categorie: categorie || 'Guides',
    angle: angle || 'Analyse de marché',
    public_cible: public_cible || 'Propriétaire',
    longueur: longueur || 'Standard 1200 mots',
    email_notif: email_notif || '',
  };

  const res = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'any'
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `n8n error: ${text}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
