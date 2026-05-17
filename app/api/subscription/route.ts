import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const TRIAL_DAYS = 14

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 1. Calcul du trial basé sur created_at
  const createdAt = new Date(user.created_at)
  const trialEnd = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  const now = new Date()
  const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  const trialActive = trialDaysLeft > 0

  // 2. Lecture via service role (bypass RLS) pour garantir le vrai statut
  const serviceKeyAvailable = !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('REMPLACE')

  let profile: { subscription_status: string; stripe_customer_id: string | null } | null = null

  if (serviceKeyAvailable) {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (error) console.error('profiles admin read error:', error.message)
    else profile = data
  } else {
    // Fallback : lecture via session utilisateur (soumis à RLS)
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (error) console.error('profiles read error:', error.message)
    else profile = data
  }

  const subscriptionStatus = profile?.subscription_status ?? 'trialing'
  const subscriptionActive = subscriptionStatus === 'active'
  const hasStripeCustomer = !!profile?.stripe_customer_id

  // 3. Règles d'accès
  let hasAccess: boolean
  if (subscriptionActive) {
    hasAccess = true
  } else if (trialActive) {
    hasAccess = true
  } else {
    hasAccess = false
  }

  return NextResponse.json({
    trialDaysLeft,
    trialActive,
    subscriptionActive,
    subscriptionStatus,
    hasAccess,
    hasStripeCustomer,
  })
}
