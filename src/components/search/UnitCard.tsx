import { Link } from 'react-router-dom'
import { Card, CardContent, Chip, Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Unit } from '../../lib/types'
import FavoriteButton from '../ui/FavoriteButton'
import LazyImage from '../ui/LazyImage'
import SubsidyBadges from '../units/SubsidyBadges'
import CurrencyIcon from '../ui/CurrencyIcon'

interface UnitCardProps {
  unit: Unit
  index?: number
  variant?: 'grid' | 'list'
}

export default function UnitCard({ unit, index = 0, variant = 'grid' }: UnitCardProps) {
  const { t, i18n } = useTranslation()
  const isList = variant === 'list'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const statusColors: Record<Unit['status'], 'success' | 'warning' | 'error'> = {
    Available: 'success',
    Reserved: 'warning',
    Sold: 'error',
  }

  const statusLabels: Record<Unit['status'], string> = {
    Available: t('unit.available'),
    Reserved: t('unit.reserved'),
    Sold: t('unit.sold'),
  }

  const imageSection = (
    <Box
      sx={{
        position: 'relative',
        height: isList ? { xs: 140, sm: 160 } : { xs: 176, md: 192 },
        width: isList ? { xs: '100%', sm: 220 } : '100%',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <LazyImage
        src={unit?.images?.[0] || '/placeholder.jpg'}
        alt={`Unit ${unit.unitNumber}`}
        objectFit="cover"
        sx={{
          height: '100%',
          transition: 'transform 0.5s',
          '.MuiCard-root:hover &': {
            transform: 'scale(1.05)',
          },
        }}
      />
      <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
        <SubsidyBadges eligible={unit.eligibleForSubsidies} size="large" />
      </Box>
      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5, zIndex: 2 }}>
        <FavoriteButton unitId={unit.id} size="small" />
        <Chip
          label={statusLabels[unit.status]}
          color={statusColors[unit.status]}
          size="small"
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
        }}
      >
        {unit.unitNumber}
      </Box>
    </Box>
  )

  const detailsSection = (
    <CardContent
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        py: isList ? { xs: 2, sm: 2.5 } : undefined,
      }}
    >
      <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        {formatPrice(unit.price)}
        <CurrencyIcon theme="light" className="mx-1" />
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...(isList ? {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          } : {
            whiteSpace: 'nowrap'
          })
        }}
      >
        {i18n.language.startsWith('ar') ? unit.projectNameAr : unit.projectName} •{' '}
        {i18n.language.startsWith('ar') ? unit.phaseNameAr : unit.phaseName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.75rem', color: 'text.secondary', mt: isList ? 'auto' : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Bed size={16} />
          <Typography variant="caption">
            {unit.bedrooms} {t('unit.bedrooms')}
          </Typography>
        </Box>
        {unit.bathrooms && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Bath size={16} />
            <Typography variant="caption">{unit.bathrooms}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Maximize size={16} />
          <Typography variant="caption">
            {unit.area} {t('unit.areaUnit')}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        component={Link}
        to={`/unit/${unit.id}`}
        sx={(theme) => ({
          height: '100%',
          display: 'flex',
          flexDirection: isList ? { xs: 'column', sm: 'row' } : 'column',
          textDecoration: 'none',
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(16px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
          },
        })}
      >
        {imageSection}
        {detailsSection}
      </Card>
    </motion.div>
  )
}
