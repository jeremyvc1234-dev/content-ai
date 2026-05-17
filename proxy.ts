import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log('[proxy] incoming request:', path)
  console.log('[proxy] cookies:', request.cookies.getAll().map(c => c.name))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Optimistic check: read JWT from cookies without a network call (per Next.js 16 docs).
  // The dashboard page performs the real getUser() validation.
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('[proxy] session found:', !!session, '| error:', error?.message ?? 'none')

  if (!session && path.startsWith('/dashboard')) {
    console.log('[proxy] no session → redirect to /login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  console.log('[proxy] allowing through')
  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
