import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface RestaurantAnalysis {
  name: string
  description: string
  specialties: string[]
  highlights: string[]
  reviews: { source: string; text: string; rating?: string }[]
  websiteUrl: string | null
  sources: string[]
}

function buildRestaurantBlock(data: RestaurantAnalysis): string {
  const specialtyLine = data.specialties.length
    ? `Spécialités et plats détectés: ${data.specialties.join(', ')}`
    : ''
  const highlightLine = data.highlights.length
    ? `Points forts récurrents dans les avis: ${data.highlights.join(', ')}`
    : ''
  const reviewLines = data.reviews
    .map((r, i) => `  ${i + 1}. [${r.source}${r.rating ? ' · ' + r.rating : ''}] "${r.text}"`)
    .join('\n')
  const sourceNote = data.sources.length
    ? `Sources analysées: ${data.sources.join(', ')}`
    : ''

  return `
================================================
DONNEES REELLES DU RESTAURANT - BASE-TOI EXCLUSIVEMENT SUR CES INFORMATIONS:
================================================
Nom: ${data.name}
${data.description ? `Description: ${data.description}` : ''}
${specialtyLine}
${highlightLine}
${data.websiteUrl ? `Site web: ${data.websiteUrl}` : ''}
${sourceNote}

AVIS ET DESCRIPTIONS CLIENTS TROUVES EN LIGNE:
${reviewLines || '  (aucun avis trouve, base-toi sur les specialites et la description)'}
================================================

RÈGLES CRITIQUES:
- Utilise le nom exact "${data.name}" dans au moins 6 posts sur 10
- Mentionne UNIQUEMENT les vraies spécialités détectées ci-dessus
- Puise dans les vrais points forts des avis pour les arguments marketing
- Varie les angles: plat signature, ambiance, histoire, événement, coulisses, dégustation...
- Chaque post doit sembler écrit par quelqu'un qui connaît vraiment ce restaurant`
}

export async function POST(request: NextRequest) {
  try {
    const { secteur, ville, ton, langue, businessName, restaurantData } = await request.json()

    if (!secteur || !ville || !ton || !langue) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const langueLabel =
      langue === 'FR' ? 'français' : langue === 'NL' ? 'néerlandais' : 'anglais'
    const tonLabel =
      ton === 'fun'
        ? 'fun et décontracté'
        : ton === 'pro'
        ? 'professionnel et sérieux'
        : 'inspirant et motivant'
    const businessLabel = businessName?.trim() || null
    const hasRestaurantData = restaurantData?.name

    const prompt = `Tu es un expert en marketing des réseaux sociaux pour les petits business belges.

Génère du contenu pour:
- Secteur: ${secteur}
- Ville: ${ville}, Belgique
- Ton: ${tonLabel}
- Langue: ${langueLabel}${businessLabel && !hasRestaurantData ? `\n- Nom du business: ${businessLabel}` : ''}
${hasRestaurantData ? buildRestaurantBlock(restaurantData as RestaurantAnalysis) : ''}

Génère EXACTEMENT ce JSON (rien d'autre, pas de markdown, juste le JSON pur):
{
  "instagram": [
    {
      "text": "texte du post (max 150 mots, avec emojis, authentique et local)",
      "hashtags": "#hashtag1 #hashtag2 ... (10-15 hashtags pertinents)",
      "bestTime": "HH:MM"
    }
  ],
  "tiktok": [
    {
      "text": "script TikTok avec [OUVERTURE], [DÉVELOPPEMENT], [CTA] clairement structurés (max 120 mots)",
      "hashtags": "#hashtag1 #hashtag2 ... (8-10 hashtags)",
      "bestTime": "HH:MM"
    }
  ]
}

Règles générales:
- instagram: exactement 10 posts différents et variés
- tiktok: exactement 10 scripts différents et variés
- Chaque post doit être unique et traiter un angle différent
- Mentionne la ville belge naturellement dans certains posts
- Les horaires doivent être réalistes pour maximiser l'engagement
- Adapte parfaitement le ton demandé
- Contenu 100% en ${langueLabel}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Réponse invalide')

    // Strip markdown code fences if Claude wrapped the JSON
    const jsonText = content.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const parsed = JSON.parse(jsonText)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération. Réessaie dans un instant.' },
      { status: 500 }
    )
  }
}
