import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { getSiteContent } from '../lib/api-client'
import {
  SITE_CONTENT_FALLBACKS,
  resolveText,
  type NavLabelKey,
  type SiteContent,
} from '../lib/site-content'

interface SiteContentContextValue {
  content: SiteContent
  isLoading: boolean
  text: (value: { en: string; ar: string }) => string
  navLabel: (key: NavLabelKey, fallback?: string) => string
  pageCopy: (section: 'latestReleases' | 'contact' | 'commercial') => {
    title: string
    subtitle: string
  }
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null)

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [content, setContent] = useState<SiteContent>(SITE_CONTENT_FALLBACKS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const loaded = await getSiteContent()
        if (!cancelled) setContent(loaded)
      } catch (error) {
        console.error('[SiteContent] Failed to load:', error)
        if (!cancelled) setContent(SITE_CONTENT_FALLBACKS)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const isRtl = i18n.language === 'ar'

  const text = useCallback(
    (localized: { en: string; ar: string }) => resolveText(localized, isRtl),
    [isRtl]
  )

  const navLabel = useCallback(
    (key: NavLabelKey, fallback?: string) => {
      const localized = content.navigation[key]
      const resolved = resolveText(localized, isRtl)
      return resolved || fallback || ''
    },
    [content.navigation, isRtl]
  )

  const pageCopy = useCallback(
    (section: 'latestReleases' | 'contact' | 'commercial') => ({
      title: text(content[section].title),
      subtitle: text(content[section].subtitle),
    }),
    [content, text]
  )

  const value = useMemo(
    () => ({
      content,
      isLoading,
      text,
      navLabel,
      pageCopy,
    }),
    [content, isLoading, text, navLabel, pageCopy]
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }
  return ctx
}
