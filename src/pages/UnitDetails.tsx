import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowRight, Bed, Bath, Maximize, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import UnitCard from '../components/search/UnitCard'
import RegisterInterestModal from '../components/home/RegisterInterestModal'
import ImageGallery from '../components/ui/ImageGallery'
import ImageCarousel from '../components/ui/ImageCarousel'
import FavoriteButton from '../components/ui/FavoriteButton'
import ShareButton from '../components/ui/ShareButton'
import { getUnit } from '../lib/api-client'
import { isModelImageFile, isModelPdfFile } from '../lib/projectMedia'
import { useAuthStore, useFeatureSwitchStore } from '../lib/store'
import { Unit, ProjectModelFile } from '../lib/types'
import { getUnitDisplayPrice } from '../lib/unitPrice'
import UnitPriceDisplay from '../components/units/UnitPriceDisplay'
import ProjectModelViewer from '../components/project/ProjectModelViewer'
import ProjectBrochureViewer from '../components/project/ProjectBrochureViewer'
import SubsidyBadges from '../components/units/SubsidyBadges'
import FinanceCalculatorModal, { SakaniMathIcon } from '../components/ui/FinanceCalculatorModal'

export default function UnitDetails() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getFeature } = useFeatureSwitchStore()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [relatedUnits, setRelatedUnits] = useState<Unit[]>([])
  const [modelFile, setModelFile] = useState<ProjectModelFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [modelViewerOpen, setModelViewerOpen] = useState(false)

  useEffect(() => {
    async function loadUnit() {
      if (!id) return
      setIsLoading(true)
      try {
        const response = await getUnit(id)
        if (response.success && response.data) {
          setUnit(response.data.unit)
          setRelatedUnits(response.data.relatedUnits)
          setModelFile(response.data.modelFile ?? null)
        }
      } catch (error) {
        console.error('Error loading unit:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUnit()
  }, [id])

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!unit) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          الوحدة غير موجودة
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          عذراً، لم نتمكن من العثور على هذه الوحدة
        </Typography>
        <Button variant="contained" onClick={() => navigate('/search')}>
          العودة للبحث
        </Button>
      </Container>
    )
  }

  const statusColors: Partial<Record<Unit['status'], 'success' | 'warning' | 'error'>> = {
    Available: 'success',
    Reserved: 'warning',
    Sold: 'error',
  }

  const statusLabels: Partial<Record<Unit['status'], string>> = {
    Available: 'متاح',
    Reserved: 'محجوز',
    Sold: 'مباع',
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      {/* Back Button */}
      <Paper
        sx={(theme) => ({
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(16px)',
        })}
        elevation={0}
      >
        <Container maxWidth="lg" sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              startIcon={<ArrowRight />}
              onClick={() => navigate(-1)}
              sx={{ color: 'text.secondary' }}
            >
              رجوع
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <FavoriteButton unitId={unit.id} size="small" />
              <ShareButton
                url={`${window.location.origin}/unit/${unit.id}`}
                title={unit.projectNameAr}
                text={`اكتشف ${unit.unitNumber} في ${unit.projectNameAr}`}
                image={unit.images[0]}
                size="small"
              />
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* Image Carousel */}
        <Box
          sx={{
            position: 'relative',
            mb: 4,
            mt: 2,
          }}
        >
          <Box
            onClick={() => setIsGalleryOpen(true)}
            sx={{
              cursor: 'pointer',
              '&:hover .carousel-overlay': {
                opacity: 1,
              },
            }}
          >
            <ImageCarousel images={unit.images} height={{ xs: '50vh', md: '65vh' }} />
            <Box
              className="carousel-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                zIndex: 1,
                pointerEvents: 'none',
                borderRadius: { xs: 0, md: 2 },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                {i18n.language === 'ar' ? 'انقر لعرض المعرض' : 'Click to view gallery'}
              </Typography>
            </Box>
          </Box>
            <Box sx={{ position: 'absolute', top: { xs: 16, md: 20 }, right: { xs: 16, md: 20 }, zIndex: 4, display: 'flex', gap: 1 }}>
              {unit.usageType === 'Rental' && (
                <Chip
                  label={i18n.language.startsWith('ar') ? 'تأجير' : 'Rental'}
                  color="info"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
              <Chip
                label={statusLabels[unit.status] || unit.status}
                color={statusColors[unit.status] || 'warning'}
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Box>
            <Box sx={{ position: 'absolute', top: { xs: 16, md: 20 }, left: { xs: 16, md: 20 }, zIndex: 4 }}>
            <SubsidyBadges eligible={unit.eligibleForSubsidies} size="large" />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: { xs: 2, md: 0 }, pb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={unit.unitNumber}
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  height: 32,
                }}
              />
              <Box sx={{ mb: 1 }}>
                <UnitPriceDisplay unit={unit} variant="detailed" />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                {unit.projectNameAr} • {unit.phaseNameAr}
              </Typography>
            </Box>

            {/* Specs Grid */}
            <Card
              sx={(theme) => ({
                mb: 4,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(16px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                borderRadius: 2,
              })}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Bed size={28} color="#1a365d" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        {t('unit.bedroomsLabel')}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {unit.bedrooms}
                      </Typography>
                    </Box>
                  </Grid>
                  {unit.bathrooms && (
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'grey.50',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'grey.100',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Bath size={28} color="#1a365d" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          {t('unit.bathroomsLabel')}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          {unit.bathrooms}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Maximize size={28} color="#1a365d" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        {t('unit.areaLabel')}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {unit.area} {t('unit.areaUnit')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Project model layout (from project files + Model__c) */}
            {modelFile && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ mb: 2 }}>
                  {t('unit.modelLayout', 'Unit model layout')}
                  {unit.model && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({unit.model})
                    </Typography>
                  )}
                </Typography>
                <Card
                  onClick={() => setModelViewerOpen(true)}
                  sx={(theme) => ({
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    },
                  })}
                >
                  {isModelPdfFile(modelFile.fileExtension) ? (
                    <Box
                      sx={{ height: { xs: 320, md: 420 }, bgcolor: '#1a1a1a', pointerEvents: 'none' }}
                    >
                      <ProjectBrochureViewer pdfUrl={modelFile.url} />
                    </Box>
                  ) : isModelImageFile(modelFile.fileExtension) ? (
                    <Box
                      component="img"
                      src={modelFile.url}
                      alt={modelFile.title}
                      sx={{
                        width: '100%',
                        display: 'block',
                        maxHeight: 480,
                        objectFit: 'contain',
                        bgcolor: 'grey.100',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('project.clickToEnlarge', 'Click to enlarge')}
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Box>
            )}

            {/* Description */}
            {(i18n.language === 'ar' ? unit.descriptionAr : unit.description) && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ mb: 2 }}>
                  {t('unit.description')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {i18n.language === 'ar' ? unit.descriptionAr : unit.description}
                </Typography>
              </Box>
            )}

            {/* Floor Plan */}
            {unit.floorPlan && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ mb: 2 }}>
                  {i18n.language === 'ar' ? 'الخريطة' : 'Floor Plan'}
                </Typography>
                <Card>
                  <Box
                    component="img"
                    src={unit.floorPlan}
                    alt="Floor Plan"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </Card>
              </Box>
            )}

            {/* 3D View */}
            {unit.sketchupEmbedUrl && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ mb: 2 }}>
                  {i18n.language === 'ar' ? 'عرض ثلاثي الأبعاد' : '3D View'}
                </Typography>
                <Card>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      overflow: 'hidden',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <Box
                      component="iframe"
                      src={unit.sketchupEmbedUrl}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                      }}
                      allowFullScreen
                      title="3D Unit View"
                    />
                  </Box>
                </Card>
              </Box>
            )}

            {/* Amenities */}
            {unit.amenities && unit.amenities.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ mb: 3 }}>
                  {i18n.language === 'ar' ? 'المرافق' : 'Amenities'}
                </Typography>
                <Grid container spacing={2}>
                  {unit.amenities.map((amenity, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.200',
                        }}
                      >
                        <Check size={20} color="#1a365d" style={{ flexShrink: 0 }} />
                        <Typography variant="body2" color="text.primary">
                          {amenity}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* CTAs */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4, mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => setIsRegisterModalOpen(true)}
                disabled={unit.status === 'Sold'}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'semibold',
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {unit.status === 'Sold' ? t('unit.sold') : t('unit.registerInterest')}
              </Button>

              {getFeature('Enable_Funding_Calculator__c', true) && (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => setIsCalculatorOpen(true)}
                  startIcon={<SakaniMathIcon color="#1a365d" />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'semibold',
                    borderColor: 'rgba(0,0,0,0.12)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    '&:hover': {
                      bgcolor: 'grey.50',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  {i18n.language === 'ar' ? 'حاسبة التمويل العقاري' : 'Mortgage Calculator'}
                </Button>
              )}

              {user && (
                <Button component={Link} to="/community" variant="outlined" size="large" fullWidth>
                  {t('unit.openSupportCase')}
                </Button>
              )}
            </Box>

            {/* Related Units */}
            {relatedUnits.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight="semibold" gutterBottom>
                  {t('unit.similarUnits')}
                </Typography>
                <Grid container spacing={2}>
                  {relatedUnits.map((relatedUnit) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={relatedUnit.id}>
                      <UnitCard unit={relatedUnit} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </motion.div>
        </Box>
      </Container>

      {/* Register Interest Modal */}
      <RegisterInterestModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        projectId={unit.projectId}
        phaseId={unit.phaseId}
        unitId={unit.id}
        unitNumber={unit.unitNumber}
        projectName={unit.projectNameAr || unit.projectName}
        fallbackProvinceRegion={unit.projectProvinceRegion}
        fallbackCity={unit.projectCity}
      />

      <FinanceCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        propertyPrice={getUnitDisplayPrice(unit)}
        onBookClick={() => setIsRegisterModalOpen(true)}
      />

      {/* Image Gallery */}
      {isGalleryOpen && (
        <ImageGallery
          images={unit.images}
          initialIndex={0}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      <ProjectModelViewer
        isOpen={modelViewerOpen}
        onClose={() => setModelViewerOpen(false)}
        url={modelFile?.url ?? null}
        title={
          modelFile
            ? unit.model ||
              t('project.modelLabel', {
                number: modelFile.number,
                defaultValue: `Model ${modelFile.number}`,
              })
            : null
        }
        fileExtension={modelFile?.fileExtension}
      />
    </Box>
  )
}

