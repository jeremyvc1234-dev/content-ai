import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  // Use getSession() (local cookie decode) — avoids a network call with the JWT
  // as a Bearer header, which fails when env vars contain a BOM (char 65279).
  // Same pattern as /api/subscription.
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, user: session?.user ?? null }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('generations')
    .select('id, secteur, ville, ton, langue, description, posts, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { secteur, ville, ton, langue, description, posts } = body

  if (!secteur || !ville || !ton || !langue || !posts) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('generations')
    .insert({ user_id: user.id, secteur, ville, ton, langue, description: description || null, posts })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
