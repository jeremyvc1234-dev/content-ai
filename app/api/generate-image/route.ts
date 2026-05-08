import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { postText, secteur, businessName, ville } = await request.json()

    if (!postText) {
      return NextResponse.json({ error: 'Texte du post manquant' }, { status: 400 })
    }

    const businessCtx = businessName?.trim() ? `pour "${businessName.trim()}"` : ''
    const villeCtx = ville ? `à ${ville}, Belgique` : 'en Belgique'

    const imagePrompt = `Professional social media photo ${businessCtx} ${villeCtx}, ${secteur} business.
Context from post: ${postText.slice(0, 200)}
Style: vibrant, modern, authentic Belgian small business aesthetic, warm natural lighting, high quality commercial photography, Instagram-ready, no text or logos in the image.`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) {
      throw new Error('Pas de données image reçues')
    }

    return NextResponse.json({ image: `data:image/png;base64,${b64}` })
  } catch (error) {
    console.error('Image generation error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Erreur génération image: ${message}` },
      { status: 500 }
    )
  }
}
