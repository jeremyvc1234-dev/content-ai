import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function toPeriodEnd(ts: any): string | null {
  if (ts == null) return null
  return new Date(Number(ts) * 1000).toISOString()
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function upsertSubscription(
  supabaseUserId: string,
  subscription: Stripe.Subscription
) {
  const db = getAdminClient()
  await db.from('profiles').upsert({
    id: supabaseUserId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: toPeriodEnd((subscription as any).current_period_end),
    updated_at: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const db = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const supabaseUserId = session.metadata?.supabase_user_id
        if (!supabaseUserId || session.mode !== 'subscription') break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await db.from('profiles').upsert({
          id: supabaseUserId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: toPeriodEnd((subscription as any).current_period_end),
          updated_at: new Date().toISOString(),
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: profile } = await db
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()
        if (profile) await upsertSubscription(profile.id, subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription
        if (!subId) break
        const { data: profile } = await db
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle()
        if (profile) {
          await db.from('profiles').update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('id', profile.id)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
