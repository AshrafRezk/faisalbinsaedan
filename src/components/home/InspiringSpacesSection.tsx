import { Box, Container, Typography, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { useHomePageContent } from '../../contexts/HomePageContentContext'

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800'

export default function InspiringSpacesSection() {
  const { content, text } = useHomePageContent()

  return (
    <Box id="inspiring-spaces" sx={{ py: { xs: 8, md: 12 }, overflow: 'hidden' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4, lg: 6 } }}>
        <Grid container spacing={6} alignItems="center">
          
          {/* Left Column: Title & Text */}
          <Grid item xs={12} md={5}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  color: 'primary.main',
                  lineHeight: 1.1,
                  mb: 4,
                  letterSpacing: '-0.02em',
                }}
              >
                {text(content.inspiringSpaces.title)}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'primary.dark',
                  lineHeight: 1.8,
                  fontSize: '1.1rem',
                  maxWidth: '400px',
                }}
              >
                {text(content.inspiringSpaces.description)}
              </Typography>
            </motion.div>
          </Grid>

          {/* Right Column: Building Image/Video Mockup */}
          <Grid item xs={12} md={7}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: { xs: '300px', md: '500px' },
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  bgcolor: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Fallback image placeholder matching the mockup style */}
                <Box
                  component="img"
                  src={content.inspiringSpaces.imageUrl}
                  alt={text(content.inspiringSpaces.title)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = IMAGE_FALLBACK
                  }}
                />
              </Box>
            </motion.div>
          </Grid>

        </Grid>
      </Container>
    </Box>
  )
}
