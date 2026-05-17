'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Sparkles, Check, Zap, Camera, Play, Globe, Crown,
  ArrowRight, Shield, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  { icon: <Camera className="w-4 h-4" />, text: '10 posts Instagram sur mesure par génération' },
  { icon: <Play className="w-4 h-4" />, text: '10 scripts TikTok structurés [OUVERTURE/CTA]' },
  { icon: <Zap className="w-4 h-4" />, text: 'Images DALL-E 3 pour chaque post Instagram' },
  { icon: <Globe className="w-4 h-4" />, text: 'Français, Néerlandais & Anglais' },
  { icon: <Crown className="w-4 h-4" />, text: 'Tous les secteurs belges (resto, beauté, sport…)' },
  { icon: <Shield className="w-4 h-4" />, text: 'Annulable à tout moment, sans engagement' },
]

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [trialExpired, setTrialExpired] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setIsLoggedIn(true)
      const created = new Date(data.user.created_at)
      const trialEnd = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000)
      setTrialExpired(new Date() > trialEnd)
    })
  }, [])

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push('/register')
      return
    }
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du paiement')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement manquante')
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.')
      setCheckoutLoading(false)
    }
  }

  const expired = searchParams.get('expired') === 'true'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f093fb, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #667eea, transparent)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl">ContentAI</span>
        </Link>
        <div className="flex items-center gap-4">
          {isLoggedIn
            ? <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                Tableau de bord
              </Link>
            : <>
                <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white">
                  Essai gratuit
                </Link>
              </>}
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">

        {/* Trial expired alert */}
        {expired && (
          <div className="mb-10 flex items-start gap-3 px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold text-sm">Ton essai gratuit est terminé</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Abonne-toi pour continuer à générer du contenu illimité.
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'rgba(240,147,251,0.1)', border: '1px solid rgba(240,147,251,0.25)', color: '#f093fb' }}>
            <Sparkles className="w-4 h-4" />
            Simple &amp; transparent
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Un seul plan,<br />
            <span className="gradient-text">tout inclus</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Génère du contenu social qui cartonne pour ton business belge.
            {!isLoggedIn && ' 14 jours gratuits, sans carte bancaire.'}
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div className="relative rounded-3xl p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(240,147,251,0.08), rgba(102,126,234,0.08))',
              border: '1px solid rgba(240,147,251,0.25)',
              boxShadow: '0 0 60px rgba(240,147,251,0.08)',
            }}>

            {/* Badge */}
            {!isLoggedIn && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f093fb, #667eea)' }}>
                14 jours gratuits · Sans carte
              </div>
            )}

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5" style={{ color: '#f093fb' }} />
                <h2 className="text-xl font-bold">ContentAI Pro</h2>
              </div>
              <div className="flex items-end justify-center gap-1 mt-4">
                <span className="text-6xl font-extrabold">39</span>
                <div className="mb-3 text-left">
                  <span className="text-2xl font-bold">€</span>
                  <div className="text-gray-400 text-sm leading-none">/mois</div>
                </div>
              </div>
              {!isLoggedIn && (
                <p className="text-gray-500 text-xs mt-1">puis 39€/mois · annulable à tout moment</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(240,147,251,0.15)', color: '#f093fb' }}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-gray-300 text-sm">{f.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {checkoutError && (
              <div className="mb-3 px-4 py-2.5 rounded-xl text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {checkoutError}
              </div>
            )}
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="btn-primary w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60">
              {checkoutLoading
                ? 'Redirection vers Stripe...'
                : isLoggedIn
                  ? <><Crown className="w-4 h-4" />S&apos;abonner maintenant</>
                  : <><ArrowRight className="w-4 h-4" />Commencer gratuitement</>}
            </button>

            {!isLoggedIn && (
              <p className="text-center text-gray-600 text-xs mt-3">
                Aucune carte requise · Inscription en 30 secondes
              </p>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Paiement sécurisé Stripe
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Annulation immédiate depuis le portail
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Accès immédiat après paiement
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PricingContent />
    </Suspense>
  )
}
