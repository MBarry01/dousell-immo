import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Resend webhooks use Svix for signature verification
// Install if needed: npm install svix
// Reference: https://resend.com/docs/dashboard/webhooks/introduction

type ResendWebhookEvent = {
  type: string
  data: {
    email_id?: string
    tags?: Array<{ name: string; value: string }>
    [key: string]: unknown
  }
}

function getProspectId(tags?: Array<{ name: string; value: string }>): string | null {
  if (!tags) return null
  return tags.find(t => t.name === 'prospect_id')?.value ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Verify Resend webhook signature using Svix
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[b2b-tracking] RESEND_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: ResendWebhookEvent
  try {
    // Dynamic import to avoid hard dependency if svix is not installed
    const { Webhook } = await import('svix')
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent
  } catch (err) {
    console.error('[b2b-tracking] Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const prospectId = getProspectId(event.data?.tags)

  // Ignore events not tagged with a prospect_id (transactional emails, etc.)
  if (!prospectId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Use service role to bypass RLS (webhook operates server-side)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'email.opened') {
    const { error } = await supabase
      .from('b2b_prospects')
      .update({ email_opened: true })
      .eq('id', prospectId)

    if (error) {
      console.error('[b2b-tracking] Failed to update email_opened:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  if (event.type === 'email.clicked') {
    const { error } = await supabase
      .from('b2b_prospects')
      .update({ email_clicked: true })
      .eq('id', prospectId)

    if (error) {
      console.error('[b2b-tracking] Failed to update email_clicked:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
