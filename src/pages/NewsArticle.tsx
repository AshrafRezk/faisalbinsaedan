import { useState, useEffect, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Skeleton,
  Divider,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  CalendarDays,
  Clock,
  MessageCircle,
  User,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getNewsArticle, getNewsArticles } from '../lib/api-client'
import { NewsArticle as NewsArticleType } from '../lib/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'

const formatDate = (date: Date, isRtl: boolean) =>
  new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)

function sidebarCardSx(theme: { palette: { background: { paper: string }; divider: string } }) {
  return {
    p: 2.5,
    borderRadius: 3,
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    boxShadow: '0 8px 24px rgba(2, 6, 23, 0.06)',
  }
}

export default function NewsArticle() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  const [article, setArticle] = useState<NewsArticleType | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState<NewsArticleType[]>([])
  const [email, setEmail] = useState('')
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const fetchContent = async () => {
      setLoading(true)
      try {
        const res = await getNewsArticle(id)
        if (res.success && res.data) {
          const data = res.data
          const parsedArticle =
            data.article || (data.articles && data.articles.length > 0 ? data.articles[0] : data)
          setArticle(parsedArticle)
        }

        const relatedRes = await getNewsArticles({
          pageSize: 4,
          sortBy: 'Publication_Date__c',
          sortOrder: 'DESC',
        })
        if (relatedRes.success && relatedRes.data?.articles) {
          setRelatedPosts(
            relatedRes.data.articles.filter((a: NewsArticleType) => a.id !== id).slice(0, 3)
          )
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [id])

  const pubDate = article?.publicationDate ? new Date(article.publicationDate) : null
  const contentHtml =
    article?.body ||
    (article as { Body__c?: string; content?: string; Content__c?: string })?.Body__c ||
    (article as { content?: string })?.content ||
    (article as { Content__c?: string })?.Content__c ||
    ''

  const calculateReadingTime = (text: string) => {
    if (!text) return 1
    const words = text.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }
  const readingTime = calculateReadingTime(contentHtml)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title || '', url: window.location.href })
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert(t('share.copied', 'Copied to clipboard'))
    }
  }

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setSubscribeMsg(t('news.subscribeInvalid', 'Please enter a valid email address'))
      return
    }
    setSubscribeMsg(t('news.subscribeThanks', 'Thanks — you’re on the list.'))
    setEmail('')
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA' }}>
        <Skeleton variant="rectangular" height={280} />
        <Container maxWidth="lg" sx={{ mt: 4, pb: 10 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="rounded" height={320} sx={{ mb: 3, borderRadius: 3 }} />
              <Skeleton variant="text" height={40} />
              <Skeleton variant="rectangular" height={180} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rounded" height={140} sx={{ mb: 2, borderRadius: 3 }} />
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    )
  }

  if (!article) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5">{t('news.notFound', 'Article not found')}</Typography>
      </Box>
    )
  }

  const category = (article.segment || t('news.badge', 'Blog')).toUpperCase()
  const excerpt =
    article.excerpt ||
    article.metaDescription ||
    contentHtml.replace(/<[^>]*>?/gm, '').slice(0, 180)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA', pb: { xs: 8, md: 12 } }}>
      {/* Hero */}
      <Box
        sx={(theme) => ({
          background: `linear-gradient(105deg, ${theme.palette.primary.main} 0%, ${alpha(
            theme.palette.primary.dark || theme.palette.primary.main,
            0.92
          )} 45%, #234e7a 100%)`,
          color: 'white',
          pt: { xs: 10, md: 12 },
          pb: { xs: 5, md: 7 },
        })}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              component={Link}
              to="/news"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': { color: 'white' },
              }}
            >
              <BackIcon size={16} />
              {t('news.backToBlogs', 'Back to blogs')}
            </Box>
            <Chip
              label={category}
              size="small"
              sx={{
                height: 26,
                bgcolor: 'rgba(255,255,255,0.18)',
                color: 'white',
                fontWeight: 700,
                letterSpacing: 0.6,
                fontSize: '0.7rem',
                borderRadius: 1.5,
                backdropFilter: 'blur(6px)',
              }}
            />
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              lineHeight: 1.2,
              maxWidth: 820,
              mb: 2,
            }}
          >
            {article.title}
          </Typography>

          {excerpt && (
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                lineHeight: 1.7,
                maxWidth: 720,
                mb: 3.5,
              }}
            >
              {excerpt}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: { xs: 2, md: 3.5 },
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.875rem',
            }}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <User size={15} />
              <span>{t('news.authorName', 'Digital Team')}</span>
            </Box>
            {pubDate && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <CalendarDays size={15} />
                <span>{formatDate(pubDate, isRtl)}</span>
              </Box>
            )}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Clock size={15} />
              <span>
                {t('news.minRead', '{{minutes}} min read', { minutes: readingTime })}
              </span>
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <MessageCircle size={15} />
              <span>{t('news.commentsCount', '{{count}} comments', { count: 0 })}</span>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Body + sidebar */}
      <Container maxWidth="lg" sx={{ mt: { xs: -2, md: -3 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: '0 12px 32px rgba(2, 6, 23, 0.06)',
              }}
            >
              <Box
                component="img"
                src={article.coverImageUrl || FALLBACK_IMAGE}
                alt={article.title}
                sx={{
                  width: '100%',
                  maxHeight: { xs: 260, md: 420 },
                  objectFit: 'cover',
                  borderRadius: 2.5,
                  display: 'block',
                  mb: { xs: 3, md: 4 },
                }}
              />

              <Box
                sx={{
                  typography: 'body1',
                  lineHeight: 1.85,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  '& p': { mb: 2.5 },
                  '& h2, & h3, & h4': {
                    mt: 4,
                    mb: 2,
                    fontWeight: 800,
                    color: 'primary.main',
                    lineHeight: 1.3,
                  },
                  '& h2': { fontSize: { xs: '1.35rem', md: '1.5rem' } },
                  '& h3': { fontSize: { xs: '1.2rem', md: '1.3rem' } },
                  '& img': { maxWidth: '100%', height: 'auto', my: 3, borderRadius: 2 },
                  '& ul, & ol': { mb: 2.5, pl: 3 },
                  '& li': { mb: 1 },
                  '& a': { color: 'primary.main', fontWeight: 600 },
                  '& blockquote': {
                    borderLeft: isRtl ? 'none' : '4px solid',
                    borderRight: isRtl ? '4px solid' : 'none',
                    borderColor: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                    px: 3,
                    py: 2.5,
                    my: 4,
                    borderRadius: isRtl ? '8px 0 0 8px' : '0 8px 8px 0',
                    fontStyle: 'italic',
                    color: 'text.primary',
                    m: 0,
                  },
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              <Divider sx={{ my: 4 }} />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {t('news.shareArticle', 'Share this article:')}
                </Typography>
                <Button
                  onClick={handleShare}
                  startIcon={<Share2 size={16} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: 'primary.main',
                    px: 1.5,
                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
                  }}
                >
                  {t('news.share', 'Share')}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                position: { md: 'sticky' },
                top: { md: 96 },
              }}
            >
              {/* About author */}
              <Paper elevation={0} sx={(theme) => sidebarCardSx(theme)}>
                <Typography
                  variant="overline"
                  sx={{
                    display: 'block',
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    color: 'primary.main',
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {t('news.aboutAuthor', 'About the author')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: 'primary.main',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                    }}
                  >
                    FBS
                  </Avatar>
                  <Box>
                    <Typography fontWeight={800} color="primary.main" sx={{ lineHeight: 1.3 }}>
                      {t('news.authorFullName', 'FBS Digital Team')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('news.authorRole', 'Real estate content specialists')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <Paper elevation={0} sx={(theme) => sidebarCardSx(theme)}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      color: 'primary.main',
                      mb: 1.5,
                      pb: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {t('news.relatedPosts', 'Related Posts')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {relatedPosts.map((post) => (
                      <Box
                        key={post.id}
                        component={Link}
                        to={`/news/${post.id}`}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover .related-title': { color: 'primary.main' },
                        }}
                      >
                        <Box
                          component="img"
                          src={post.coverImageUrl || FALLBACK_IMAGE}
                          alt={post.title}
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 1.5,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          className="related-title"
                          fontWeight={700}
                          sx={{
                            fontSize: '0.9rem',
                            lineHeight: 1.4,
                            transition: 'color 0.2s',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {post.title}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Newsletter */}
              <Paper
                elevation={0}
                component="form"
                onSubmit={handleSubscribe}
                sx={(theme) => ({
                  p: 3,
                  borderRadius: 3,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
                })}
              >
                <Typography fontWeight={800} sx={{ mb: 1, fontSize: '1.15rem' }}>
                  {t('news.newsletterTitle', 'Weekly market brief')}
                </Typography>
                <Typography sx={{ mb: 2.5, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                  {t(
                    'news.newsletterSubtitle',
                    'New financing rules and property insights, once a week.'
                  )}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setSubscribeMsg(null)
                  }}
                  placeholder={t('news.emailPlaceholder', 'Email address')}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#fff', 0.08),
                      color: 'white',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.55)' },
                      '&.Mui-focused fieldset': { borderColor: 'white' },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255,255,255,0.55)',
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.1,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', boxShadow: 'none' },
                  }}
                >
                  {t('news.subscribe', 'Subscribe')}
                </Button>
                {subscribeMsg && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                    {subscribeMsg}
                  </Typography>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
