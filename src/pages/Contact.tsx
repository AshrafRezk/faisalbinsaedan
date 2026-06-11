import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock, Instagram, Linkedin } from 'lucide-react'
import { getOfficeMapUrl } from '../lib/api-client'
import LeadInterestForm from '../components/home/LeadInterestForm'
import { useSiteContent } from '../contexts/SiteContentContext'

// Custom X (Twitter) icon component
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

// Custom TikTok icon component
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.04 2C6.55 2 2.08 6.47 2.08 11.96c0 1.77.46 3.5 1.33 5.02L2 22l5.15-1.35a9.9 9.9 0 0 0 4.89 1.25h.01c5.49 0 9.96-4.47 9.96-9.96C22.01 6.47 17.54 2 12.04 2Zm0 17.99h-.01a8.3 8.3 0 0 1-4.22-1.16l-.3-.18-3.06.8.82-2.98-.2-.31a8.26 8.26 0 0 1-1.26-4.4c0-4.58 3.73-8.3 8.31-8.3 4.58 0 8.31 3.72 8.31 8.3 0 4.58-3.73 8.3-8.39 8.3Zm4.82-6.2c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.52-1.42-1.78-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.79-1.9-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.68.13.17 1.81 2.76 4.38 3.87.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.75-1.22.22-.6.22-1.12.15-1.22-.06-.1-.23-.16-.49-.29Z" />
  </svg>
)

const SnapchatIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
  </svg>
)

interface OfficeLocation {
  project: string
  projectEn: string
  url: string
  coords: string
  dirUrl: string
  isHq?: boolean
}

const salesOffices: OfficeLocation[] = [
  {
    project: 'الموقع الرئيسي (الإدارة العامة)',
    projectEn: 'Headquarters (HQ Office)',
    url: 'https://www.google.com/maps/place/FBS/@24.767214,46.7086031,132m/data=!3m1!1e3!4m14!1m7!3m6!1s0x3e2efd556f038b85:0x3a43523caa30801e!2sFBS!8m2!3d24.7673186!4d46.7086468!16s%2Fg%2F11ygn5c_z0!3m5!1s0x3e2efd556f038b85:0x3a43523caa30801e!8m2!3d24.7673186!4d46.7086468!16s%2Fg%2F11ygn5c_z0?hl=en-US&entry=ttu',
    coords: '24.76734267323662,46.70865492367602',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=24.76734267323662,46.70865492367602',
    isHq: true,
  },
  {
    project: 'نزل خيالا - جدة',
    projectEn: 'Nazal Khayala - Jeddah',
    url: 'https://maps.app.goo.gl/iWaAkHtoVkWqRmcn8',
    coords: '21.6488125,39.1125625',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=21.6488125,39.1125625'
  },
  {
    project: 'ملفى الحوية',
    projectEn: 'Malfa Al Hawiah',
    url: 'https://maps.app.goo.gl/9Fv2dzxvouxztJNr5',
    coords: '21.2790496,40.4447283',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=21.2790496,40.4447283'
  },
  {
    project: 'ملفى جدة',
    projectEn: 'Malfa Jeddah',
    url: 'https://maps.app.goo.gl/Wbh3rDku8vm2tF1r8',
    coords: '21.3508125,39.2610625',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=21.3508125,39.2610625'
  },
  {
    project: 'ملفى تبوك هيلز',
    projectEn: 'Malfa Tabuk Hills',
    url: 'https://maps.app.goo.gl/FPhqhKgWYDAQBZnr9',
    coords: '28.4606462,36.5198903',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=28.4606462,36.5198903'
  },
  {
    project: 'ملفى الاصالة',
    projectEn: 'Malfa Al Asalah',
    url: 'https://maps.app.goo.gl/crzBe21cvioUXecx7',
    coords: '24.4844205,46.7192966',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=24.4844205,46.7192966'
  },
  {
    project: 'ملفى المكيمن 1',
    projectEn: 'Malfa Al Mukeemen 1',
    url: 'https://maps.app.goo.gl/wVZVVm7PxxDvxrgD8',
    coords: '24.4568125,39.5465625',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=24.4568125,39.5465625'
  },
  {
    project: 'ملفى المكيمن 2',
    projectEn: 'Malfa Al Mukeemen 2',
    url: 'https://maps.app.goo.gl/2tBKQmzahU8ehRaa7',
    coords: '24.4662446,39.6652025',
    dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=24.4662446,39.6652025'
  },
]

