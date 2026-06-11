import { Box, Container, Typography, Paper, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import CommercialLeadForm from '../components/commercial/CommercialLeadForm'
import { Building2 } from 'lucide-react'

export default function CommercialRental() {
  const { t } = useTranslation()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fa', pb: 10 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative', 
          height: { xs: '40vh', md: '50vh' }, 
          minHeight: 300, 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.dark'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
            zIndex: 1
          }} 
        />
        
        {/* Placeholder background, could use a real image if provided */}
        <Box 
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.3,
            backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                <Building2 size={40} color="white" />
              </Box>
            </Box>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold', mb: 2, fontSize: { xs: '2rem', md: '3.5rem' } }}>
              {t('commercial.heroTitle')}
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 800, mx: 'auto', fontWeight: 'medium' }}>
              {t('commercial.heroSubtitle')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 600, mx: 'auto', mt: 2 }}>
              {t('commercial.heroDescription')}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 10 }}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 3, md: 5 }, 
                  borderRadius: 4, 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                    {t('commercial.formTitle')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t('commercial.formCta')}
                  </Typography>
                </Box>

                <CommercialLeadForm />
                
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
