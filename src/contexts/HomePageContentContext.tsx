import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { getHomePageContent } from '../lib/api-client'
import { HOME_PAGE_FALLBACKS, resolveText, type HomePageContent } from '../lib/home-page-content'

interface HomePageContentContextValue {
  content: HomePageContent
  isLoading: boolean
  text: (value: { en: string; ar: string }) => string
}

const HomePageContentContext = createContext<HomePageContentContextValue | null>(null)

export function HomePageContentProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [content, setContent] = useState<HomePageContent>(HOME_PAGE_FALLBACKS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const loaded = await getHomePageContent()
        if (!cancelled) setContent(loaded)
      } catch (error) {
        console.error('[HomePageContent] Failed to load:', error)
        if (!cancelled) setContent(HOME_PAGE_FALLBACKS)
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

  const value = useMemo(
    () => ({
      content,
      isLoading,
      text: (localized: { en: string; ar: string }) => resolveText(localized, isRtl),
    }),
    [content, isLoading, isRtl]
  )

  return (
    <HomePageContentContext.Provider value={value}>{children}</HomePageContentContext.Provider>
  )
}

export function useHomePageContent() {
  const ctx = useContext(HomePageContentContext)
  if (!ctx) {
    throw new Error('useHomePageContent must be used within HomePageContentProvider')
  }
  return ctx
}
