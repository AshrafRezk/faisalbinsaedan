import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Project } from '../../lib/types'
import LazyImage from '../ui/LazyImage'

export type ProjectWithAvailability = Project & {
  hasAvailability?: boolean
  availablePhasesCount?: number
}

export function getAvailableCount(project: ProjectWithAvailability): number {
  const fromPhases = project.phases?.filter((p) => p.status === 'Available').length ?? 0
  if (fromPhases > 0) return fromPhases
  return project.availablePhasesCount ?? 0
}

export default function ProjectListingCard({
  project,
  index,
}: {
  project: ProjectWithAvailability
  index: number
}) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const name = isRtl ? project.nameAr : project.name
  const location = isRtl ? project.locationAr : project.location
  const description = isRtl ? project.descriptionAr : project.description
  const available = getAvailableCount(project)
  const isActive = project.status === 'Active'

  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.36) }}
        style={{ height: '100%' }}
      >
        <Card
          component={Link}
          to={`/project/${project.id}`}
          sx={(theme) => ({
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            borderRadius: '20px',
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            backdropFilter: 'blur(16px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: '0 8px 24px rgba(2, 6, 23, 0.06)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
            },
          })}
        >
          <Box sx={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', bgcolor: 'grey.100' }}>
            {project.coverImageUrl ? (
              <LazyImage
                src={project.coverImageUrl}
                alt={name}
                objectFit="cover"
                sx={{
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.4s ease',
                  '.MuiCard-root:hover &': { transform: 'scale(1.04)' },
                }}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">{t('latestReleasesPage.noImage')}</Typography>
              </Box>
            )}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(16, 45, 74, 0.75) 0%, rgba(16, 45, 74, 0.15) 45%, transparent 100%)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                ...(isRtl ? { left: 12 } : { right: 12 }),
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: isRtl ? 'flex-start' : 'flex-end',
              }}
            >
              <Chip
                size="small"
                label={
                  isActive
                    ? t('latestReleasesPage.status.active')
                    : t('latestReleasesPage.status.completed')
                }
                color={isActive ? 'success' : 'default'}
                sx={{ bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 600 }}
              />
              {available > 0 && (
                <Chip
                  size="small"
                  label={t('home.phasesAvailable', { count: available })}
                  sx={{ bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 600 }}
                />
              )}
            </Box>
            {project.logoUrl && (
              <Box
                component="img"
                src={project.logoUrl}
                alt=""
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  ...(isRtl ? { right: 12 } : { left: 12 }),
                  height: 36,
                  maxWidth: 100,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
                }}
              />
            )}
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5, gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                lineHeight: 1.3,
                textAlign: isRtl ? 'right' : 'left',
              }}
            >
              {name}
            </Typography>
            {location && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: 'text.secondary',
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  justifyContent: isRtl ? 'flex-end' : 'flex-start',
                }}
              >
                <MapPin size={15} />
                <Typography variant="body2">{location}</Typography>
              </Box>
            )}
            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  flexGrow: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.6,
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                {description}
              </Typography>
            )}
            <Button
              variant="text"
              size="small"
              sx={{
                alignSelf: isRtl ? 'flex-end' : 'flex-start',
                mt: 0.5,
                px: 0,
                fontWeight: 600,
              }}
            >
              {t('latestReleasesPage.viewProject')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  )
}

export function ProjectListingCardSkeleton() {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <Skeleton variant="rectangular" sx={{ aspectRatio: '16/10' }} />
        <CardContent>
          <Skeleton height={28} width="70%" sx={{ mb: 1 }} />
          <Skeleton height={20} width="45%" sx={{ mb: 1.5 }} />
          <Skeleton height={16} />
          <Skeleton height={16} width="90%" sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    </Grid>
  )
}
