'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, LogOut, History, Camera, Play, Trash2, Eye,
  ChevronDown, Filter, X, Clock, CalendarDays, EyeOff,
  Copy, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post { text: string; hashtags: string; bestTime: string }
interface Generation {
  id: string
  secteur: string
  ville: string
  ton: string
  langue: string
  description: string | null
  posts: { instagram: Post[]; tiktok: Post[] }
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-BE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TON_LABEL: Record<string, string> = { fun: '😄 Fun', pro: '💼 Pro', inspirant: '✨ Inspirant' }
const LANGUE_FLAG: Record<string, string> = { FR: '🇫🇷', NL: '🇧🇪', EN: '🇬🇧' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoriquePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedTab, setExpandedTab] = useState<'instagram' | 'tiktok'>('instagram')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Filters
  const [filterSecteur, setFilterSecteur] = useState('')
  const [filterDate, setFilterDate] = useState<'all' | '7d' | '30d' | '90d'>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser({ email: data.user.email ?? '' })
    })

    fetch('/api/generations')
      .then(r => r.json())
      .then((data: Generation[]) => { setGenerations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  const secteurs = useMemo(() =>
    [...new Set(generations.map(g => g.secteur))].sort(), [generations])

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoffs: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    return generations.filter(g => {
      if (filterSecteur && g.secteur !== filterSecteur) return false
      if (filterDate !== 'all') {
        const days = cutoffs[filterDate]
        if (now - new Date(g.created_at).getTime() > days * 86400_000) return false
      }
      return true
    })
  }, [generations, filterSecteur, filterDate])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette génération ?')) return
    setDeletingId(id)
    try {
      await fetch('/api/generations', { method: 'DELETE', body: JSON.stringify({ id }) })
      setGenerations(prev => prev.filter(g => g.id !== id))
      if (expandedId === id) setExpandedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRevoir = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setExpandedTab('instagram')
  }

  const handleCopy = (text: string, hashtags: string, key: string) => {
    navigator.clipboard.writeText(`${text}\n\n${hashtags}`)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

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
        <nav className="flex items-center gap-4">
          <Link href="/dashboard"
            className="text-gray-400 hover:text-white text-sm transition-colors hidden sm:block">
            Dashboard
          </Link>
          <Link href="/dashboard/historique"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#f093fb' }}>
            <History className="w-4 h-4" />
            <span className="hidden sm:block">Historique</span>
          </Link>
          {user && (
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <LogOut className="w-4 h-4" /><span className="hidden sm:block">Déconnexion</span>
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-3">
            <History className="w-7 h-7" style={{ color: '#f093fb' }} />
            Historique des générations
          </h1>
          <p className="text-gray-400">
            {loading ? 'Chargement...' : `${generations.length} génération${generations.length > 1 ? 's' : ''} sauvegardée${generations.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="card-glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />

          {/* Secteur filter */}
          <div className="relative">
            <select value={filterSecteur} onChange={e => setFilterSecteur(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl text-sm appearance-none cursor-pointer text-white"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <option value="" style={{ background: '#1a1a1a' }}>Tous les secteurs</option>
              {secteurs.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Date filter */}
          <div className="flex gap-2">
            {([
              { value: 'all', label: 'Tout' },
              { value: '7d', label: '7 jours' },
              { value: '30d', label: '30 jours' },
              { value: '90d', label: '90 jours' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setFilterDate(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filterDate === opt.value ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.05)',
                  color: filterDate === opt.value ? 'white' : '#9ca3af',
                  border: `1px solid ${filterDate === opt.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {(filterSecteur || filterDate !== 'all') && (
            <button onClick={() => { setFilterSecteur(''); setFilterDate('all') }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors ml-auto">
              <X className="w-3.5 h-3.5" />Réinitialiser
            </button>
          )}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement de l&apos;historique...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 card-glass rounded-3xl">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">
              {generations.length === 0 ? 'Aucune génération pour le moment' : 'Aucun résultat pour ces filtres'}
            </p>
            <p className="text-gray-600 text-sm">
              {generations.length === 0
                ? 'Génère ton premier contenu depuis le dashboard !'
                : 'Essaie d\'élargir les filtres.'}
            </p>
            {generations.length === 0 && (
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white btn-primary">
                <Sparkles className="w-4 h-4" />Générer du contenu
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(gen => {
              const isExpanded = expandedId === gen.id
              const totalPosts = (gen.posts?.instagram?.length ?? 0) + (gen.posts?.tiktok?.length ?? 0)
              const currentPosts = isExpanded ? (gen.posts?.[expandedTab] ?? []) : []

              return (
                <div key={gen.id} className="card-glass rounded-2xl overflow-hidden transition-all">

                  {/* ── Row ── */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-semibold text-white truncate">{gen.secteur}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-300">{gen.ville}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea' }}>
                          {LANGUE_FLAG[gen.langue]} {gen.langue}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(240,147,251,0.1)', color: '#f093fb' }}>
                          {TON_LABEL[gen.ton] ?? gen.ton}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(gen.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {totalPosts} posts générés
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleRevoir(gen.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: isExpanded ? 'rgba(240,147,251,0.15)' : 'rgba(255,255,255,0.06)',
                          color: isExpanded ? '#f093fb' : '#d1d5db',
                          border: `1px solid ${isExpanded ? 'rgba(240,147,251,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                        {isExpanded
                          ? <><EyeOff className="w-4 h-4" />Masquer</>
                          : <><Eye className="w-4 h-4" />Revoir</>}
                      </button>
                      <button onClick={() => handleDelete(gen.id)} disabled={deletingId === gen.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:block">{deletingId === gen.id ? '...' : 'Supprimer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded posts ── */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-5">
                      {/* Tab switcher */}
                      <div className="flex gap-2 mb-5">
                        {([
                          { id: 'instagram', icon: <Camera className="w-4 h-4" />, label: 'Instagram',
                            count: gen.posts?.instagram?.length ?? 0,
                            activeStyle: 'linear-gradient(135deg, #f093fb, #f5576c, #fd7551)' },
                          { id: 'tiktok', icon: <Play className="w-4 h-4 fill-current" />, label: 'TikTok',
                            count: gen.posts?.tiktok?.length ?? 0,
                            activeStyle: 'linear-gradient(135deg, #000000, #333333)' },
                        ] as const).map(tab => (
                          <button key={tab.id} onClick={() => setExpandedTab(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                            style={{
                              background: expandedTab === tab.id ? tab.activeStyle : 'rgba(255,255,255,0.05)',
                              color: expandedTab === tab.id ? 'white' : '#9ca3af',
                              border: `1px solid ${expandedTab === tab.id
                                ? tab.id === 'tiktok' ? 'rgba(255,255,255,0.2)' : 'transparent'
                                : 'rgba(255,255,255,0.1)'}`,
                            }}>
                            {tab.icon}{tab.label} ({tab.count})
                          </button>
                        ))}
                      </div>

                      {/* Posts grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {currentPosts.map((post, i) => {
                          const key = `${gen.id}-${expandedTab}-${i}`
                          const isCopied = copied === key
                          return (
                            <div key={key} className="post-card p-4 text-gray-900">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {expandedTab === 'instagram'
                                    ? <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                                        style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c, #fd7551)' }}>
                                        <Camera className="w-3.5 h-3.5" />
                                      </div>
                                    : <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                                      </div>}
                                  <span className="font-semibold text-sm">Post #{i + 1}</span>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(102,126,234,0.12)', color: '#667eea' }}>
                                  {post.bestTime}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed mb-3 whitespace-pre-line text-gray-800">
                                {post.text}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {post.hashtags.split(' ').filter(Boolean).map((tag, j) => (
                                  <span key={j} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: 'rgba(102,126,234,0.1)', color: '#667eea' }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <button onClick={() => handleCopy(post.text, post.hashtags, key)}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
                                style={{
                                  background: isCopied ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.06)',
                                  color: isCopied ? '#22c55e' : '#555',
                                  border: `1px solid ${isCopied ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.1)'}`,
                                }}>
                                {isCopied ? <><Check className="w-3.5 h-3.5" />Copié !</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
