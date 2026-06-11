import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Box, Button, IconButton, Menu, MenuItem } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { LogOut, MessageSquare, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../lib/store'
import { logout } from '../../lib/api-client'
import BrandLogo from './BrandLogo'
import NavContactActions from './NavContactActions'
import ContactUsFormModal from './ContactUsFormModal'

/** True when this nav item should show as the current page (nested routes included; home is exact). */
function isNavPathActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') return pathname === '/'
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null)

  const mainNavItems = [
    { path: '/', label: t('common.home') },
    { path: '/about-us', label: t('common.aboutUs') },
    { path: '/achievements', label: t('common.achievements') },
    { path: '/commercial-rental', label: t('common.commercial') },
    { path: '/news', label: t('common.ourNews') },
  ]

  const moreNavItems = [
    { path: '/latest-releases', label: t('common.latestReleases', 'Latest Releases') },
    { path: '/community', label: t('common.community') },
    { path: '/contact', label: t('common.support', 'Support') },
  ]

  const canShowBack = location.pathname !== '/'
  const onBack = () => {
    // If the user landed directly (no prior in-app history), fallback to home.
    if (window.history.length <= 1) {
      navigate('/')
      return
    }
    navigate(-1)
  }

  return (
    <AppBar
      position="absolute"
      elevation={0}
      sx={(theme) => ({
        backgroundColor: location.pathname === '/' ? 'transparent' : alpha(theme.palette.background.paper, 0.6),
        backdropFilter: location.pathname === '/' ? 'none' : 'blur(16px)',
        color: 'text.primary',
        borderBottom: location.pathname === '/' ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: 'none',
        pt: 2,
      })}
      className="safe-top"
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: 2, md: 4, lg: 6 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <BrandLogo variant="header" />
          </Link>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: { md: 2, lg: 4 }, alignItems: 'center', justifyContent: 'center', flexGrow: 1, mx: { md: 2, lg: 4 } }}>
          {mainNavItems.map((item) => {
            const active = isNavPathActive(location.pathname, item.path)
            return (
              <Box
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  position: 'relative',
                  '&:after': active ? {
                    content: '""',
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    width: '100%',
                    height: 2,
                    bgcolor: 'primary.main',
                  } : {},
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                {item.label}
              </Box>
            )
          })}

          <Box
            onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              '&:hover': { opacity: 0.8 },
            }}
          >
            {t('common.more', 'More')} <ChevronDown size={16} />
          </Box>
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={() => setMoreMenuAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 150,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            {moreNavItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => setMoreMenuAnchor(null)}
                sx={{
                  color: 'primary.main',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  py: 1.5,
                  ...(isNavPathActive(location.pathname, item.path) && {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    fontWeight: 700,
                  })
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setContactFormOpen(true)}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <MessageSquare size={16} />
            <Box component="span" sx={{ mt: 0.2 }}>{t('common.contact')}</Box>
          </Button>
          <IconButton
            onClick={() => setContactFormOpen(true)}
            aria-label={t('common.contact')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              color: 'primary.main',
            }}
          >
            <MessageSquare size={20} />
          </IconButton>
          <Box sx={{ display: { xs: 'flex', lg: 'none' } }}>
            <NavContactActions compact />
          </Box>
          <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
            <NavContactActions />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => i18n.changeLanguage(isRtl ? 'en' : 'ar')}>
            <Box component="span" sx={{ textDecoration: isRtl ? 'underline' : 'none' }}>AR</Box>
            <span>/</span>
            <Box component="span" sx={{ textDecoration: !isRtl ? 'underline' : 'none' }}>EN</Box>
          </Box>
          {user && (
            <IconButton
              onClick={async () => {
                try {
                  await logout()
                } finally {
                  clearAuth()
                }
              }}
              size="small"
              title={t('common.logout')}
              sx={{ color: 'primary.main' }}
            >
              <LogOut size={18} />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      <ContactUsFormModal open={contactFormOpen} onClose={() => setContactFormOpen(false)} />
    </AppBar>
  )
}

