import { Link as RouterLink } from 'react-router-dom'
import { Box, Container, Link, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import BrandLogo from './BrandLogo'
import AppInstallButtons from './AppInstallButtons'

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const links = [
    { path: '/', label: t('common.home') },
    { path: '/about-us', label: t('common.aboutUs') },
    { path: '/achievements', label: t('common.achievements') },
    { path: '/news', label: t('common.ourNews') },
    { path: '/community', label: t('common.community') },
    { path: '/contact', label: t('common.contact') },
    { path: '/search', label: t('common.search') },
  ]

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        py: { xs: 2, md: 2},
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <RouterLink to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <BrandLogo variant="footer" />
          </RouterLink>

          <Box sx={{ my: { xs: 3, sm: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {t('installBanner.downloadApp', 'Download Our App')}
            </Typography>
            <AppInstallButtons />
          </Box>

          <Box
            component="nav"
            aria-label={t('footer.nav')}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1.5, sm: 2 },
              justifyContent: 'center',
            }}
          >
            {links.map((item) => (
              <Link
                key={item.path}
                component={RouterLink}
                to={item.path}
                underline="hover"
                color="text.secondary"
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                {item.label}
              </Link>
            ))}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ mb: 0.5 }}
          >
            {t('footer.copyright', { year })}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ fontSize: '0.7rem', opacity: 0.8, mb: 0 }}
          >
            {t('footer.developedBy', 'Developed with love by')}{' '}
            <Link
              href="https://cloudastick.com"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Cloudastick
            </Link>{' '}
            - Salesforce Partner
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
