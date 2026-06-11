import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction, Paper, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Home, Search, Users, Building2, MoreHorizontal, Trophy, MessageSquare, Phone, Newspaper } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { COMPANY_PHONE_TEL, COMPANY_WHATSAPP_URL } from '../../lib/contact'
import { useSiteContent } from '../../contexts/SiteContentContext'

export default function BottomNav() {
  const { t } = useTranslation()
  const { navLabel } = useSiteContent()
  const location = useLocation()
  const currentPath = location.pathname

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpenMore = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMore = () => {
    setAnchorEl(null)
  }

  const visibleItems = [
    { path: '/', label: navLabel('home', t('common.home')), icon: Home },
    { path: '/search', label: navLabel('search', t('common.search')), icon: Search },
    { path: '/achievements', label: navLabel('achievements', t('common.achievements')), icon: Trophy },
  ]

  const moreItems = [
    { path: '/news', label: navLabel('ourNews', t('common.ourNews')), icon: Newspaper },
    { path: '/community', label: navLabel('community', t('common.community')), icon: Building2 },
    { path: '/about-us', label: navLabel('aboutUs', t('common.aboutUs')), icon: Users },
    { path: '/contact', label: navLabel('contact', t('common.contact')), icon: MessageSquare },
  ]

  const isMoreActive = moreItems.some(item => item.path === currentPath)

  return (
    <Paper
      sx={(theme) => ({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: { xs: 'block', md: 'none' },
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.05)',
      })}
      elevation={0}
      className="safe-bottom"
    >
      <BottomNavigation
        value={isMoreActive ? 'more' : currentPath}
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 0,
            padding: '6px 0',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <BottomNavigationAction
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              icon={<Icon size={20} />}
              value={item.path}
            />
          )
        })}
        
        <BottomNavigationAction
          label={navLabel('more', t('common.more'))}
          icon={<MoreHorizontal size={20} />}
          value="more"
          onClick={handleOpenMore}
        />
      </BottomNavigation>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMore}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: (theme) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            minWidth: '200px',
            mb: 1,
            '& .MuiMenuItem-root': {
              py: 1.5,
              '&.active': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              },
            },
          }),
        }}
      >
        <MenuItem
          component="a"
          href={COMPANY_PHONE_TEL}
          onClick={handleCloseMore}
        >
          <ListItemIcon sx={{ color: 'primary.main' }}>
            <Phone size={20} />
          </ListItemIcon>
          <ListItemText
            primary={navLabel('call', t('common.call', 'Call'))}
            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
          />
        </MenuItem>
        <MenuItem
          component="a"
          href={COMPANY_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCloseMore}
        >
          <ListItemIcon sx={{ color: '#25D366' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.55 2 2.08 6.47 2.08 11.96c0 1.77.46 3.5 1.33 5.02L2 22l5.15-1.35a9.9 9.9 0 0 0 4.89 1.25h.01c5.49 0 9.96-4.47 9.96-9.96C22.01 6.47 17.54 2 12.04 2Zm0 17.99h-.01a8.3 8.3 0 0 1-4.22-1.16l-.3-.18-3.06.8.82-2.98-.2-.31a8.26 8.26 0 0 1-1.26-4.4c0-4.58 3.73-8.3 8.31-8.3 4.58 0 8.31 3.72 8.31 8.3 0 4.58-3.73 8.3-8.39 8.3Zm4.82-6.2c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.52-1.42-1.78-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.79-1.9-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.68.13.17 1.81 2.76 4.38 3.87.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.75-1.22.22-.6.22-1.12.15-1.22-.06-.1-.23-.16-.49-.29Z" />
            </svg>
          </ListItemIcon>
          <ListItemText
            primary={t('share.whatsapp', 'WhatsApp')}
            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
          />
        </MenuItem>
        {moreItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          return (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleCloseMore}
              selected={isActive}
              className={isActive ? 'active' : ''}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.95rem'
                }} 
              />
            </MenuItem>
          )
        })}
      </Menu>
    </Paper>
  )
}


