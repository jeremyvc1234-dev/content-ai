import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { session: authSession } } = await supabase.auth.getSession()
    const user = authSession?.user

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stripe = getStripe()

    // Look up Stripe customer — first try profile, then search by metadata/email
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 })
      const match = customers.data.find(c => c.metadata?.supabase_user_id === user.id)
      if (match) customerId = match.id
    }

    if (!customerId) {
      return NextResponse.json({ synced: false, reason: 'no_customer' })
    }

    // Get latest subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    })

    const sub = subscriptions.data[0]
    if (!sub) {
      return NextResponse.json({ synced: false, reason: 'no_subscription' })
    }

    // Upsert profile with subscription info (requires INSERT + UPDATE RLS policies)
    await supabase.from('profiles').upsert({
      id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      current_period_end: (sub as any).current_period_end != null
        ? new Date(Number((sub as any).current_period_end) * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ synced: true, status: sub.status })
  } catch (error) {
    console.error('stripe sync error:', error)
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 })
  }
}
