import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Pagination,
  Skeleton,
  Chip,
  Divider,
  InputAdornment,
} from '@mui/material'
import { Search as SearchIcon, ArrowRight, ArrowLeft, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNewsArticles } from '../lib/api-client'
import { NewsArticle } from '../lib/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'

const CATEGORIES = ['Residential', 'Commercial', 'Investment']

const formatDate = (date: Date, isRtl: boolean) => {
  return new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function News() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const align = isRtl ? 'right' : 'left'

  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [recent, setRecent] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [segment, setSegment] = useState('All')
  const [keyword, setKeyword] = useState('')

  const fetchNews = async () => {
    setLoading(true)
    try {
      const filters: Record<string, unknown> = {
        page,
        pageSize: 8,
        sortBy: 'Publication_Date__c',
        sortOrder: 'DESC',
      }
      if (segment !== 'All') filters.segment = segment
      if (keyword) filters.keyword = keyword

      const res = await getNewsArticles(filters)
      if (res.success && res.data) {
        setArticles(res.data.articles || [])
        setTotalPages(res.data.pagination?.totalPages || 1)
        // Seed the "Recent Posts" sidebar once, from the unfiltered first page.
        setRecent((prev) =>
          prev.length === 0 && segment === 'All' && !keyword
            ? (res.data.articles || []).slice(0, 5)
            : prev
        )
      } else {
        setArticles([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error(error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, segment, keyword])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ReadMoreArrow = isRtl ? ArrowLeft : ArrowRight

  const renderPostCard = (article: NewsArticle) => {
    const pubDate = article.publicationDate ? new Date(article.publicationDate) : null
    return (
      <Box key={article.id} component="article" sx={{ mb: 6 }}>
        <Box
          component={Link}
          to={`/news/${article.id}`}
          sx={{
            display: 'block',
            overflow: 'hidden',
            borderRadius: 2,
            mb: 2.5,
            '&:hover img': { transform: 'scale(1.04)' },
          }}
        >
          <Box
            component="img"
            src={article.coverImageUrl || FALLBACK_IMAGE}
            alt={article.title}
            sx={{
              width: '100%',
              height: { xs: 220, sm: 340 },
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.5s ease',
            }}
          />
        </Box>

        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          {pubDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <CalendarDays size={15} />
              <Typography variant="caption" sx={{ letterSpacing: 0.5 }}>
                {formatDate(pubDate, isRtl)}
              </Typography>
            </Box>
          )}
          <Chip
            label={article.segment || t('news.badge', 'Blog')}
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
              borderRadius: 0.75,
            }}
          />
        </Box>

        <Typography
          component={Link}
          to={`/news/${article.id}`}
          variant="h4"
          sx={{
            display: 'block',
            mb: 1.5,
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'text.primary',
            textDecoration: 'none',
            textAlign: align,
            transition: 'color 0.2s ease',
            '&:hover': { color: 'primary.main' },
            fontSize: { xs: '1.4rem', md: '1.75rem' },
          }}
        >
          {article.title}
        </Typography>

        {article.excerpt && (
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 2,
              textAlign: align,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.excerpt}
          </Typography>
        )}

        <Box
          component={Link}
          to={`/news/${article.id}`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            color: 'primary.main',
            fontWeight: 600,
            textDecoration: 'none',
            '&:hover': { gap: 1.25 },
            transition: 'gap 0.2s ease',
          }}
        >
          <span>{t('news.continueReading', 'Continue reading')}</span>
          <ReadMoreArrow size={16} />
        </Box>

        <Divider sx={{ mt: 5 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 10, md: 12 }, minHeight: '100vh', bgcolor: 'background.default' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: align }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            {t('news.blogTitle', 'Blog')}
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {t('news.blogSubtitle', 'Insights, market updates, and stories from Faisal Bin Saedan.')}
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Main column — vertical list of posts */}
          <Grid item xs={12} md={8} sx={{ order: { xs: 1, md: 2 } }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <Box key={i} sx={{ mb: 6 }}>
                  <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2, mb: 2 }} />
                  <Skeleton variant="text" height={20} width="40%" />
                  <Skeleton variant="text" height={44} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="80%" />
                </Box>
              ))
            ) : articles.length > 0 ? (
              <>
                {articles.map(renderPostCard)}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {t('news.empty', 'No news articles found.')}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4} sx={{ order: { xs: 2, md: 1 } }}>
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder={t('news.searchKeywords', 'Search keywords')}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
              sx={{ bgcolor: 'background.paper', mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={16} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Categories */}
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main', textAlign: align }}
              >
                {t('news.categories', 'Categories')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {['All', ...CATEGORIES].map((cat) => {
                  const active = segment === cat
                  return (
                    <Box
                      key={cat}
                      onClick={() => {
                        setSegment(cat)
                        setPage(1)
                      }}
                      sx={{
                        cursor: 'pointer',
                        py: 1.1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        color: active ? 'primary.main' : 'text.primary',
                        fontWeight: active ? 700 : 500,
                        textAlign: align,
                        transition: 'color 0.2s ease',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {cat === 'All' ? t('news.allCategories', 'All Posts') : cat}
                    </Box>
                  )
                })}
              </Box>
            </Box>

            {/* Recent Posts */}
            {recent.length > 0 && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main', textAlign: align }}
                >
                  {t('news.recentPosts', 'Recent Posts')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recent.map((article) => {
                    const pubDate = article.publicationDate ? new Date(article.publicationDate) : null
                    return (
                      <Box
                        key={article.id}
                        component={Link}
                        to={`/news/${article.id}`}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover .recent-title': { color: 'primary.main' },
                        }}
                      >
                        <Box
                          component="img"
                          src={article.coverImageUrl || FALLBACK_IMAGE}
                          alt={article.title}
                          sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                        />
                        <Box sx={{ textAlign: align }}>
                          <Typography
                            className="recent-title"
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.35,
                              transition: 'color 0.2s ease',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {article.title}
                          </Typography>
                          {pubDate && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatDate(pubDate, isRtl)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
