import { useEffect, useState } from 'react'
import { Box, Container, Grid, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getProjects } from '../lib/api-client'
import { useSiteContent } from '../contexts/SiteContentContext'
import ProjectListingCard, {
  ProjectListingCardSkeleton,
  type ProjectWithAvailability,
} from '../components/project/ProjectListingCard'

export default function LatestReleases() {
  const { t, i18n } = useTranslation()
  const { pageCopy, navLabel } = useSiteContent()
  const latestReleasesHero = pageCopy('latestReleases')
  const isRtl = i18n.language === 'ar'
  const [projects, setProjects] = useState<ProjectWithAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadProjects() {
      try {
        const res = await getProjects({ projectType: 'Commercial' })
        if (!cancelled && res.success && res.data) {
          setProjects(res.data)
        }
      } catch (err) {
        console.error('Failed to load commercial projects', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void loadProjects()
    return () => {
      cancelled = true
    }
  }, [])

  const countLabel = t('latestReleasesPage.count', { count: projects.length })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', pb: { xs: 6, md: 10 } }}>
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
              <Building2 size={22} />
              <Typography variant="overline" sx={{ letterSpacing: '0.2em', fontWeight: 600 }}>
                {navLabel('latestReleases', t('common.latestReleases'))}
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {latestReleasesHero.title}
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
              {latestReleasesHero.subtitle}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 5 }, px: { xs: 2, md: 4 } }}>
        {!isLoading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: isRtl ? 'left' : 'right', mb: 3 }}
          >
            {countLabel}
          </Typography>
        )}

        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectListingCardSkeleton key={i} />
            ))}
          </Grid>
        ) : projects.length === 0 ? (
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
            <Building2 size={48} style={{ opacity: 0.35, marginBottom: 16 }} />
            <Typography variant="h6" color="primary.main" gutterBottom>
              {t('latestReleasesPage.empty.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
              {t('latestReleasesPage.empty.description')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project, index) => (
              <ProjectListingCard key={project.id} project={project} index={index} />
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}
