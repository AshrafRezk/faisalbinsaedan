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
  Card,
  CardContent,
  InputAdornment,
  Paper,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { Search as SearchIcon, ArrowRight, ArrowLeft, CalendarDays, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNewsArticles } from '../lib/api-client'
import { NewsArticle } from '../lib/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'

const CATEGORIES = ['Residential', 'Commercial', 'Investment']

function formatDateParts(date: Date, isRtl: boolean) {
  const day = new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', { day: '2-digit' }).format(date)
  const month = new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', { month: 'short' }).format(date)
  const full = new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  return { day, month, full }
}

type BlogPostCardProps = {
  article: NewsArticle
  isRtl: boolean
  index: number
}

function BlogPostCard({ article, isRtl, index }: BlogPostCardProps) {
  const { t } = useTranslation()
  const pubDate = article.publicationDate ? new Date(article.publicationDate) : null
  const dateParts = pubDate ? formatDateParts(pubDate, isRtl) : null
  const ReadMoreArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
        style={{ height: '100%' }}
      >
        <Card
          component="article"
          elevation={0}
          sx={(theme) => ({
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: '0 8px 24px rgba(2, 6, 23, 0.06)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
            },
          })}
        >
          <Box
            component={Link}
            to={`/news/${article.id}`}
            sx={{
              position: 'relative',
              display: 'block',
              aspectRatio: '16/10',
              overflow: 'hidden',
              '&:hover img': { transform: 'scale(1.05)' },
            }}
          >
            <Box
              component="img"
              src={article.coverImageUrl || FALLBACK_IMAGE}
              alt={article.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.45s ease',
              }}
            />
            {dateParts && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  ...(isRtl ? { left: 12 } : { right: 12 }),
                  minWidth: 52,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, fontSize: '1rem' }}>
                  {dateParts.day}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  {dateParts.month}
                </Typography>
              </Box>
            )}
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5, gap: 1 }}>
            <Chip
              label={article.segment || t('news.badge', 'Blog')}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
              }}
            />

            <Typography
              component={Link}
              to={`/news/${article.id}`}
              variant="h6"
              sx={{
                fontWeight: 700,
                lineHeight: 1.35,
                color: 'text.primary',
                textDecoration: 'none',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                transition: 'color 0.2s ease',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {article.title}
            </Typography>

            {dateParts && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                <CalendarDays size={14} />
                <Typography variant="caption">{dateParts.full}</Typography>
              </Box>
            )}

            {article.excerpt && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  flexGrow: 1,
                  lineHeight: 1.65,
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
                gap: 0.5,
                mt: 'auto',
                pt: 1,
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                '&:hover': { gap: 0.85 },
                transition: 'gap 0.2s ease',
              }}
            >
              {t('news.continueReading', 'Continue reading')}
              <ReadMoreArrow size={15} />
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  )
}

function BlogPostCardSkeleton() {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Card elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Skeleton variant="rectangular" sx={{ aspectRatio: '16/10' }} />
        <CardContent>
          <Skeleton width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton height={28} />
          <Skeleton height={20} width="50%" sx={{ my: 1 }} />
          <Skeleton height={16} />
          <Skeleton height={16} width="90%" />
        </CardContent>
      </Card>
    </Grid>
  )
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
        pageSize: 9,
        sortBy: 'Publication_Date__c',
        sortOrder: 'DESC',
      }
      if (segment !== 'All') filters.segment = segment
      if (keyword) filters.keyword = keyword

      const res = await getNewsArticles(filters)
      if (res.success && res.data) {
        setArticles(res.data.articles || [])
        setTotalPages(res.data.pagination?.totalPages || 1)
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

  const sidebar = (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(16px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        position: { md: 'sticky' },
        top: { md: 96 },
      })}
    >
      <TextField
        fullWidth
        size="small"
        placeholder={t('news.searchKeywords', 'Search keywords')}
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value)
          setPage(1)
        }}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon size={16} />
            </InputAdornment>
          ),
        }}
      />

      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: 2, borderColor: 'primary.main', textAlign: align }}
      >
        {t('news.categories', 'Categories')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 4 }}>
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

      {recent.length > 0 && (
        <>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: 2, borderColor: 'primary.main', textAlign: align }}
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
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover .recent-title': { color: 'primary.main' },
                  }}
                >
                  <Box
                    component="img"
                    src={article.coverImageUrl || FALLBACK_IMAGE}
                    alt={article.title}
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
                  />
                  <Box sx={{ textAlign: align, minWidth: 0 }}>
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
                        {formatDateParts(pubDate, isRtl).full}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </>
      )}
    </Paper>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', pb: { xs: 6, md: 10 } }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <Box
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, 0.85),
          backdropFilter: 'blur(20px)',
          color: 'common.white',
          py: { xs: 5, md: 7 },
          textAlign: 'center',
        })}
      >
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 1.5,
                opacity: 0.9,
              }}
            >
              <Newspaper size={22} />
              <Typography variant="overline" sx={{ letterSpacing: '0.2em', fontWeight: 600 }}>
                {t('common.ourNews')}
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {t('news.blogTitle', 'Blog')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                maxWidth: '40rem',
                mx: 'auto',
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.6,
              }}
            >
              {t('news.blogSubtitle', 'Insights, market updates, and stories from Faisal Bin Saedan.')}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={4} direction={isRtl ? 'row-reverse' : 'row'}>
          {/* Main — post grid */}
          <Grid size={{ xs: 12, md: 9 }}>
            {loading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <BlogPostCardSkeleton key={i} />
                ))}
              </Grid>
            ) : articles.length > 0 ? (
              <>
                <Grid container spacing={3}>
                  {articles.map((article, index) => (
                    <BlogPostCard key={article.id} article={article} isRtl={isRtl} index={index} />
                  ))}
                </Grid>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
                  </Box>
                )}
              </>
            ) : (
              <Box
                sx={(theme) => ({
                  textAlign: 'center',
                  py: 10,
                  px: 3,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
                })}
              >
                <Newspaper size={48} style={{ opacity: 0.35, marginBottom: 16 }} />
                <Typography variant="h6" color="primary.main" gutterBottom>
                  {t('news.empty', 'No news articles found.')}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            {sidebar}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
