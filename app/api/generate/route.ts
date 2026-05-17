import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

function safe(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    out += (c === 0xFEFF || c > 0x00FF) ? ' ' : s[i]
  }
  return out.replace(/\s+/g, ' ').trim()
}

const rawKey = process.env.ANTHROPIC_API_KEY ?? ''
const client = new Anthropic({ apiKey: safe(rawKey) })

export async function POST(request: NextRequest) {
  try {
    const { secteur, ville, ton, langue, businessName, businessDescription } = await request.json()

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
    const businessLabel = businessName?.trim() ? safe(businessName.trim()) : null
    const descriptionBlock = businessDescription?.trim()
      ? `\nDescription du business fournie par le proprietaire:\n"${safe(businessDescription.trim())}"\nBase-toi sur cette description pour creer du contenu 100% authentique et personnalise.\n`
      : ''

    const prompt = `Tu es un expert en marketing des reseaux sociaux pour les petits business belges.

Genere du contenu pour:
- Secteur: ${safe(secteur)}
- Ville: ${safe(ville)}, Belgique
- Ton: ${tonLabel}
- Langue: ${langueLabel}${businessLabel ? `\n- Nom du business: ${businessLabel}` : ''}
${descriptionBlock}
Genere EXACTEMENT ce JSON (rien d'autre, pas de markdown, juste le JSON pur):
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
      "text": "script TikTok avec [OUVERTURE], [DEVELOPPEMENT], [CTA] clairement structures (max 120 mots)",
      "hashtags": "#hashtag1 #hashtag2 ... (8-10 hashtags)",
      "bestTime": "HH:MM"
    }
  ]
}

Regles generales:
- instagram: exactement 10 posts differents et varies
- tiktok: exactement 10 scripts differents et varies
- Chaque post doit etre unique et traiter un angle different
- Mentionne la ville belge naturellement dans certains posts
- Les horaires doivent etre realistes pour maximiser l'engagement
- Adapte parfaitement le ton demande
- Contenu 100% en ${langueLabel}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Réponse invalide')

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
