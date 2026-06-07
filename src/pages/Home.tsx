import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Box, Container, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import HeroSection from '../components/home/HeroSection'
import InspiringSpacesSection from '../components/home/InspiringSpacesSection'
import StatsSection from '../components/home/StatsSection'
import OurFieldsSection from '../components/home/OurFieldsSection'
import AboutProjectsSection from '../components/home/AboutProjectsSection'
import RegisterInterestModal from '../components/home/RegisterInterestModal'
import MorphicBackground from '../components/home/MorphicBackground'
import { HomePageContentProvider, useHomePageContent } from '../contexts/HomePageContentContext'

function HomePageContent() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const { i18n } = useTranslation()
  const { content, text } = useHomePageContent()

  useEffect(() => {
    // Update HTML lang and dir attributes when language changes
    document.documentElement.lang = i18n.language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <Box sx={{ position: 'relative', overflowX: 'hidden' }}>
      <MorphicBackground />
      <HeroSection />
      <InspiringSpacesSection />
      <StatsSection />
      <OurFieldsSection />
      <AboutProjectsSection />

      {/* CMA Section */}
      <Box sx={{ py: 6, px: { xs: 2, md: 3 }, bgcolor: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box
              component="img"
              src={content.cma.imageUrl}
              alt="Capital Market Authority"
              sx={{
                display: 'block',
                maxWidth: 'min(100%, 420px)',
                height: 'auto',
                maxHeight: { xs: 160, sm: 200, md: 220 },
                objectFit: 'contain',
                mx: 'auto',
                mb: 4
              }}
            />
            <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', color: 'text.secondary', lineHeight: 1.8 }}>
              {text(content.cma.description)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxWidth: '640px',
                mx: 'auto',
                mt: 3,
                color: 'text.secondary',
                lineHeight: 1.7,
                fontWeight: 500,
              }}
            >
              {text(content.cma.teaser)}
            </Typography>
            <Button
              component={Link}
              to={content.cma.ctaLink}
              variant="outlined"
              size="medium"
              sx={{ mt: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              {text(content.cma.ctaLabel)}
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={(theme) => ({ py: 8, px: { xs: 2, md: 3 }, bgcolor: theme.palette.primary.main, color: 'white' })}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {text(content.cta.title)}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, maxWidth: '42rem', mx: 'auto' }}>
              {text(content.cta.description)}
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIsRegisterModalOpen(true)}
              sx={{
                px: { xs: 2.25, sm: 2.75 },
                py: { xs: 1, sm: 1.125 },
                gap: 0.5,
                borderRadius: 1.5,
                borderWidth: 1.5,
                fontWeight: 500,
                borderColor: 'rgba(255, 255, 255, 0.75)',
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                '&:hover': {
                  borderWidth: 1.5,
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              {text(content.cta.buttonLabel)}
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Register Interest Modal */}
      <RegisterInterestModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </Box>
  )
}

export default function Home() {
  return (
    <HomePageContentProvider>
      <HomePageContent />
    </HomePageContentProvider>
  )
}