export default function Contact() {
  const { t, i18n } = useTranslation()
  const { pageCopy } = useSiteContent()
  const contactHero = pageCopy('contact')
  const isRtl = i18n.language.startsWith('ar')
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [mapMetaKeywords, setMapMetaKeywords] = useState<string | undefined>(undefined)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [activeLocation, setActiveLocation] = useState<OfficeLocation>(salesOffices[0])

  const getEmbedUrl = () => {
    return `https://maps.google.com/maps?q=${activeLocation.coords}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  useEffect(() => {
    const fetchMapUrl = async () => {
      setIsLoadingMap(true)
      try {
        const result = await getOfficeMapUrl()
        setMapUrl(result.mapUrl)
        setMapMetaKeywords(result.metaKeywords)
      } catch (error) {
        console.error('Failed to fetch office map URL:', error)
      } finally {
        setIsLoadingMap(false)
      }
    }
    fetchMapUrl()
  }, [])

  useEffect(() => {
    const handleHashScroll = () => {
      if (window.location.hash === '#locations') {
        setTimeout(() => {
          const element = document.getElementById('locations')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      }
    }
    handleHashScroll()
    window.addEventListener('hashchange', handleHashScroll)
    return () => window.removeEventListener('hashchange', handleHashScroll)
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      {/* Header */}
      <Box sx={(theme) => ({ bgcolor: alpha(theme.palette.primary.main, 0.8), backdropFilter: 'blur(20px)', color: 'white', px: { xs: 2, md: 3 }, py: 6, textAlign: 'center' })}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {contactHero.title}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: '42rem', mx: 'auto' }}>
              {contactHero.subtitle}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Message form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                sx={(theme) => ({
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                })}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="semibold" gutterBottom>
                    {t('contact.formTitle')}
                  </Typography>
                  <LeadInterestForm mode="inline" active />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Contact Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="semibold" gutterBottom>
                  {t('contact.contactInfo')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    {
                      icon: Phone,
                      label: t('contact.phoneLabel'),
                      value: '920024010',
                      href: 'tel:+966920024010',
                    },
                    {
                      icon: Mail,
                      label: t('contact.emailLabel'),
                      value: 'customer.care@faisal-binsaedan.com / info@faisal-binsaedan.com',
                      href: 'mailto:customer.care@faisal-binsaedan.com',
                    },
                    {
                      icon: MapPin,
                      label: t('contact.addressLabel'),
                      value: t('contact.address'),
                    },
                    {
                      icon: Clock,
                      label: t('contact.workingHours'),
                      value: t('contact.workingHoursValue'),
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const content = (
                      <Card
                        sx={(theme) => ({
                          backgroundColor: alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(16px)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                        })}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={20} color="white" />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {item.label}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {item.value}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )

                    return item.href ? (
                      <Box
                        key={item.label}
                        component="a"
                        href={item.href}
                        sx={{ textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
                      >
                        {content}
                      </Box>
                    ) : (
                      <Box key={item.label}>{content}</Box>
                    )
                  })}
                </Box>
              </Box>

              {/* Social Links */}
              <Box>
                <Typography variant="h6" fontWeight="semibold" gutterBottom>
                  {t('contact.followUs')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    {
                      icon: Instagram,
                      href: 'https://www.instagram.com/faisalsaedanco',
                      label: t('share.instagram'),
                      color: '#E4405F'
                    },
                    {
                      icon: XIcon,
                      href: 'https://x.com/faisalsaedanco',
                      label: t('share.twitter'),
                      color: '#000000'
                    },
                    {
                      icon: Linkedin,
                      href: 'https://www.linkedin.com/company/faisal-binsaedan',
                      label: t('share.linkedin'),
                      color: '#0077B5'
                    },
                    {
                      icon: WhatsAppIcon,
                      href: 'https://wa.me/966920024010',
                      label: t('share.whatsapp'),
                      color: '#25D366'
                    },
                    {
                      icon: SnapchatIcon,
                      href: 'https://www.snapchat.com/@binsaedanco',
                      label: t('share.snapchat'),
                      color: '#FFFC00'
                    },
                    {
                      icon: TikTokIcon,
                      href: 'https://www.tiktok.com/@faisalbinsaedan.c',
                      label: t('share.tiktok'),
                      color: '#000000'
                    },
                  ].map((social) => {
                    const Icon = social.icon
                    return (
                      <IconButton
                        key={social.label}
                        component="a"
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: social.color || 'primary.main',
                            '& svg': {
                              color: social.color || 'primary.main',
                            }
                          },
                        }}
                        aria-label={social.label}
                        title={social.label}
                      >
                        <Icon size={20} />
                      </IconButton>
                    )
                  })}
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* HQ Map & Sales Offices Locations Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Box id="locations" sx={{ mt: 6 }}>
            <Grid container spacing={4}>
              {/* HQ Map Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={(theme) => ({
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                  })}
                >
                  <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {isRtl ? activeLocation.project : activeLocation.projectEn}
                      </Typography>
                      {activeLocation.isHq && (
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block', mt: 0.5 }}>
                          {isRtl ? 'الإدارة العامة' : 'General Administration'}
                        </Typography>
                      )}
                    </Box>
                    <MapPin size={20} color="#1a365d" />
                  </Box>
                  <Box sx={{ flexGrow: 1, minHeight: 400, position: 'relative', bgcolor: 'grey.50' }}>
                    {isLoadingMap && activeLocation.isHq ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <MapPin size={32} color="#718096" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <Typography variant="caption" color="text.secondary">
                            {isRtl ? 'جاري التحميل...' : 'Loading...'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <iframe
                        src={getEmbedUrl()}
                        width="100%"
                        height="100%"
                        style={{ border: 0, display: 'block', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={mapMetaKeywords || t('contact.mapTitle')}
                      />
                    )}
                  </Box>
                  <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center', bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Box
                      component="a"
                      href={activeLocation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        '&:hover': {
                          textDecoration: 'underline',
                          opacity: 0.8
                        }
                      }}
                    >
                      <MapPin size={16} />
                      <span>{isRtl ? 'فتح في خرائط جوجل للحصول على الاتجاهات ←' : 'Open in Google Maps for directions ←'}</span>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Sales Offices Location Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={(theme) => ({
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                    height: '100%',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  })}
                >
                  <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {isRtl ? 'مواقع فروع ومكاتب المبيعات' : 'Office & Sales Branch Locations'}
                    </Typography>
                    <MapPin size={20} color="#1a365d" />
                  </Box>
                  <Box sx={{ flexGrow: 1, maxHeight: 440, overflowY: 'auto' }}>
                    {salesOffices.map((office, idx) => {
                      const isActive = activeLocation.coords === office.coords
                      return (
                        <Box
                          key={idx}
                          onClick={() => {
                            setActiveLocation(office)
                          }}
                          sx={(theme) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 3,
                            py: 2.2,
                            borderBottom: idx === salesOffices.length - 1 ? 0 : 1,
                            borderColor: 'divider',
                            cursor: 'pointer',
                            color: 'text.primary',
                            borderRight: isRtl && isActive ? '4px solid' : 'none',
                            borderLeft: !isRtl && isActive ? '4px solid' : 'none',
                            borderRightColor: 'primary.main',
                            borderLeftColor: 'primary.main',
                            bgcolor: isActive
                              ? alpha(theme.palette.primary.main, 0.08)
                              : idx % 2 === 0
                              ? 'transparent'
                              : 'rgba(0,0,0,0.01)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: isActive
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.primary.main, 0.06),
                              '& .project-name': {
                                color: 'primary.main',
                                transform: isRtl ? 'translateX(-4px)' : 'translateX(4px)',
                              },
                            },
                          })}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography
                              className="project-name"
                              fontWeight={isActive ? 700 : 600}
                              sx={{
                                fontSize: '0.95rem',
                                color: isActive ? 'primary.main' : 'text.primary',
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              {isRtl ? office.project : office.projectEn}
                            </Typography>
                            {office.isHq && (
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {isRtl ? 'المقر الرئيسي للمجموعة' : 'Company Headquarters'}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            component="a"
                            href={office.dirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: isActive ? 'primary.main' : 'text.secondary',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              textDecoration: 'none',
                              border: '1px solid',
                              borderColor: isActive ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              px: 1.5,
                              py: 0.6,
                              bgcolor: isActive ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <span>
                              {isRtl ? 'الاتجاهات ←' : 'Directions ←'}
                            </span>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

