'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Camera, Play, Check, Star, Zap, Clock, Copy } from 'lucide-react'

const DEMO_POSTS = [
  {
    platform: 'instagram',
    text: '🌟 Chez Boulangerie Dupont à Liège, chaque matin commence avec l\'amour du pain fait maison. Nos croissants fondent en bouche — venez les découvrir avant 10h !',
    hashtags: '#BoulangerieLiège #PainArtisanal #BelgiqueFoodie #MadeInBelgique #Croissant',
    time: '08:00',
  },
  {
    platform: 'tiktok',
    text: '🎬 Script TikTok\n\n[OUVERTURE] Zoom sur des croissants dorés qui sortent du four...\n\n[VOIX] "Tu veux savoir le secret d\'un croissant parfait à Liège ?"\n\n[REVEAL] Notre boulanger pétrit la pâte depuis 4h du matin !\n\n[CTA] Viens avant 10h — ils partent VITE 🔥',
    hashtags: '#Liège #Boulangerie #FoodTikTok #Belgique #Croissant',
    time: '09:30',
  },
]

export default function LandingPage() {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between card-glass">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl">ContentAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
            Connexion
          </Link>
          <Link href="/register" className="btn-primary px-4 py-2 rounded-full text-sm font-semibold text-white">
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f093fb, transparent)' }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fd7551, transparent)' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ background: 'rgba(240,147,251,0.15)', border: '1px solid rgba(240,147,251,0.3)' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#f093fb' }} />
            <span style={{ color: '#f093fb' }}>Propulsé par l&apos;IA · Made for Belgium 🇧🇪</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Génère ton contenu{' '}
            <span className="gradient-text">Instagram & TikTok</span>
            <br />en 10 secondes
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            ContentAI crée des posts authentiques et des scripts TikTok pour les petits business belges.
            En français, néerlandais ou anglais. Prêts à publier.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register"
              className="btn-primary px-8 py-4 rounded-2xl text-lg font-bold text-white pulse-glow">
              🚀 Essayer gratuitement 14 jours
            </Link>
            <a href="#demo" className="flex items-center gap-2 px-6 py-4 rounded-2xl text-gray-300 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
              <Play className="w-5 h-5" />
              Voir la démo
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-500">Aucune carte de crédit requise · Annulation à tout moment</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '200+', label: 'Business belges' },
            { value: '50k+', label: 'Posts générés' },
            { value: '4.9/5', label: 'Note moyenne' },
          ].map((stat) => (
            <div key={stat.label} className="card-glass rounded-2xl p-6">
              <div className="text-3xl font-extrabold gradient-text mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo section */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-4">
            Démo en <span className="gradient-text">direct</span>
          </h2>
          <p className="text-center text-gray-400 mb-12">Voici ce que ContentAI génère pour une boulangerie à Liège</p>

          <div className="grid md:grid-cols-2 gap-6">
            {DEMO_POSTS.map((post, i) => (
              <div key={i} className="post-card p-5 text-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {post.platform === 'instagram' ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c, #fd7551)' }}>
                        <Camera className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                    <span className="font-semibold text-sm capitalize">{post.platform}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {post.time}
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-3 whitespace-pre-line">{post.text}</p>
                <p className="text-xs font-medium mb-4" style={{ color: '#667eea' }}>{post.hashtags}</p>

                <button
                  onClick={() => handleCopy(`${post.text}\n\n${post.hashtags}`, i)}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
                  style={{
                    background: copied === i ? 'rgba(102,126,234,0.1)' : 'rgba(0,0,0,0.05)',
                    color: copied === i ? '#667eea' : '#666',
                    border: `1px solid ${copied === i ? 'rgba(102,126,234,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  }}>
                  <Copy className="w-3 h-3" />
                  {copied === i ? 'Copié !' : 'Copier'}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/register" className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Générer mon contenu maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-12">
            Tout ce dont tu as <span className="gradient-text">besoin</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🇧🇪', title: 'Made for Belgium', desc: 'Contenu adapté à la culture belge, en FR, NL ou EN. Mentions de villes, références locales.' },
              { icon: '⚡', title: '10 posts en 10 sec', desc: 'Instagram et TikTok générés simultanément. Texte, hashtags et heure de publication optimale.' },
              { icon: '🎨', title: '3 tons au choix', desc: 'Fun, professionnel ou inspirant. L\'IA adapte le style à ta marque et ton audience.' },
              { icon: '📋', title: 'Copie en 1 clic', desc: 'Chaque post est prêt à coller directement dans Instagram ou TikTok.' },
              { icon: '🏪', title: 'Tous secteurs', desc: 'Resto, beauté, fitness, commerce, artisan, tech... L\'IA connaît ton secteur.' },
              { icon: '📅', title: 'Horaires optimisés', desc: 'ContentAI recommande la meilleure heure de publication pour maximiser ta portée.' },
            ].map((f) => (
              <div key={f.title} className="card-glass rounded-2xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-4">
            Un prix <span className="gradient-text">simple</span>
          </h2>
          <p className="text-gray-400 mb-10">Pas de surprise. Tout inclus.</p>

          <div className="card-glass rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, #f093fb, transparent)' }} />

            <div className="relative z-10">
              <div className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-4"
                style={{ background: 'rgba(240,147,251,0.2)', color: '#f093fb', border: '1px solid rgba(240,147,251,0.3)' }}>
                ⭐ Le plus populaire
              </div>

              <div className="flex items-end justify-center gap-2 mb-2">
                <span className="text-6xl font-extrabold gradient-text">39€</span>
                <span className="text-gray-400 mb-3">/mois</span>
              </div>
              <p className="text-gray-400 text-sm mb-8">ou 390€/an (2 mois offerts)</p>

              <ul className="space-y-3 mb-8 text-left">
                {[
                  'Générations illimitées',
                  '10 posts Instagram / génération',
                  '10 scripts TikTok / génération',
                  'FR + NL + EN',
                  'Tous les secteurs',
                  'Heure de publication optimisée',
                  'Support par email',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#f093fb' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register"
                className="btn-primary w-full py-4 rounded-2xl text-white font-bold text-lg block text-center pulse-glow">
                Essayer gratuitement 14 jours
              </Link>
              <p className="text-gray-500 text-xs mt-3">Aucune carte de crédit requise</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10">
            Ce que disent nos <span className="gradient-text">clients</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sophie V.', role: 'Salon de coiffure · Bruxelles', text: '"J\'économise 3h par semaine sur mon contenu. Mes posts ont 2x plus d\'engagement !"', stars: 5 },
              { name: 'Marc D.', role: 'Restaurant · Gent', text: '"Parfait pour publier en néerlandais. Le ton est naturel, pas du tout robotique."', stars: 5 },
              { name: 'Amina B.', role: 'Boutique mode · Liège', text: '"Le rapport qualité-prix est imbattable. 39€ pour tout ce que ça fait, c\'est cadeau."', stars: 5 },
            ].map((t) => (
              <div key={t.name} className="card-glass rounded-2xl p-5">
                <div className="flex mb-2">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#fd7551' }} />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-4 italic">{t.text}</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">
            Prêt à booster ton{' '}
            <span className="gradient-text">contenu ?</span>
          </h2>
          <p className="text-gray-400 mb-8">Rejoins 200+ business belges qui gagnent du temps chaque semaine.</p>
          <Link href="/register"
            className="btn-primary px-10 py-5 rounded-2xl text-white font-bold text-xl inline-block pulse-glow">
            🚀 Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-gray-600 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" style={{ color: '#f093fb' }} />
          <span className="font-bold text-white">ContentAI</span>
        </div>
        <p>Made with ❤️ in Belgium · © 2025 ContentAI</p>
      </footer>
    </div>
  )
}
