import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string
  url: string
  snippet: string
}

// ─── DuckDuckGo HTML search ───────────────────────────────────────────────────

async function ddgSearch(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=be-fr`,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-BE,fr;q=0.9',
        },
        signal: AbortSignal.timeout(9000),
      }
    )
    if (!res.ok) return []

    const html = await res.text()
    const $ = cheerio.load(html)
    const results: SearchResult[] = []

    $('div.result, div.results_links').each((_, el) => {
      const titleEl = $(el).find('a.result__a, h2 a').first()
      const title = titleEl.text().trim()
      const href = titleEl.attr('href') ?? ''
      const snippet = $(el).find('.result__snippet, .result-snippet').text().trim()

      let url = href
      const uddgMatch = href.match(/[?&]uddg=([^&]+)/)
      if (uddgMatch) {
        url = decodeURIComponent(uddgMatch[1])
      } else if (href.startsWith('//')) {
        url = 'https:' + href
      }

      if (title && url && url.startsWith('http')) {
        results.push({ title, url, snippet: sanitizeText(snippet) })
      }
    })

    return results.slice(0, 10)
  } catch {
    return []
  }
}

// ─── Official site detection ──────────────────────────────────────────────────

const SOCIAL_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'youtube.com', 'linkedin.com', 'pinterest.com', 'tiktok.com',
]
const REVIEW_DOMAINS = [
  'tripadvisor', 'thefork', 'lafourchette', 'yelp.com',
  'foursquare', 'bonapp', 'restovisit', 'google.com', 'maps.google',
  'pages.google', 'le-guide.michelin', 'gault-millau',
]
const DIRECTORY_DOMAINS = [
  'yellowpages', 'pagesdor', 'infobel', 'horeca.be', 'menuonline',
  'restoreservation', 'reco', 'deliveroo', 'ubereats', 'takeaway',
]

function isBlockedDomain(url: string): boolean {
  return (
    SOCIAL_DOMAINS.some(d => url.includes(d)) ||
    REVIEW_DOMAINS.some(d => url.includes(d)) ||
    DIRECTORY_DOMAINS.some(d => url.includes(d))
  )
}

function findOfficialUrl(results: SearchResult[], name: string): string | null {
  const nameParts = name
    .toLowerCase()
    .split(/\s+/)
    .filter(p => p.length > 2)

  for (const r of results) {
    if (isBlockedDomain(r.url)) continue
    const domain = r.url.replace(/https?:\/\//, '').split('/')[0].toLowerCase()
    if (nameParts.some(part => domain.includes(part))) return r.url
  }

  return results.find(r => !isBlockedDomain(r.url))?.url ?? null
}

// ─── Text sanitizer ───────────────────────────────────────────────────────────

function sanitizeText(text: string): string {
  // Replace BOM and any character whose code point exceeds 255 (non-Latin-1)
  // so scraped content never causes ByteString errors in fetch() headers/body.
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    out += (c === 0xFEFF || c > 0x00FF) ? ' ' : text[i]
  }
  return out.replace(/\s+/g, ' ').trim()
}

// ─── Website scraper ──────────────────────────────────────────────────────────

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return ''

    const html = await res.text()
    const $ = cheerio.load(html)

    $(
      'script, style, nav, footer, header, aside, iframe, noscript, ' +
      '[class*="cookie"], [class*="popup"], [class*="banner"], [id*="cookie"]'
    ).remove()

    const selectors = [
      'main', 'article', '[role="main"]',
      '#content', '.content', '.main-content',
      '.about', '.restaurant', '.presentation', '.description',
      '.menu', '.carte', '.plats',
      'body',
    ]
    for (const sel of selectors) {
      const raw = $(sel).first().text()
      const text = sanitizeText(raw)
      if (text.length > 150) return text.slice(0, 4000)
    }
    return ''
  } catch {
    return ''
  }
}

// ─── Content extraction ───────────────────────────────────────────────────────

const FOOD_RE =
  /\b(steak|viande|grillé|frites|carbonnade|waterzooi|moules|crevettes|homard|gambas|saumon|thon|tartare|carpaccio|entrecôte|côte(?: à l'os)?|filet(?: pur)?|magret|poulet|risotto|pasta|pâtes|pizza|burger|brunch|brochette|lasagne|tiramisu|crème brûlée|fondant|dessert|plat du jour|menu|spécialité|cuisine belge|bières artisanales|vins|fromages|charcuterie|vol-au-vent|stomp|boulets|lapin|canard)\b/gi

function extractSpecialties(texts: string[]): string[] {
  const combined = texts.join(' ')
  const matches = combined.match(FOOD_RE) ?? []
  return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 12)
}

const HIGHLIGHT_RE =
  /\b(excellent|délicieux|exceptionnel|parfait|magnifique|incroyable|formidable|authentique|frais|qualité|recommande|meilleur|savoureux|généreux|raffiné|convivial|chaleureux|accueil|service|ambiance|copieux|goûteux|succulent)\b/gi

function extractHighlights(texts: string[]): string[] {
  const combined = texts.join(' ')
  const matches = combined.match(HIGHLIGHT_RE) ?? []
  return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 10)
}

interface ReviewItem {
  source: string
  text: string
  rating?: string
}

function extractReviews(results: SearchResult[]): ReviewItem[] {
  const reviews: ReviewItem[] = []

  for (const r of results) {
    if (!r.snippet || r.snippet.length < 40) continue
    const url = r.url.toLowerCase()

    const isReviewPlatform = REVIEW_DOMAINS.some(d => url.includes(d))
    const ratingMatch = r.snippet.match(
      /(\d[,.]?\d?)\s*\/\s*5|(\d[,.]?\d?)\s*étoiles?|noté\s+(\d[,.]?\d?)|note\s*:\s*(\d[,.]?\d?)/i
    )
    const rating = ratingMatch
      ? (ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || ratingMatch[4]) + '/5'
      : undefined

    if (!isReviewPlatform && !rating) continue

    let source = 'Web'
    if (url.includes('tripadvisor')) source = 'TripAdvisor'
    else if (url.includes('thefork') || url.includes('lafourchette')) source = 'TheFork'
    else if (url.includes('yelp')) source = 'Yelp'
    else if (url.includes('foursquare')) source = 'Foursquare'
    else if (url.includes('michelin') || url.includes('gault')) source = 'Guide'

    reviews.push({ source, text: r.snippet.slice(0, 350), rating })
  }

  return reviews.slice(0, 5)
}

function buildDescription(
  websiteText: string,
  searchResults: SearchResult[],
  name: string
): string {
  if (websiteText.length > 80) {
    const nameLower = name.toLowerCase()
    const idx = websiteText.toLowerCase().indexOf(nameLower)
    if (idx !== -1) {
      const start = Math.max(0, idx - 50)
      return websiteText.slice(start, start + 400).trim()
    }
    return websiteText.slice(0, 400).trim()
  }

  return (
    searchResults
      .filter(r => !isBlockedDomain(r.url))
      .sort((a, b) => b.snippet.length - a.snippet.length)[0]?.snippet ?? ''
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { restaurantName, ville } = await request.json()

    if (!restaurantName?.trim() || !ville?.trim()) {
      return NextResponse.json(
        { error: 'Nom du restaurant et ville requis' },
        { status: 400 }
      )
    }

    const name = restaurantName.trim()
    const city = ville.trim()

    // Run two searches in parallel
    const [generalResults, reviewResults] = await Promise.all([
      ddgSearch(`${name} ${city} Belgique restaurant`),
      ddgSearch(`"${name}" ${city} avis restaurant menu spécialités`),
    ])

    if (generalResults.length === 0 && reviewResults.length === 0) {
      return NextResponse.json(
        { error: `Impossible de trouver des informations sur "${name}". Vérifie le nom et la ville.` },
        { status: 404 }
      )
    }

    // Find official website and scrape it
    const officialUrl = findOfficialUrl(generalResults, name)
    const websiteText = officialUrl ? await scrapeWebsite(officialUrl) : ''

    const allSnippets = [
      ...generalResults.map(r => r.snippet),
      ...reviewResults.map(r => r.snippet),
    ]
    const allTexts = [websiteText, ...allSnippets]

    const specialties = extractSpecialties(allTexts)
    const highlights = extractHighlights(allTexts)
    const reviews = extractReviews([...generalResults, ...reviewResults])
    const description = buildDescription(websiteText, generalResults, name)

    const sources: string[] = []
    if (officialUrl) sources.push('Site officiel')
    const reviewPlatforms = [...new Set(reviews.map(r => r.source))]
    sources.push(...reviewPlatforms)
    if (sources.length === 0) sources.push('Web')

    return NextResponse.json({
      name,
      description,
      specialties,
      highlights,
      reviews,
      websiteUrl: officialUrl,
      sources,
    })
  } catch (error) {
    console.error('analyze-restaurant error:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'analyse. Réessaie dans un instant." },
      { status: 500 }
    )
  }
}
