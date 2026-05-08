'use client'
import { useEffect } from 'react'

export function FetchSanitizer() {
  useEffect(() => {
    const orig = window.fetch.bind(window)
    // eslint-disable-next-line prefer-regex-literals
    const strip = new RegExp('[^\\u0009\\u000A\\u000D\\u0020-\\u00FF]', 'g')

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      if (
        init?.headers &&
        !(init.headers instanceof Headers) &&
        !Array.isArray(init.headers)
      ) {
        const safe: Record<string, string> = {}
        for (const [k, v] of Object.entries(init.headers as Record<string, string>)) {
          safe[k] = typeof v === 'string' ? v.replace(strip, '') : v
        }
        init = { ...init, headers: safe }
      }
      return orig(input, init)
    }

    return () => {
      window.fetch = orig
    }
  }, [])
  return null
}
