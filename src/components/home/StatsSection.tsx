import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomePageStats } from '../../lib/api-client'
import { useHomePageContent } from '../../contexts/HomePageContentContext'

function Counter({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const { i18n } = useTranslation()
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

    if (value <= 0) {
      setCount(0)
      return
    }

    let start = 0
    setCount(0)
    const increment = value / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, value, duration])

  const isRtl = i18n.language.startsWith('ar')

  return (
    <Box ref={ref} sx={{ display: 'inline-flex', alignItems: 'baseline', minHeight: { xs: '3rem', md: '4.5rem' } }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: '3rem', md: '4.5rem' },
          fontWeight: 700,
          color: 'primary.main',
          lineHeight: 1,
        }}
      >
        {suffix === '+'
          ? isRtl
            ? `${count.toLocaleString()}+`
            : `+${count.toLocaleString()}`
          : count.toLocaleString()}
      </Typography>
    </Box>
  )
}

type StatItem = {
  value: number
  label: string
  suffix?: string
  href?: string
  loading?: boolean
}

export default function StatsSection() {
  const { t } = useTranslation()
  const { content, text } = useHomePageContent()
  const [unitsCount, setUnitsCount] = useState(0)
  const [projectsCount, setProjectsCount] = useState(0)
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setIsLoadingCounts(true)
      try {
        const res = await getHomePageStats()
        if (cancelled) return
        if (res.success && res.data) {
          setUnitsCount(res.data.unitsCount)
          setProjectsCount(res.data.projectsCount)
        }
      } catch (err) {
        console.error('[StatsSection] Failed to load stats:', err)
      } finally {
        if (!cancelled) setIsLoadingCounts(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  const stats: StatItem[] = [
    {
      value: unitsCount,
      label: t('home.stats.units', 'Units'),
      href: '/search',
      loading: isLoadingCounts,
    },
    {
      value: projectsCount,
      label: t('home.stats.projects', 'Projects'),
      href: '/search?view=projects',
      loading: isLoadingCounts,
    },
    ...content.stats.staticStats.map((stat) => ({
      value: stat.value,
      label: text(stat.label),
      suffix: stat.suffix,
      href: stat.href,
    })),
  ]

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, overflow: 'hidden' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4, lg: 6 } }}>
        <Grid container spacing={4} sx={{ mb: { xs: 8, md: 12 } }}>
          <Grid item xs={12} md={7}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  color: 'primary.main',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {text(content.stats.title)}
              </Typography>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'primary.dark',
                  lineHeight: 1.8,
                  fontSize: '1.1rem',
                  maxWidth: '400px',
                }}
              >
                {text(content.stats.description)}
              </Typography>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={4} justifyContent="space-between">
          {stats.map((stat, index) => {
            const statBody = (
              <Box
                sx={{
                  textAlign: { xs: 'center', md: 'left' },
                  cursor: stat.href ? 'pointer' : 'default',
                  transition: 'opacity 0.2s',
                  ...(stat.href && {
                    '&:hover': { opacity: 0.85 },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 4,
                      borderRadius: 1,
                    },
                  }),
                }}
              >
                {stat.loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      minHeight: { xs: '3rem', md: '4.5rem' },
                    }}
                  >
                    <CircularProgress size={36} color="primary" />
                  </Box>
                ) : (
                  <Counter value={stat.value} suffix={stat.suffix} />
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    mt: 1,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            )

            return (
              <Grid item xs={6} md={3} key={stat.label}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                >
                  {stat.href ? (
                    <Box
                      component={Link}
                      to={stat.href}
                      sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      aria-label={stat.label}
                    >
                      {statBody}
                    </Box>
                  ) : (
                    statBody
                  )}
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}
