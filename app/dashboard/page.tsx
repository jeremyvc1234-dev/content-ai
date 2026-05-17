'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Camera, Play, Clock, Copy, Check, Zap, LogOut,
  ChevronDown, Loader2, ImageIcon, Download, Building2,
  AlertCircle, Crown, History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post { text: string; hashtags: string; bestTime: string }
interface GeneratedContent { instagram: Post[]; tiktok: Post[] }
interface ImageState { loading: boolean; dataUrl: string | null; error: string | null }
interface SubInfo {
  trialDaysLeft: number
  trialActive: boolean
  subscriptionActive: boolean
  hasAccess: boolean
  hasStripeCustomer: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTEURS = [
  'Restaurant / Café', 'Boulangerie / Pâtisserie', 'Salon de coiffure / Beauté',
  'Boutique mode / Vêtements', 'Fitness / Sport', 'Librairie / Papeterie',
  'Épicerie fine / Traiteur', 'Fleuriste', 'Bijouterie / Accessoires',
  'Photographe', 'Immobilier', 'Cabinet dentaire / Médecin',
  'Architecte / Designer', 'Garage / Auto', 'Autre',
]

const VILLES = [
  'Bruxelles', 'Gent', 'Antwerpen', 'Liège', 'Bruges', 'Namur',
  'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Hasselt',
  'Kortrijk', 'Sint-Niklaas', 'Tournai', 'Genk', 'Seraing', 'Roeselare',
  'Mouscron', 'Verviers', 'Autre ville',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [secteur, setSecteur] = useState('')
  const [ville, setVille] = useState('')
  const [ton, setTon] = useState<'fun' | 'pro' | 'inspirant'>('fun')
  const [langue, setLangue] = useState<'FR' | 'NL' | 'EN'>('FR')

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'instagram' | 'tiktok'>('instagram')
  const [imageStates, setImageStates] = useState<Record<string, ImageState>>({})
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser({
        email: data.user.email ?? '',
        name: data.user.user_metadata?.full_name ?? data.user.email ?? '',
      })
    })

    const justSubscribed = typeof window !== 'undefined' &&
      window.location.search.includes('subscribed=true')

    if (justSubscribed) {
      window.history.replaceState({}, '', '/dashboard')
      // Sync subscription status directly from Stripe, then refresh banner
      fetch('/api/stripe/sync', { method: 'POST' })
        .then(() => fetch('/api/subscription'))
        .then(r => r.json())
        .then((info: SubInfo) => setSubInfo(info))
        .catch(() => {})
    } else {
      fetch('/api/subscription').then(r => r.json()).then((info: SubInfo) => {
        setSubInfo(info)
        if (info?.hasAccess === false) {
          router.replace('/pricing?expired=true')
        }
      }).catch(() => {})
    }
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setPortalLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!secteur || !ville) { setError('Merci de remplir le secteur et la ville.'); return }
    setLoading(true)
    setError('')
    setContent(null)
    setImageStates({})

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ secteur, ville, ton, langue, businessName, businessDescription }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const data = await res.json()
      setContent(data)
      setActiveTab('instagram')

      // Sauvegarde automatique dans l'historique
      fetch('/api/generations', {
        method: 'POST',
        body: JSON.stringify({
          secteur, ville, ton, langue,
          description: businessDescription || null,
          posts: data,
        }),
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, hashtags: string, key: string) => {
    navigator.clipboard.writeText(`${text}\n\n${hashtags}`)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleGenerateImage = async (post: Post, key: string) => {
    setImageStates(prev => ({ ...prev, [key]: { loading: true, dataUrl: null, error: null } }))
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ postText: post.text, secteur, businessName, ville }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageStates(prev => ({ ...prev, [key]: { loading: false, dataUrl: data.image, error: null } }))
    } catch (err) {
      setImageStates(prev => ({
        ...prev,
        [key]: { loading: false, dataUrl: null, error: err instanceof Error ? err.message : 'Erreur' },
      }))
    }
  }

  const handleDownload = (dataUrl: string, i: number) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `contentai-instagram-${i + 1}.png`
    a.click()
  }

  const currentPosts = content ? content[activeTab] : []

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between card-glass">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">ContentAI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/historique"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <History className="w-4 h-4" />
            <span className="hidden sm:block">Historique</span>
          </Link>
          {user && (
            <>
              <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                <LogOut className="w-4 h-4" /><span className="hidden sm:block">Déconnexion</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Subscription / Trial banner ── */}
      {subInfo && !subInfo.subscriptionActive && subInfo.trialActive && (
        <div className="px-6 py-3 flex items-center justify-between gap-4"
          style={{
            background: subInfo.trialDaysLeft <= 3
              ? 'linear-gradient(90deg, rgba(245,87,92,0.15), rgba(253,117,81,0.15))'
              : 'linear-gradient(90deg, rgba(102,126,234,0.12), rgba(240,147,251,0.12))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 flex-shrink-0"
              style={{ color: subInfo.trialDaysLeft <= 3 ? '#f5576c' : '#f093fb' }} />
            <span style={{ color: subInfo.trialDaysLeft <= 3 ? '#fca5a5' : '#c4b5fd' }}>
              {subInfo.trialDaysLeft <= 3
                ? `Ton essai se termine dans ${subInfo.trialDaysLeft} jour${subInfo.trialDaysLeft > 1 ? 's' : ''} !`
                : `Essai gratuit · ${subInfo.trialDaysLeft} jour${subInfo.trialDaysLeft > 1 ? 's' : ''} restant${subInfo.trialDaysLeft > 1 ? 's' : ''}`}
            </span>
          </div>
          <a href="/pricing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #f093fb, #667eea)' }}>
            <Crown className="w-3 h-3" />
            Passer à Pro
          </a>
        </div>
      )}

      {/* ── Pro badge (subscribed) ── */}
      {subInfo?.subscriptionActive && (
        <div className="px-6 py-2.5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(90deg, rgba(34,197,94,0.08), rgba(16,185,129,0.08))',
            borderBottom: '1px solid rgba(34,197,94,0.12)',
          }}>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Crown className="w-4 h-4" />
            <span>ContentAI Pro — abonnement actif</span>
          </div>
          <button onClick={handlePortal} disabled={portalLoading}
            className="text-xs text-green-500 hover:text-green-300 transition-colors disabled:opacity-50">
            {portalLoading ? 'Chargement...' : 'Gérer mon abonnement →'}
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Welcome ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-1">
            Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-400">Génère ton contenu Instagram & TikTok en quelques secondes</p>
        </div>

        {/* ── Form ── */}
        <div className="card-glass rounded-3xl p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: '#f093fb' }} />
            Personnalise ton contenu
          </h2>

          {/* Business name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de ton business
              <span className="ml-2 text-xs text-gray-500 font-normal">(optionnel mais recommandé)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ex : Le Colonel, Salon Éclat, Studio Move..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            {businessName.trim() && (
              <p className="mt-1.5 text-xs" style={{ color: '#f093fb' }}>
                ✓ L&apos;IA mentionnera &quot;{businessName.trim()}&quot; dans tes posts
              </p>
            )}
          </div>

          {/* Business description */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Décris ton business en quelques mots
              <span className="ml-2 text-xs text-gray-500 font-normal">(optionnel mais recommandé)</span>
            </label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Ex: Spécialisé dans la viande de bœuf belge, cadre élégant, terrasse à Bruxelles..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            {businessDescription.trim() && (
              <p className="mt-1.5 text-xs" style={{ color: '#f093fb' }}>
                ✓ L&apos;IA utilisera cette description pour créer du contenu 100% authentique
              </p>
            )}
          </div>

          {/* Grid: secteur + ville + ton + langue */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secteur d&apos;activité *</label>
              <div className="relative">
                <select value={secteur} onChange={e => setSecteur(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl text-white text-sm appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <option value="" disabled style={{ background: '#1a1a1a' }}>Choisis ton secteur...</option>
                  {SECTEURS.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ville *</label>
              <div className="relative">
                <select value={ville} onChange={e => setVille(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl text-white text-sm appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <option value="" disabled style={{ background: '#1a1a1a' }}>Choisis ta ville...</option>
                  {VILLES.map(v => <option key={v} value={v} style={{ background: '#1a1a1a' }}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Ton</label>
              <div className="flex gap-3">
                {([
                  { value: 'fun', label: '😄 Fun', desc: 'Décontracté' },
                  { value: 'pro', label: '💼 Pro', desc: 'Sérieux' },
                  { value: 'inspirant', label: '✨ Inspirant', desc: 'Motivant' },
                ] as const).map(t => (
                  <button key={t.value} onClick={() => setTon(t.value)}
                    className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all text-center"
                    style={{
                      background: ton === t.value ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${ton === t.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      color: ton === t.value ? 'white' : '#9ca3af',
                    }}>
                    <div>{t.label}</div>
                    <div className="text-xs opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Langue</label>
              <div className="flex gap-3">
                {([
                  { value: 'FR', label: '🇫🇷 Français' },
                  { value: 'NL', label: '🇧🇪 Nederlands' },
                  { value: 'EN', label: '🇬🇧 English' },
                ] as const).map(l => (
                  <button key={l.value} onClick={() => setLangue(l.value)}
                    className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all text-center"
                    style={{
                      background: langue === l.value ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${langue === l.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      color: langue === l.value ? 'white' : '#9ca3af',
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm text-center py-2 px-4 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" />Génération en cours... (10-20 sec)</>
              : <><Sparkles className="w-5 h-5" />
                  {businessName.trim() ? `Générer le contenu pour ${businessName.trim()}` : 'Générer mon contenu'}
                </>}
          </button>

          {loading && (
            <p className="text-center text-gray-500 text-xs mt-3">
              {businessDescription.trim()
                ? "L'IA utilise ta description pour créer du contenu 100% authentique..."
                : "L'IA crée 10 posts Instagram + 10 scripts TikTok sur mesure..."}
            </p>
          )}
        </div>

        {/* ── Results ── */}
        {content && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold">
                {businessName.trim()
                  ? <><span className="gradient-text">{businessName.trim()}</span> — contenu prêt !</>
                  : <>Ton contenu <span className="gradient-text">est prêt !</span></>}
              </h2>
              <span className="text-gray-500 text-sm">{secteur} · {ville}</span>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 mb-6">
              {([
                { id: 'instagram', icon: <Camera className="w-4 h-4" />, label: 'Instagram', count: content.instagram.length,
                  activeStyle: 'linear-gradient(135deg, #f093fb, #f5576c, #fd7551)' },
                { id: 'tiktok', icon: <Play className="w-4 h-4 fill-current" />, label: 'TikTok', count: content.tiktok.length,
                  activeStyle: 'linear-gradient(135deg, #000000, #333333)' },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: activeTab === tab.id ? tab.activeStyle : 'rgba(255,255,255,0.07)',
                    color: activeTab === tab.id ? 'white' : '#9ca3af',
                    border: `1px solid ${activeTab === tab.id
                      ? tab.id === 'tiktok' ? 'rgba(255,255,255,0.2)' : 'transparent'
                      : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {tab.icon}{tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {activeTab === 'instagram' && (
              <p className="text-gray-500 text-xs mb-4 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" style={{ color: '#f093fb' }} />
                Clique &quot;Générer l&apos;image&quot; pour créer un visuel DALL-E 3 adapté à chaque post
              </p>
            )}

            {/* Posts grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {currentPosts.map((post, i) => {
                const key = `${activeTab}-${i}`
                const isCopied = copied === key
                const imgState = imageStates[key]
                const isInsta = activeTab === 'instagram'

                return (
                  <div key={key} className="post-card p-5 text-gray-900">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {isInsta
                          ? <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c, #fd7551)' }}>
                              <Camera className="w-4 h-4" />
                            </div>
                          : <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>}
                        <span className="font-semibold text-sm">Post #{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(102,126,234,0.12)', color: '#667eea' }}>
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">Publier à {post.bestTime}</span>
                      </div>
                    </div>

                    {/* Generated image */}
                    {isInsta && imgState && (
                      <div className="mb-4">
                        {imgState.loading && (
                          <div className="w-full h-48 rounded-xl flex flex-col items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, rgba(240,147,251,0.08), rgba(253,117,81,0.08))', border: '1px dashed rgba(240,147,251,0.3)' }}>
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f093fb' }} />
                            <span className="text-xs text-gray-500">DALL-E 3 génère ton image...</span>
                          </div>
                        )}
                        {imgState.error && (
                          <div className="w-full p-3 rounded-xl flex items-start gap-2 text-xs"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{imgState.error}</span>
                          </div>
                        )}
                        {imgState.dataUrl && (
                          <div className="rounded-xl overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgState.dataUrl} alt={`Image post #${i + 1}`}
                              className="w-full object-cover" style={{ aspectRatio: '1/1' }} />
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-sm leading-relaxed mb-3 whitespace-pre-line text-gray-800">{post.text}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.hashtags.split(' ').filter(Boolean).map((tag, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(102,126,234,0.1)', color: '#667eea' }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleCopy(post.text, post.hashtags, key)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
                        style={{
                          background: isCopied ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.06)',
                          color: isCopied ? '#22c55e' : '#555',
                          border: `1px solid ${isCopied ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.1)'}`,
                        }}>
                        {isCopied ? <><Check className="w-3.5 h-3.5" />Copié !</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
                      </button>

                      {isInsta && !imgState?.dataUrl && (
                        <button onClick={() => handleGenerateImage(post, key)} disabled={imgState?.loading}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, rgba(240,147,251,0.15), rgba(253,117,81,0.15))', color: '#f093fb', border: '1px solid rgba(240,147,251,0.3)' }}>
                          {imgState?.loading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Génération...</>
                            : <><ImageIcon className="w-3.5 h-3.5" />Générer l&apos;image</>}
                        </button>
                      )}

                      {isInsta && imgState?.dataUrl && (
                        <button onClick={() => handleGenerateImage(post, key)}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
                          style={{ background: 'rgba(0,0,0,0.06)', color: '#888', border: '1px solid rgba(0,0,0,0.1)' }}>
                          <ImageIcon className="w-3.5 h-3.5" />Régénérer
                        </button>
                      )}

                      {isInsta && imgState?.dataUrl && (
                        <button onClick={() => handleDownload(imgState.dataUrl!, i)}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
                          style={{ background: 'rgba(102,126,234,0.1)', color: '#667eea', border: '1px solid rgba(102,126,234,0.25)' }}>
                          <Download className="w-3.5 h-3.5" />Télécharger
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-center mt-8">
              <button onClick={handleGenerate} disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#d1d5db' }}>
                <Sparkles className="w-4 h-4" />Régénérer un nouveau lot
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
