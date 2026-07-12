import { Box, Typography, Grid, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Train,
  Plane,
  Landmark,
  Building,
  Anchor,
  GraduationCap,
  School,
  Library,
  Hospital,
  ShoppingBag,
  MapPin,
} from 'lucide-react'
import type { NearbyLocationCategory, ProjectNearbyLocation } from '../../lib/types'

interface NearbyAmenitiesProps {
  amenities?: ProjectNearbyLocation[]
}

const getCategoryIcon = (category: NearbyLocationCategory | string) => {
  const props = { size: 28, strokeWidth: 1.5 }
  switch (category) {
    case 'Train Station':
      return <Train {...props} />
    case 'Airport':
      return <Plane {...props} />
    case 'Bank':
      return <Landmark {...props} />
    case 'Chamber of Commerce':
      return <Building {...props} />
    case 'Port':
      return <Anchor {...props} />
    case 'University':
      return <GraduationCap {...props} />
    case 'School':
      return <School {...props} />
    case 'Library':
      return <Library {...props} />
    case 'Hospital':
      return <Hospital {...props} />
    case 'Mall':
      return <ShoppingBag {...props} />
    default:
      return <MapPin {...props} />
  }
}

export default function NearbyAmenities({ amenities = [] }: NearbyAmenitiesProps) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  if (!amenities.length) {
    return null
  }

  return (
    <Box sx={{ mt: 6, mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4, textAlign: 'center' }}>
        {t('project.nearbyLocations', 'Nearby Locations')}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          bgcolor: 'white',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
        }}
      >
        <Grid container spacing={4} justifyContent="center">
          {amenities.map((amenity, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }} key={`${amenity.id}-${index}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1,
                  }}
                >
                  <Box sx={{ color: 'text.secondary', mb: 1 }}>
                    {getCategoryIcon(amenity.category)}
                  </Box>

                  <Typography variant="h4" fontWeight="300" sx={{ color: 'text.primary', lineHeight: 1 }}>
                    {typeof amenity.estimatedMinutes === 'number' ? amenity.estimatedMinutes : '—'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      lineHeight: 1.4,
                      mt: 1,
                    }}
                  >
                    {typeof amenity.estimatedMinutes === 'number'
                      ? isRtl
                        ? 'دقيقة من'
                        : 'MINUTES FROM'
                      : isRtl
                        ? 'من'
                        : 'NEAR'}
                    <br />
                    <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {isRtl ? amenity.nameAr || amenity.name : amenity.name}
                    </Box>
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}
