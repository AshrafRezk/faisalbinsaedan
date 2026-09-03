import { useState, useEffect } from 'react'
import { Box, Typography, LinearProgress, Paper, Chip } from '@mui/material'
import { Bed, Move, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Unit } from '../../lib/types'
import SubsidyBadges from '../units/SubsidyBadges'
import UnitPriceDisplay from '../units/UnitPriceDisplay'

interface DashboardUnitCardProps {
  unit: Unit
}

export default function DashboardUnitCard({ unit }: DashboardUnitCardProps) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  // Dynamic image source with fallback handlers
  const [imageSrc, setImageSrc] = useState(
    unit.unitImage || (unit.images && unit.images[0]) || unit.projectHeroImage || '/placeholder-unit.jpg'
  )

  // Keep state in sync if unit prop updates
  useEffect(() => {
    setImageSrc(unit.unitImage || (unit.images && unit.images[0]) || unit.projectHeroImage || '/placeholder-unit.jpg')
  }, [unit])
  
  // Mock data if not present (for demo purposes as seen in screenshots)
  const progress = unit.paymentProgress || (unit.status === 'Sold' || unit.status === 'Contracted' ? 100 : 60)
  const isFullyPaid = progress === 100

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <Box
          component="img"
          src={imageSrc}
          alt={unit.unitNumber}
          onError={() => {
            if (imageSrc !== unit.projectHeroImage && unit.projectHeroImage) {
              setImageSrc(unit.projectHeroImage)
            } else if (imageSrc !== '/placeholder-unit.jpg') {
              setImageSrc('/placeholder-unit.jpg')
            }
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <SubsidyBadges eligible={unit.eligibleForSubsidies} size="large" />
        </Box>
        <Chip
          label={t(`unit.${unit.status.toLowerCase()}`)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 1,
          }}
        />
      </Box>

      {/* Content Section */}
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 0.5 }}>
            <UnitPriceDisplay unit={unit} variant="compact" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isRtl ? unit.projectNameAr : unit.projectName} • {isRtl ? unit.phaseNameAr : unit.phaseName}
          </Typography>
        </Box>

        {/* Payment Progress Section */}
        <Box sx={{ 
          mt: 'auto', 
          mb: 3, 
          p: 2, 
          borderRadius: 2, 
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="text.primary">
              {t('community.paymentPlan')}
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="primary.main">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'primary.main',
              }
            }}
          />
          {isFullyPaid && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'success.main', fontWeight: 'medium' }}>
              ✓ {t('community.fullyPaid')}
            </Typography>
          )}
        </Box>

        {/* Features & Delivery */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Bed size={16} className="text-slate-400" />
              <Typography variant="caption" color="text.secondary">
                {unit.bedrooms} {t('unit.bedrooms')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Move size={16} className="text-slate-400" />
              <Typography variant="caption" color="text.secondary">
                {unit.area} {t('unit.areaUnit')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Calendar size={16} className="text-slate-400" />
            <Typography variant="caption" color="text.secondary">
              {t('community.deliveryDate', { date: unit.deliveryDate || '2025' })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
