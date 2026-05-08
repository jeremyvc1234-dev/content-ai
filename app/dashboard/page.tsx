'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Camera, Play, Clock, Copy, Check, Zap, LogOut,
  ChevronDown, Loader2, ImageIcon, Download, Building2,
  AlertCircle, Search, MessageSquare, ChevronRight, X,
  Globe, UtensilsCrossed, ThumbsUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post { text: string; hashtags: string; bestTime: string }
interface GeneratedContent { instagram: Post[]; tiktok: Post[] }
interface ImageState { loading: boolean; dataUrl: string | null; error: string | null }

interface RestaurantAnalysis {
  name: string
  description: string
  specialties: string[]
  highlights: string[]
  reviews: { source: string; text: string; rating?: string }[]
  websiteUrl: string | null
  sources: string[]
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

const SOURCE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  TripAdvisor: { bg: 'rgba(0,166,81,0.12)', color: '#00a651', border: 'rgba(0,166,81,0.25)' },
  TheFork: { bg: 'rgba(82,186,82,0.12)', color: '#52ba52', border: 'rgba(82,186,82,0.25)' },
  Yelp: { bg: 'rgba(196,4,4,0.1)', color: '#c40404', border: 'rgba(196,4,4,0.2)' },
  Foursquare: { bg: 'rgba(249,84,84,0.1)', color: '#f95454', border: 'rgba(249,84,84,0.2)' },
  Guide: { bg: 'rgba(255,204,0,0.12)', color: '#b38a00', border: 'rgba(255,204,0,0.25)' },
  Web: { bg: 'rgba(102,126,234,0.1)', color: '#667eea', border: 'rgba(102,126,234,0.2)' },
}

