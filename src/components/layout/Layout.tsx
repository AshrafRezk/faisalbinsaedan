import { Outlet, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import Header from './Header'
import SiteContactBar from './SiteContactBar'
import Footer from './Footer'
import BottomNav from './BottomNav'
import InstallBanner from './InstallBanner'
import AnimatedBackground from './AnimatedBackground'
import SaraBot from '../chatbot/SaraBot'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isAboutUs = location.pathname === '/about-us'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!isAboutUs && <AnimatedBackground variant={isHome ? 'geometric' : 'blobs'} />}
      <Header />
      <Box
        component="main"
        className="main-content"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          pt: isHome ? 0 : 10,
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Outlet />
        </Box>
        <SiteContactBar />
        <Footer />
      </Box>
      <BottomNav />
      <InstallBanner />
      <SaraBot />
    </div>
  )
}

