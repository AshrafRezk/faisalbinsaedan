import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Link as MuiLink,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowRight, FileText, Image as ImageIcon, ExternalLink, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { getProject, getProjectMapUnits } from '../lib/api-client'
import type { Project, ProjectMapUnit } from '../lib/types'
import { isModelImageFile, isModelPdfFile } from '../lib/projectMedia'
import { useFeatureSwitchStore } from '../lib/store'
import RegisterInterestModal from '../components/home/RegisterInterestModal'
import NearbyAmenities from '../components/project/NearbyAmenities'
import ProjectBrochureViewer from '../components/project/ProjectBrochureViewer'
import CircularGallery from '../components/reactbits/CircularGallery'
import ProjectModelViewer from '../components/project/ProjectModelViewer'
import type { ProjectModelFile } from '../lib/types'
import InteractiveTopPlan from '../components/project/InteractiveTopPlan'
import FinanceCalculatorModal, { SakaniMathIcon } from '../components/ui/FinanceCalculatorModal'
import ProjectUnitsMap from '../components/map/ProjectUnitsMap'
import { toGoogleMapsEmbedUrl, toGoogleMapsOpenUrl } from '../lib/googleMapsUrls'
import { projectHasMapData, resolveMapCentroid } from '../lib/projectMap'

type ProjectWithUi = Project & { hasAvailability?: boolean; availablePhasesCount?: number; nameEn?: string; locationEn?: string }

const MotionBox = motion.create(Box)
const MotionCard = motion.create(Card)

function projectMapFallback(project: ProjectWithUi) {
  return {
    lat: project.mapCentroidLat,
    lng: project.mapCentroidLng,
    query: project.name || project.location || project.locationAr,
  }
}

