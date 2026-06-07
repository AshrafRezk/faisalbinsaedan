import { useEffect, useState } from 'react'
import { Box, Container, Typography, Card, Chip, Grid, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHomePageContent } from '../../contexts/HomePageContentContext'
import { MapPin } from 'lucide-react'
import { getProjects } from '../../lib/api-client'
import type { Project } from '../../lib/types'
import LazyImage from '../ui/LazyImage'
import ProjectsMap from './ProjectsMap'

interface ProjectWithAvailability extends Project {
  hasAvailability: boolean
  availablePhasesCount?: number
}

const MAX_GRID_PROJECTS = 6
const MAP_HEIGHT = { xs: 360, sm: 420, md: 560 }

export default function AboutProjectsSection() {
  const { t, i18n } = useTranslation()
  const { content, text } = useHomePageContent()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectWithAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null)

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await getProjects()
        if (response.success && response.data) {
          setProjects(
            response.data.filter(
              (project) =>
                project.hasAvailability || (project.availablePhasesCount ?? 0) > 0
            )
          )
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [])

  const isRtl = i18n.language === 'ar'
  const gridProjects = projects.slice(0, MAX_GRID_PROJECTS)

  const renderProjectCard = (project: ProjectWithAvailability, index: number) => {
    const isActive = highlightedProjectId === project.id
    return (
      <Grid size={{ xs: 6 }} key={project.id}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <Card
            onClick={() => {
              if (isActive) {
                navigate(`/project/${project.id}`)
              } else {
                setHighlightedProjectId(project.id)
              }
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.25s ease-in-out',
              border: '2px solid',
              borderColor: isActive ? 'secondary.main' : 'transparent',
              boxShadow: isActive ? '0 0 16px rgba(201, 162, 39, 0.4)' : 1,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isActive ? '0 4px 20px rgba(201, 162, 39, 0.5)' : 8,
              },
            }}
          >
            <Box sx={{ position: 'relative', height: { xs: 120, sm: 140, md: 155 }, overflow: 'hidden' }}>
              <LazyImage
                src={project.coverImageUrl}
                alt={isRtl ? project.nameAr : project.name}
                objectFit="cover"
                sx={{
                  height: '100%',
                  transition: 'transform 0.5s',
                  '.MuiCard-root:hover &': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
              <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5, alignItems: 'center', zIndex: 10 }}>
                {project.logoUrl && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'white',
                      borderRadius: 1,
                      p: 0.25,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Box component="img" src={project.logoUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </Box>
                )}
                <Chip
                  label={
                    project.hasAvailability
                      ? t('home.phasesAvailable', { count: project.availablePhasesCount })
                      : t('home.soldOut')
                  }
                  color={project.hasAvailability ? 'success' : 'error'}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    backdropFilter: 'blur(4px)',
                    bgcolor: project.hasAvailability ? 'rgba(46, 125, 50, 0.85)' : 'rgba(211, 47, 47, 0.85)',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                }}
              />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', p: 1.5, color: 'white', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="subtitle2" fontWeight="600" noWrap>
                  {isRtl ? project.nameAr : project.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.9 }}>
                  <MapPin size={12} />
                  <Typography variant="caption" noWrap>
                    {isRtl ? project.locationAr : project.location}
                  </Typography>
                </Box>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        mt: 0.75,
                        color: 'secondary.main',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        borderBottom: '2px solid',
                        borderColor: 'secondary.main',
                        pb: 0.2,
                        width: 'fit-content'
                      }}
                    >
                      {isRtl ? 'استكشف الآن ←' : 'Explore Now ←'}
                    </Typography>
                  </motion.div>
                )}
              </Box>
            </Box>
          </Card>
        </motion.div>
      </Grid>
    )
  }

  return (
    <Box sx={{ py: 10, px: { xs: 2, md: 3 }, bgcolor: 'rgba(215, 235, 245, 0.4)', position: 'relative' }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h2"
            fontWeight="500"
            color="primary.main"
            sx={{
              lineHeight: 1.1,
              mb: { xs: 4, md: 5 },
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              textAlign: isRtl ? 'right' : 'left',
              whiteSpace: 'pre-line',
            }}
          >
            {text(content.aboutProjects.title)}
          </Typography>
        </motion.div>

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          {/* Map — physical left in LTR, physical left in RTL (wireframe) */}
          <Grid
            size={{ xs: 12, md: 7 }}
            sx={{
              order: { xs: 1, md: isRtl ? 2 : 1 },
              minWidth: 0,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="600"
              color="text.primary"
              sx={{ mb: 1.5, textAlign: isRtl ? 'right' : 'left' }}
            >
              {isRtl ? 'خريطة' : 'Map'}
            </Typography>
            <Box sx={{ width: '100%', height: MAP_HEIGHT }}>
              <ProjectsMap
                sx={{ width: '100%', height: '100%' }}
                highlightedProjectId={highlightedProjectId}
                onProjectSelect={(id) => setHighlightedProjectId(id)}
                projects={gridProjects}
              />
            </Box>
          </Grid>

          {/* Project grid — physical right in LTR, physical right in RTL */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              order: { xs: 2, md: isRtl ? 1 : 2 },
              minWidth: 0,
            }}
          >
            {isLoading ? (
              <Grid container spacing={2}>
                {Array.from({ length: MAX_GRID_PROJECTS }).map((_, i) => (
                  <Grid size={{ xs: 6 }} key={i}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Skeleton variant="rectangular" height={155} />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : gridProjects.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: MAP_HEIGHT,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Typography color="text.secondary">
                  {isRtl ? 'لا توجد مشاريع متاحة حالياً' : 'No available projects at the moment'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {gridProjects.map((project, index) => renderProjectCard(project, index))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
