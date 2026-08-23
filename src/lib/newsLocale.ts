import type { NewsArticle } from '../types'

/** Prefer Arabic when RTL; fall back to the other language when empty. */
export function newsTitle(article: Pick<NewsArticle, 'title' | 'titleAr'>, isRtl: boolean): string {
  if (isRtl) return article.titleAr || article.title || ''
  return article.title || article.titleAr || ''
}

export function newsExcerpt(
  article: Pick<NewsArticle, 'excerpt' | 'excerptAr'>,
  isRtl: boolean
): string {
  if (isRtl) return article.excerptAr || article.excerpt || ''
  return article.excerpt || article.excerptAr || ''
}

export function newsBody(article: Pick<NewsArticle, 'body' | 'bodyAr'>, isRtl: boolean): string {
  if (isRtl) return article.bodyAr || article.body || ''
  return article.body || article.bodyAr || ''
}

export function newsMetaDescription(
  article: Pick<NewsArticle, 'metaDescription' | 'metaDescriptionAr'>,
  isRtl: boolean
): string {
  if (isRtl) return article.metaDescriptionAr || article.metaDescription || ''
  return article.metaDescription || article.metaDescriptionAr || ''
}