function sourceStyle(source: string) {
  return SOURCE_COLORS[source] ?? SOURCE_COLORS.Web
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [secteur, setSecteur] = useState('')
  const [ville, setVille] = useState('')
  const [ton, setTon] = useState<'fun' | 'pro' | 'inspirant'>('fun')
  const [langue, setLangue] = useState<'FR' | 'NL' | 'EN'>('FR')

  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [restaurantData, setRestaurantData] = useState<RestaurantAnalysis | null>(null)

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'instagram' | 'tiktok'>('instagram')
  const [imageStates, setImageStates] = useState<Record<string, ImageState>>({})

  const isRestaurant = secteur === 'Restaurant / Café'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser({
        email: data.user.email ?? '',
        name: data.user.user_metadata?.full_name ?? data.user.email ?? '',
      })
    })
  }, [router])

  useEffect(() => {
    if (!isRestaurant) setRestaurantData(null)
  }, [isRestaurant])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAnalyze = async () => {
    if (!businessName.trim()) { setAnalyzeError('Entre le nom du restaurant.'); return }
    if (!ville) { setAnalyzeError('Choisis la ville du restaurant.'); return }
    setAnalyzeLoading(true)
    setAnalyzeError('')
    setRestaurantData(null)

    try {
      const res = await fetch('/api/analyze-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: businessName.trim(), ville }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRestaurantData(data)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setAnalyzeLoading(false)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secteur, ville, ton, langue, businessName, restaurantData }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const data = await res.json()
      setContent(data)
      setActiveTab('instagram')
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
        headers: { 'Content-Type': 'application/json' },
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
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <LogOut className="w-4 h-4" /><span className="hidden sm:block">Déconnexion</span>
            </button>
          </div>
        )}
      </header>

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

          {/* Business / restaurant name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {isRestaurant ? 'Nom du restaurant' : 'Nom de ton business'}
              <span className="ml-2 text-xs text-gray-500 font-normal">(optionnel mais recommandé)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); if (restaurantData) setRestaurantData(null) }}
                  placeholder={isRestaurant
                    ? 'ex : Le Colonel, La Maison du Peuple...'
                    : 'ex : Salon Éclat, Studio Move...'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* Analyze button — restaurants only */}
              {isRestaurant && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeLoading || !businessName.trim() || !ville}
                  title={!ville ? 'Choisis d\'abord la ville' : ''}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 whitespace-nowrap"
                  style={{
                    background: restaurantData
                      ? 'rgba(34,197,94,0.15)'
                      : 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))',
                    border: restaurantData ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(102,126,234,0.35)',
                    color: restaurantData ? '#22c55e' : '#a78bfa',
                  }}>
                  {analyzeLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Analyse...</>
                    : restaurantData
                    ? <><Check className="w-4 h-4" />Analysé !</>
                    : <><Search className="w-4 h-4" />Analyser</>}
                </button>
              )}
            </div>

            {/* Hint text */}
            {isRestaurant && !restaurantData && !analyzeLoading && (
              <p className="mt-1.5 text-xs text-gray-500">
                {!ville
                  ? '👆 Choisis la ville, puis clique "Analyser" pour importer le site web et les avis'
                  : '🔍 Clique "Analyser" — ContentAI visite le site du restaurant et lit les avis en ligne'}
              </p>
            )}
            {!isRestaurant && businessName.trim() && (
              <p className="mt-1.5 text-xs" style={{ color: '#f093fb' }}>
                ✓ L&apos;IA mentionnera &quot;{businessName.trim()}&quot; dans tes posts
              </p>
            )}
            {analyzeError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{analyzeError}
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
                  {restaurantData ? `Générer le contenu pour ${restaurantData.name}` : 'Générer mon contenu'}
                </>}
          </button>

          {loading && (
            <p className="text-center text-gray-500 text-xs mt-3">
              {restaurantData
                ? `L'IA utilise les vraies infos de ${restaurantData.name} pour créer du contenu authentique...`
                : "L'IA crée 10 posts Instagram + 10 scripts TikTok sur mesure..."}
            </p>
          )}
        </div>

        {/* ── Restaurant Analysis Card ── */}
        {restaurantData && (
          <div className="mb-8 rounded-3xl overflow-hidden"
            style={{ border: '1px solid rgba(102,126,234,0.25)', background: 'rgba(102,126,234,0.05)' }}>

            {/* Card header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: 'rgba(102,126,234,0.1)', borderBottom: '1px solid rgba(102,126,234,0.18)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  <Search className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">
                    Voici ce qu&apos;on a trouvé sur {restaurantData.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Ces données seront intégrées dans la génération IA
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Source badges */}
                <div className="hidden sm:flex gap-1.5">
                  {restaurantData.sources.map(src => {
                    const style = sourceStyle(src)
                    return (
                      <span key={src} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                        {src}
                      </span>
                    )
                  })}
                </div>
                <button onClick={() => setRestaurantData(null)}
                  className="text-gray-500 hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* Description */}
              {restaurantData.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Description trouvée
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {restaurantData.description.slice(0, 350)}
                    {restaurantData.description.length > 350 ? '…' : ''}
                  </p>
                  {restaurantData.websiteUrl && (
                    <a href={restaurantData.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs mt-1.5 hover:opacity-80 transition-opacity"
                      style={{ color: '#667eea' }}>
                      <Globe className="w-3 h-3" />
                      {new URL(restaurantData.websiteUrl).hostname}
                    </a>
                  )}
                </div>
              )}

              {/* Specialties */}
              {restaurantData.specialties.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Spécialités & plats détectés
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {restaurantData.specialties.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{ background: 'rgba(240,147,251,0.12)', color: '#f093fb', border: '1px solid rgba(240,147,251,0.2)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {restaurantData.highlights.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Points forts dans les avis
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {restaurantData.highlights.map(h => (
                      <span key={h} className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{ background: 'rgba(253,117,81,0.12)', color: '#fd7551', border: '1px solid rgba(253,117,81,0.22)' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews from web */}
              {restaurantData.reviews.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Avis trouvés en ligne ({restaurantData.reviews.length})
                  </p>
                  <div className="space-y-2.5">
                    {restaurantData.reviews.map((rev, i) => {
                      const style = sourceStyle(rev.source)
                      return (
                        <div key={i} className="p-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                              {rev.source}
                            </span>
                            {rev.rating && (
                              <span className="text-xs font-medium" style={{ color: '#fd7551' }}>
                                ⭐ {rev.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">{rev.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Confirmation banner */}
              <div className="flex items-center gap-2 text-xs pt-1"
                style={{ color: '#22c55e' }}>
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">
                  Ces informations seront injectées dans le prompt Claude pour un contenu 100% personnalisé
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {content && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold">
                {(restaurantData?.name || businessName.trim())
                  ? <><span className="gradient-text">{restaurantData?.name || businessName.trim()}</span> — contenu prêt !</>
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