export default function ProjectDetails() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getFeature } = useFeatureSwitchStore()
  const [project, setProject] = useState<ProjectWithUi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [modelViewerOpen, setModelViewerOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ProjectModelFile | null>(null)
  const [activeModel, setActiveModel] = useState<ProjectModelFile | null>(null)
  const [mapUnits, setMapUnits] = useState<ProjectMapUnit[]>([])
  const [selectedMapUnitId, setSelectedMapUnitId] = useState<string | null>(null)
  const [isLoadingMapUnits, setIsLoadingMapUnits] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      setIsLoading(true)
      try {
        const res = await getProject(id)
        if (res.success && res.data) setProject(res.data as ProjectWithUi)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    async function loadMapUnits() {
      if (!id || !project) return
      setIsLoadingMapUnits(true)
      try {
        const res = await getProjectMapUnits(id)
        if (res.success && res.data) setMapUnits(res.data)
        else setMapUnits([])
      } finally {
        setIsLoadingMapUnits(false)
      }
    }
    loadMapUnits()
  }, [id, project?.id])

  const title = useMemo(() => {
    if (!project) return ''
    return i18n.language === 'ar' ? project.nameAr : project.name
  }, [project, i18n.language])

  const location = useMemo(() => {
    if (!project) return ''
    const primary = i18n.language === 'ar' ? project.locationAr : project.location
    if (typeof primary === 'string' && primary.trim().length > 0) return primary
    const fallback = i18n.language === 'ar' ? project.location : project.locationAr
    return typeof fallback === 'string' && fallback.trim().length > 0 ? fallback : ''
  }, [project, i18n.language])

  // Kept for the (now disabled) circular photos section.
  const galleryItems = useMemo(() => {
    if (!project) return []
    return (project.gallery || []).map((g) => ({
      image: g.url,
      text: i18n.language === 'ar' ? g.tagAr : g.tagEn,
    }))
  }, [project, i18n.language])

  // No-op: photos section disabled.
  const handleGalleryClick = (_clickedMedia: { image: string; text: string }) => {}

  const modelFiles = project?.modelFiles || []

  const mapEmbedUrl = useMemo(
    () => (project ? toGoogleMapsEmbedUrl(project.projectLocationUrl, projectMapFallback(project)) : null),
    [project]
  )

  const googleMapsOpenUrl = useMemo(
    () => (project ? toGoogleMapsOpenUrl(project.projectLocationUrl, projectMapFallback(project)) : null),
    [project]
  )

  const sakaniMapCentroid = useMemo(
    () => (project ? resolveMapCentroid(project) : undefined),
    [project]
  )

  const hasSakaniMap = Boolean(project && projectHasMapData(project))
  const hasUnitMap = mapUnits.length > 0
  const isAr = i18n.language.startsWith('ar')
  const projectSummary = useMemo(() => {
    if (!project) return ''
    const primary = isAr ? project.descriptionAr : project.description
    if (typeof primary === 'string' && primary.trim()) return primary.trim()
    const fallback = isAr ? project.description : project.descriptionAr
    return typeof fallback === 'string' ? fallback.trim() : ''
  }, [project, isAr])

  const handleMapUnitSelect = (unitId: string) => {
    if (selectedMapUnitId === unitId) {
      navigate(`/unit/${unitId}`)
    } else {
      setSelectedMapUnitId(unitId)
    }
  }

  useEffect(() => {
    if (!modelFiles.length) {
      setActiveModel(null)
      return
    }
    setActiveModel((prev) => {
      if (!prev) return modelFiles[0]
      return modelFiles.some((m) => m.id === prev.id) ? prev : modelFiles[0]
    })
    // Only react to project id changes; modelFiles is derived from `project`.
  }, [project?.id])

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!project) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('project.notFound', 'Project not found')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('common.back', 'Back')}
        </Button>
      </Container>
    )
  }

  // Determine if video is native
  const isNativeVideo = project.featuredVideoUrl && 
                        (project.featuredVideoUrl.endsWith('.mp4') || 
                         project.featuredVideoUrl.endsWith('.webm') ||
                         project.featuredVideoUrl.includes('salesforce-file'))


  const openModelViewer = (model: ProjectModelFile) => {
    setSelectedModel(model)
    setModelViewerOpen(true)
  }

  const closeModelViewer = () => {
    setModelViewerOpen(false)
    setSelectedModel(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fa', pb: 10 }}>
      {/* Sticky Header */}
      <Paper
        sx={(theme) => ({
          position: 'sticky',
          top: 0,
          zIndex: 40,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
        })}
        elevation={0}
      >
        <Container maxWidth="xl" sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button startIcon={<ArrowRight />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
              {t('common.back', 'Back')}
            </Button>
            <Button component={RouterLink} to={`/search?projectId=${project.id}`} variant="outlined" size="small" sx={{ borderRadius: 8, px: 3 }}>
              {t('home.viewUnits', 'View units')}
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* Hero Section */}
      <Box sx={{ position: 'relative', height: { xs: '60vh', md: '75vh' }, minHeight: 400, overflow: 'hidden' }}>
        <Box 
          component="img" 
          src={project.coverImageUrl || '/placeholder.jpg'} 
          alt={title}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%)' }} />

        {/* Animated Sun Flare 1 */}
        <MotionBox
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: { xs: '120vw', md: '60vw' },
            height: { xs: '120vw', md: '60vw' },
            background: 'radial-gradient(circle, rgba(255,220,150,0.4) 0%, rgba(255,200,100,0.15) 30%, rgba(255,255,255,0) 70%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Animated Sun Flare 2 */}
        <MotionBox
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 12,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 2,
          }}
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '-20%',
            width: { xs: '150vw', md: '80vw' },
            height: { xs: '150vw', md: '80vw' },
            background: 'radial-gradient(circle, rgba(255,180,120,0.3) 0%, rgba(255,150,80,0.1) 40%, rgba(255,255,255,0) 70%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        
        <Container maxWidth="xl" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', pb: 6 }}>
          <MotionBox 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }}
            sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 3 }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {project.logoUrl && (
                <Box 
                  sx={{ 
                    width: { xs: 80, md: 120 }, 
                    height: { xs: 80, md: 120 }, 
                    bgcolor: 'white', 
                    borderRadius: 4, 
                    p: 1.5, 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
                  }}
                >
                  <Box component="img" src={project.logoUrl} alt="Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </Box>
              )}
              <Box>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.3)', mb: 1, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                  {title}
                </Typography>
                {projectSummary && (
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.92)',
                      fontWeight: 400,
                      lineHeight: 1.7,
                      mb: 1.5,
                      maxWidth: { xs: '100%', md: 640 },
                      textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      whiteSpace: 'pre-line',
                      fontSize: { xs: '1rem', md: '1.15rem' },
                    }}
                  >
                    {projectSummary}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.9)' }}>
                  <MapPin size={18} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {location}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setIsRegisterModalOpen(true)}
                sx={{
                  py: 2,
                  px: 5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 8,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {t('home.registerInterest')}
              </Button>
              {getFeature('Enable_Funding_Calculator__c', true) && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setIsCalculatorOpen(true)}
                  startIcon={<SakaniMathIcon color="white" />}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 8,
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.18)',
                      borderColor: 'white',
                    },
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    width: { xs: '100%', sm: 'auto' },
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {i18n.language === 'ar' ? 'حاسبة التمويل العقاري' : 'Mortgage Calculator'}
                </Button>
              )}
            </Stack>
          </MotionBox>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: -4, position: 'relative', zIndex: 10 }}>
        
        {/* Availability Badge */}
        {typeof project.availablePhasesCount === 'number' && (
          <MotionBox initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} sx={{ mb: 4 }}>
            <Chip
              size="medium"
              color={project.availablePhasesCount > 0 ? 'success' : 'default'}
              label={
                project.availablePhasesCount > 0
                  ? t('home.phasesAvailable', { count: project.availablePhasesCount })
                  : t('home.soldOut', 'Sold out')
              }
              sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5, px: 2, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </MotionBox>
        )}

        <Grid container spacing={4}>
          
          {/* Left Column: Visuals & Map */}
          <Grid size={{ xs: 12, lg: 8 }}>
            
            {/* Video Advert Section */}
            {project.featuredVideoUrl && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                sx={{ mb: 4, position: 'relative', borderRadius: 4, overflow: 'hidden' }}
              >
                {/* Animated Gradient Frame */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -2,
                    background: 'linear-gradient(45deg, #FF8A00, #E52E71, #FF8A00)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-border 3s ease infinite',
                    zIndex: 0,
                    borderRadius: 4,
                    '@keyframes gradient-border': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' },
                      '100%': { backgroundPosition: '0% 50%' },
                    }
                  }}
                />
                
                {/* Video Container */}
                <Box sx={{ position: 'relative', zIndex: 1, width: '100%', borderRadius: 'calc(16px - 2px)', overflow: 'hidden', bgcolor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isNativeVideo ? (
                    <video src={project.featuredVideoUrl} autoPlay muted loop playsInline controls style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', maxHeight: '80vh' }} />
                  ) : (
                    <Box component="iframe" src={project.featuredVideoUrl} sx={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
                  )}
                </Box>
              </MotionBox>
            )}

            {/* Circular Gallery Section */}
            {false && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)', bgcolor: 'transparent' }}
              >
                <CardContent sx={{ p: 0, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#000' }}>
                      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(10px)' }}>
                        <ImageIcon size={24} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">{t('project.gallery', 'Project Gallery')}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', mt: 1, ml: 1 }}>
                      {t('project.galleryHint', 'Drag to explore. Click to view.')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ width: '100%', height: { xs: 400, md: 600 } }}>
                    <CircularGallery 
                      items={galleryItems} 
                      bend={3}
                      textColor="#000000"
                      borderRadius={0.05} 
                      onClick={handleGalleryClick} 
                    />
                  </Box>
                </CardContent>
              </MotionCard>
            )}



            {/* Brochure Section */}
            {project.brochureUrl && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)', bgcolor: 'transparent' }}
              >
                <CardContent sx={{ p: 0, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10, pointerEvents: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.primary' }}>
                      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                        <FileText size={24} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">{t('project.brochure', 'Project Brochure')}</Typography>
                    </Box>
                  </Box>
                  <ProjectBrochureViewer pdfUrl={project.brochureUrl} />
                </CardContent>
              </MotionCard>
            )}

          </Grid>

          {/* Sidebar column (visual left in RTL): Location + Models */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 100 }}>
              
              {/* Interactive Master Plan */}
              {project.topPlanUrl && (
                <InteractiveTopPlan imageUrl={project.topPlanUrl} />
              )}

              {/* Map Section (Location) */}
              <MotionCard
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.8)', bgcolor: 'white' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('project.location', 'Location')}</Typography>
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative', mb: 2, border: 1, borderColor: 'divider' }}>
                    {isLoadingMapUnits ? (
                      <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : hasUnitMap || hasSakaniMap ? (
                      <ProjectUnitsMap
                        projectGeometry={project?.mapGeometryJson}
                        projectCentroid={sakaniMapCentroid}
                        units={mapUnits}
                        selectedUnitId={selectedMapUnitId}
                        onUnitSelect={handleMapUnitSelect}
                        height={360}
                        isRtl={isAr}
                      />
                    ) : mapEmbedUrl ? (
                      <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                        <Box
                          component="iframe"
                          src={mapEmbedUrl}
                          title={t('project.location', 'Location')}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                          sx={{
                            border: 0,
                            display: 'block',
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={48} color="#e0e0e0" style={{ marginBottom: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('project.mapUnavailable', 'Map data not available')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {googleMapsOpenUrl && (
                    <Button
                      component="a"
                      href={googleMapsOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink size={16} />}
                      sx={{ mb: 2 }}
                    >
                      {t('project.openInGoogleMaps', 'Open in Google Maps')}
                    </Button>
                  )}
                  <NearbyAmenities amenities={project.nearbyLocations} />
                </CardContent>
              </MotionCard>

              {/* Unit Models — under Location */}
              {modelFiles.length > 0 && (
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    bgcolor: 'background.paper',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      {t('project.models', 'Unit Models')}
                    </Typography>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'auto',
                          bgcolor: 'background.paper',
                          maxHeight: 220,
                        }}
                      >
                        <Stack sx={{ p: 1.5 }} spacing={1}>
                          {modelFiles.map((model) => {
                            const modelLabel = t('project.modelLabel', {
                              number: model.number,
                              defaultValue: `Model ${model.number}`,
                            })
                            const canExpand =
                              isModelPdfFile(model.fileExtension) || isModelImageFile(model.fileExtension)
                            const isActive = activeModel?.id === model.id

                            return (
                              <Paper
                                key={model.id}
                                variant="outlined"
                                role="button"
                                tabIndex={0}
                                onClick={() => setActiveModel(model)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') setActiveModel(model)
                                }}
                                sx={{
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  borderColor: isActive ? 'primary.main' : 'divider',
                                  borderWidth: isActive ? 2 : 1,
                                  bgcolor: isActive ? alpha('#1a365d', 0.04) : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'box-shadow 0.2s, transform 0.2s',
                                  '&:hover': { transform: 'translateY(-1px)' },
                                }}
                              >
                                <Box
                                  sx={{
                                    px: 1.8,
                                    py: 1.2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    direction: 'rtl',
                                  }}
                                >
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {modelLabel}
                                  </Typography>
                                  {canExpand ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                      {t('project.clickToEnlarge', 'Click to enlarge')}
                                    </Typography>
                                  ) : (
                                    <ExternalLink size={14} opacity={0.55} />
                                  )}
                                </Box>
                              </Paper>
                            )
                          })}
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden',
                          bgcolor: 'background.paper',
                          minHeight: 220,
                        }}
                      >
                        {activeModel ? (
                          isModelPdfFile(activeModel.fileExtension) ? (
                            <Box
                              sx={{
                                height: 220,
                                bgcolor: '#1a1a1a',
                                cursor: 'pointer',
                              }}
                              onClick={() => openModelViewer(activeModel)}
                            >
                              <ProjectBrochureViewer pdfUrl={activeModel.url} />
                            </Box>
                          ) : isModelImageFile(activeModel.fileExtension) ? (
                            <Box
                              sx={{
                                width: '100%',
                                height: 220,
                                bgcolor: 'grey.100',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onClick={() => openModelViewer(activeModel)}
                            >
                              <Box
                                component="img"
                                src={activeModel.url}
                                alt={activeModel.title}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  maxHeight: 220,
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ p: 2 }}>
                              <Button
                                component="a"
                                href={activeModel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                startIcon={<ExternalLink size={16} />}
                              >
                                {t('project.openModelFile', 'Open file')}
                              </Button>
                            </Box>
                          )
                        ) : (
                          <Box sx={{ p: 2, color: 'text.secondary' }}>
                            {t('project.noModelsSelected', 'Select a model from the list')}
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </MotionCard>
              )}

              
            </Box>
          </Grid>
        </Grid>
      </Container>

      <RegisterInterestModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        projectId={project.id}
        projectName={title}
        fallbackProvinceRegion={project.provinceRegion}
        fallbackCity={project.city}
      />

      <FinanceCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        propertyPrice={800000}
        onBookClick={() => setIsRegisterModalOpen(true)}
      />


      <ProjectModelViewer
        isOpen={modelViewerOpen}
        onClose={closeModelViewer}
        url={selectedModel?.url ?? null}
        title={
          selectedModel
            ? t('project.modelLabel', {
                number: selectedModel.number,
                defaultValue: `Model ${selectedModel.number}`,
              })
            : null
        }
        fileExtension={selectedModel?.fileExtension}
      />
    </Box>
  )
}
