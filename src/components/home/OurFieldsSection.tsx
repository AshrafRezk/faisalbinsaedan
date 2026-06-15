import { Box, Container, Typography, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useHomePageContent } from '../../contexts/HomePageContentContext'

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800'

const PROJECT_TYPE_BY_CARD_ID: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
}

function fieldCardLink(cardId: string, fallbackLink: string): string {
  const projectType = PROJECT_TYPE_BY_CARD_ID[cardId]
  if (!projectType) return fallbackLink
  return `/search?view=projects&projectType=${encodeURIComponent(projectType)}`
}

export default function OurFieldsSection() {
  const { content, text } = useHomePageContent()

  return (
    <Box
      id="our-fields"
      sx={{ py: 8, px: { xs: 2, md: 3 }, bgcolor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)' }}
    >
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h3"
            fontWeight="600"
            color="primary.main"
            gutterBottom
            sx={{ mb: 6 }}
          >
            {text(content.ourFields.title)}
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {content.ourFields.cards.map((field, index) => {
            const cardLink = fieldCardLink(field.id, field.link)
            return (
            <Grid size={{ xs: 12, md: 6 }} key={field.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Box
                  component={Link}
                  to={cardLink}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    '&:hover .field-read-more': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 240, md: 320 },
                      mb: 3,
                      overflow: 'hidden',
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={field.imageUrl}
                      alt={text(field.title)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = IMAGE_FALLBACK
                      }}
                    />
                  </Box>
                  <Typography variant="h4" fontWeight="500" color="primary.main" gutterBottom sx={{ mb: 2 }}>
                    {text(field.title)}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, flexGrow: 1, lineHeight: 1.7, fontSize: '0.95rem' }}
                  >
                    {text(field.description)}
                  </Typography>
                  <Typography
                    className="field-read-more"
                    variant="body2"
                    fontWeight={700}
                    color="primary.main"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.85rem',
                      width: 'fit-content',
                    }}
                  >
                    {text(content.ourFields.readMoreLabel)}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}
