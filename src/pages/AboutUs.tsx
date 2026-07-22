import { useEffect, useMemo, useState } from 'react'
import { Box, Card, CardContent, Container, Grid, Typography, Dialog, DialogContent, IconButton } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { alpha } from '@mui/material/styles'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getAboutPageContent } from '../lib/api-client'
import { ABOUT_PAGE_FALLBACKS, type AboutBoardMember } from '../lib/about-page-content'

type DisplayMember = {
  name: string
  title: string
  description: string
  image: string
  linkedInUrl?: string
  twitterUrl?: string
}

function localizeMember(member: AboutBoardMember, isEnglish: boolean): DisplayMember {
  return {
    name: isEnglish ? member.name.en : member.name.ar,
    title: isEnglish ? member.title.en : member.title.ar,
    description: isEnglish ? member.description.en : member.description.ar,
    image: member.imageUrl,
    linkedInUrl: member.linkedInUrl,
    twitterUrl: member.twitterUrl,
  }
}

function MemberCard({ member, onClick }: { member: { name: string; title: string; description: string; image: string }; onClick?: () => void }) {
  return (
    <Card
      onClick={onClick}
      sx={(theme) => ({
        cursor: onClick ? 'pointer' : 'default',
        height: 'calc(100% - 64px)', // Account for mt: 8 (64px) to prevent layout overflow
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        bgcolor: alpha(theme.palette.background.paper, 0.85), // More solid, less reliant on blur
        backdropFilter: 'blur(8px)', // Reduced blur for performance
        border: `1px solid ${alpha(theme.palette.background.paper, 0.9)}`,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
        position: 'relative',
        mt: 8, // Room for the pop-out head
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.98),
          borderColor: alpha(theme.palette.primary.main, 0.3),
          '& .morphic-blob': {
            transform: 'scale(1.05) rotate(3deg)', // Simple transform instead of continuous animation
          },
          '& .member-portrait': {
            transform: 'scale(1.05) translateY(-8px)',
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))',
          }
        },
      })}
    >
      <Box sx={{ p: 2.5, pb: 0, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 220,
            height: 250,
            mt: -9, // Pulls the entire image container up, breaking the top card border!
            mb: 6, // Compensates for the negative mt, so the card height is preserved and doesn't overlap elements below!
          }}
        >
          {/* Glowing Ambient Backdrop (Replaced expensive blur with pure radial gradient) */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              left: '10%',
              width: '80%',
              height: '60%',
              background: 'radial-gradient(circle, rgba(26,54,93,0.25) 0%, rgba(26,54,93,0.1) 40%, rgba(16,45,74,0) 70%)',
              zIndex: 0,
            }}
          />

          {/* Morphic Blob Background - Removed continuous animation for performance */}
          <Box
            className="morphic-blob"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '5%',
              width: '90%',
              height: '180px', // Shorter than the container (250px), creating the pop-out base
              background: 'linear-gradient(135deg, rgba(26,54,93,0.2) 0%, rgba(16,45,74,0.15) 100%)',
              border: '1px solid rgba(26,54,93,0.4)',
              boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)',
              borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', // Organic shape without animating it
              zIndex: 1,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Portrait */}
          <motion.img
            className="member-portrait"
            src={member.image}
            alt={member.name}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              zIndex: 2,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom center', // Ground the half-body to the bottom of the container
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </Box>
      </Box>
      <CardContent
        sx={{
          p: 3,
          textAlign: 'center',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '-0.3px',
              lineHeight: 1.3,
              mb: 0.75,
            }}
          >
            {member.name}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.85rem',
              mb: 1.5,
              display: 'inline-block',
              bgcolor: 'rgba(26, 54, 93, 0.08)',
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
            }}
          >
            {member.title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function AboutUs() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language
  const isEnglish = language.startsWith('en')
  const [aboutContent, setAboutContent] = useState(ABOUT_PAGE_FALLBACKS)
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<DisplayMember | null>(null)

  useEffect(() => {
    let active = true
    const loadContent = async () => {
      setLoading(true)
      try {
        const content = await getAboutPageContent()
        if (active) setAboutContent(content)
      } catch {
        if (active) setAboutContent(ABOUT_PAGE_FALLBACKS)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadContent()
    return () => {
      active = false
    }
  }, [language])

  const topRowMembers = useMemo(
    () =>
      aboutContent.boardMembers
        .filter((member) => member.displayOrder <= 3)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((member) => localizeMember(member, isEnglish)),
    [aboutContent.boardMembers, isEnglish]
  )

  const bottomRowMembers = useMemo(
    () =>
      aboutContent.boardMembers
        .filter((member) => member.displayOrder > 3)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((member) => localizeMember(member, isEnglish)),
    [aboutContent.boardMembers, isEnglish]
  )

  const finalVision = useMemo(
    () =>
      aboutContent.vision.paragraphs
        .map((paragraph) => (isEnglish ? paragraph.en : paragraph.ar))
        .filter(Boolean),
    [aboutContent.vision.paragraphs, isEnglish]
  )

  const finalMission = useMemo(
    () =>
      aboutContent.mission.items.map((item) => (isEnglish ? item.en : item.ar)).filter(Boolean),
    [aboutContent.mission.items, isEnglish]
  )

  const visionTitle = isEnglish ? aboutContent.vision.title.en : aboutContent.vision.title.ar
  const missionTitle = isEnglish ? aboutContent.mission.title.en : aboutContent.mission.title.ar

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.primary.main, 0.35),
            backdropFilter: 'blur(20px)',
            color: 'white',
            px: { xs: 2, md: 3 },
            py: 6,
            textAlign: 'center',
          })}
        >
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {t('about.title')}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: '48rem', mx: 'auto' }}>
              {t('about.subtitle')}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Company Intro */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card
            sx={(theme) => ({
              mb: 6,
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(16px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              borderRadius: '24px',
            })}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                {t('about.companyIntroTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, fontSize: '1.02rem' }}>
                {t('about.companyIntroBody')}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* Board Members Section Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'primary.main', letterSpacing: '-0.5px' }}>
            {t('about.boardMembersTitle')}
          </Typography>
          <Box
            sx={{
              width: 60,
              height: 4,
              borderRadius: 2,
              bgcolor: 'primary.main',
              mx: 'auto',
              mt: 1.5,
            }}
          />
        </Box>

        {/* TREE STRUCTURE IMPLEMENTATION */}
        <Box sx={{ position: 'relative', mb: 8 }}>
          {/* Top Row: Chairman, CEO, Osama */}
          <Grid container spacing={3}>
            {topRowMembers.map((member, index) => (
              <Grid key={member.name + index} size={{ xs: 12, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={{ height: '100%' }}
                >
                  <MemberCard member={member} onClick={() => setSelectedMember(member)} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Desktop Tree Connector Lines */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'relative',
              height: 60,
              width: '100%',
              mt: 4, // Add breathing room from the cards above
            }}
          >
            {/* Stem downwards from center card (CEO) */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '2px',
                height: '30px',
                bgcolor: 'primary.main',
                transform: 'translateX(-50%)',
                opacity: 0.5,
              }}
            />
            {/* Central Node dot */}
            <Box
              sx={{
                position: 'absolute',
                top: '25px',
                left: '50%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
                transform: 'translateX(-50%)',
                zIndex: 2,
                boxShadow: '0 0 8px rgba(26, 54, 93, 0.4)',
              }}
            />
            {/* Horizontal expansion crossbar connecting the two child centers */}
            <Box
              sx={{
                position: 'absolute',
                top: '29px',
                left: '33.33%',
                right: '33.33%',
                height: '2px',
                bgcolor: 'primary.main',
                opacity: 0.5,
              }}
            />
            {/* Left Node dot */}
            <Box
              sx={{
                position: 'absolute',
                top: '25px',
                left: '33.33%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
                transform: 'translateX(-50%)',
                zIndex: 2,
                boxShadow: '0 0 8px rgba(26, 54, 93, 0.4)',
              }}
            />
            {/* Left drop line to Child 1 */}
            <Box
              sx={{
                position: 'absolute',
                top: '29px',
                left: '33.33%',
                width: '2px',
                height: '31px',
                bgcolor: 'primary.main',
                transform: 'translateX(-50%)',
                opacity: 0.5,
              }}
            />
            {/* Right Node dot */}
            <Box
              sx={{
                position: 'absolute',
                top: '25px',
                left: '66.67%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
                transform: 'translateX(-50%)',
                zIndex: 2,
                boxShadow: '0 0 8px rgba(26, 54, 93, 0.4)',
              }}
            />
            {/* Right drop line to Child 2 */}
            <Box
              sx={{
                position: 'absolute',
                top: '29px',
                left: '66.67%',
                width: '2px',
                height: '31px',
                bgcolor: 'primary.main',
                transform: 'translateX(-50%)',
                opacity: 0.5,
              }}
            />
          </Box>

          {/* Mobile Connector */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              my: 2,
            }}
          >
            <Box sx={{ width: 2, height: 20, bgcolor: 'primary.main', opacity: 0.5 }} />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
              }}
            />
            <Box sx={{ width: 2, height: 20, bgcolor: 'primary.main', opacity: 0.5 }} />
          </Box>

          {/* Bottom Row: Centered Child 1 and Child 2 */}
          <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
            {bottomRowMembers.map((member, index) => (
              <Grid key={member.name + index} size={{ xs: 12, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  style={{ height: '100%' }}
                >
                  <MemberCard member={member} onClick={() => setSelectedMember(member)} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* DISTINCT VISION & MISSION SECTIONS */}
        <Box sx={{ mt: 6 }}>
          {loading && (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
              {t('common.loading')}
            </Typography>
          )}

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* VISION SECTION */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Card
                    sx={(theme) => ({
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e8eef5 100%)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
                      overflow: 'hidden',
                      position: 'relative',
                    })}
                  >
                    {/* Ambient Glow */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -40,
                        right: -40,
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        background: alpha('#1a365d', 0.12),
                        filter: 'blur(30px)',
                      }}
                    />
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            bgcolor: 'primary.main',
                            color: 'common.white',
                            boxShadow: '0 4px 12px rgba(26, 54, 93, 0.3)',
                          }}
                        >
                          <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 800,
                            color: 'primary.main',
                            letterSpacing: '-0.5px',
                          }}
                        >
                          {visionTitle}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {finalVision.map((p, idx) => (
                          <Typography
                            key={idx}
                            variant="body1"
                            sx={{
                              lineHeight: 1.95,
                              color: 'text.primary',
                              fontSize: '1.05rem',
                              fontWeight: 500,
                            }}
                          >
                            {p}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* MISSION SECTION - Detached Minimalist Frosted Strips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                >
                  <Box sx={{ px: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Box
                        sx={{
                          width: 4,
                          height: 24,
                          borderRadius: 4,
                          bgcolor: 'primary.main',
                        }}
                      />
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: 'primary.main',
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {missionTitle}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {finalMission.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.08 }}
                        >
                          <Card
                            sx={(theme) => ({
                              borderRadius: '16px',
                              bgcolor: alpha(theme.palette.background.paper, 0.7),
                              backdropFilter: 'blur(20px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.background.paper, 0.95),
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                transform: 'translateX(4px)',
                              },
                            })}
                          >
                            <CardContent
                              sx={{
                                p: '20px !important',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                              }}
                            >
                              <CheckCircleRoundedIcon
                                sx={{
                                  fontSize: 22,
                                  color: 'primary.main',
                                  mt: '2px',
                                  flexShrink: 0,
                                  filter: 'drop-shadow(0 2px 4px rgba(26, 54, 93, 0.3))',
                                }}
                              />
                              <Typography
                                variant="body1"
                                sx={{
                                  lineHeight: 1.8,
                                  color: 'text.secondary',
                                  fontWeight: 500,
                                }}
                              >
                                {item}
                              </Typography>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                </motion.div>
              </Box>
            </Grid>

            {/* SIDE PANEL - Deep Navy Animated Ambient Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card
                  sx={{
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: '24px',
                    border: '1px solid rgba(26, 54, 93, 0.2)',
                    backgroundImage: 'linear-gradient(135deg, #0b1b33 0%, #16325c 100%)',
                    boxShadow: '0 20px 50px -10px rgba(2, 6, 23, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 4,
                      minHeight: { xs: 320, md: 480 },
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexGrow: 1,
                    }}
                  >
                    {/* Radial grid subtle background */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.15,
                        backgroundImage: 'radial-gradient(rgba(26,54,93,0.25) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />

                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: 'rgba(26,54,93,0.95)' }} />
                      <Typography
                        sx={{
                          fontSize: 13,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        2030
                      </Typography>
                    </Box>

                    {/* Ambient Glow Sphere */}
                    <Box
                      sx={{
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        position: 'absolute',
                        top: -40,
                        right: -50,
                        background:
                          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(26,54,93,0.55) 40%, rgba(26,54,93,0.05) 75%)',
                        opacity: 0.85,
                      }}
                    />

                    {/* Footer text content inside panel */}
                    <Box sx={{ position: 'relative', mt: 'auto', pt: 6 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          color: 'common.white',
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        {t('about.animatedPanelTitle')}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255,255,255,0.85)',
                          mt: 2,
                          lineHeight: 1.9,
                          fontSize: '1.05rem',
                        }}
                      >
                        {t('about.animatedPanelBody')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Container>
      </Box>

      {/* Member Details Modal */}
      <Dialog
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'background.paper',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
            overflow: 'hidden',
          }
        }}
      >
        {selectedMember && (
          <>
            <Box sx={{ position: 'relative', pt: 6, pb: 4, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: alpha('#102d4a', 0.03) }}>
              <IconButton
                onClick={() => setSelectedMember(null)}
                sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
              >
                <CloseRoundedIcon />
              </IconButton>
              
              <Box sx={{ position: 'relative', width: 220, height: 250 }}>
                 <Box sx={{ position: 'absolute', bottom: '10%', left: '10%', width: '80%', height: '60%', background: 'radial-gradient(circle, rgba(26,54,93,0.25) 0%, rgba(26,54,93,0.1) 40%, rgba(16,45,74,0) 70%)', zIndex: 0 }} />
                 <Box sx={{ position: 'absolute', bottom: 0, left: '5%', width: '90%', height: '180px', background: 'linear-gradient(135deg, rgba(26,54,93,0.2) 0%, rgba(16,45,74,0.15) 100%)', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', zIndex: 1 }} />
                 <img src={selectedMember.image} alt={selectedMember.name} style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 2, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)' }} />
              </Box>
            </Box>
            <DialogContent sx={{ p: { xs: 3, md: 5 }, pt: { xs: 3, md: 4 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, letterSpacing: '-0.5px' }}>
                {selectedMember.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, mb: 3, display: 'inline-block', bgcolor: 'rgba(26, 54, 93, 0.08)', px: 2, py: 0.5, borderRadius: 999 }}>
                {selectedMember.title}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.85, fontSize: '1.05rem' }}>
                {selectedMember.description}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}


