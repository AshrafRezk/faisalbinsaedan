import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuthStore, useAppStore } from './lib/store'
import { useFeatureSwitchStore } from './lib/store/feature-switch-store'
import { getCurrentUser } from './lib/api-client'
import { getFeatureSwitchesOnLoad } from './lib/featureSwitches'
import Layout from './components/layout/Layout'

const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const UnitDetails = lazy(() => import('./pages/UnitDetails'))
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'))
const Login = lazy(() => import('./pages/Login'))
const Community = lazy(() => import('./pages/Community'))
const Contact = lazy(() => import('./pages/Contact'))
const Offline = lazy(() => import('./pages/Offline'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Achievements = lazy(() => import('./pages/Achievements'))
const LatestReleases = lazy(() => import('./pages/LatestReleases'))
const ResidentialProjects = lazy(() => import('./pages/ResidentialProjects'))
const News = lazy(() => import('./pages/News'))
const NewsArticle = lazy(() => import('./pages/NewsArticle'))
const CollaborationComingSoon = lazy(() => import('./pages/CollaborationComingSoon'))
import Toast from './components/ui/Toast'
import { SiteContentProvider } from './contexts/SiteContentContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { isMaintenanceAuthorized } = useAppStore()
  
  if (!isMaintenanceAuthorized) {
    return <ComingSoon />
  }
  
  return <>{children}</>
}

function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()
  const { setFeatures, getFeature } = useFeatureSwitchStore()

  useEffect(() => {
    let mounted = true

    async function refreshFeatureSwitches() {
      try {
        const featureRes = await getFeatureSwitchesOnLoad()
        if (!mounted) return
        if (featureRes?.payload?.data?.values) {
          setFeatures(featureRes.payload.data.values, featureRes.payload.data.fields || [])
        }
      } catch (err) {
        console.error('[Feature Switches] Failed to load feature switches', err)
      }
    }

    void refreshFeatureSwitches()
    return () => {
      mounted = false
    }
  }, [setFeatures])

  useEffect(() => {
    let mounted = true

    async function hydrateAuth() {
      setLoading(true)
      try {
        const res = await getCurrentUser()
        if (!mounted) return
        if (res.success && res.data) {
          setAuth(res.data, null)
        } else {
          clearAuth()
        }
      } catch {
        if (mounted) clearAuth()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void hydrateAuth()
    return () => {
      mounted = false
    }
  }, [setAuth, clearAuth, setLoading])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      useAppStore.getState().setInstallPrompt(e as any);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <MaintenanceGate>
        <SiteContentProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {getFeature('Show_Home_Page__c', true) && <Route index element={<Home />} />}
              <Route path="search" element={<Search />} />
              <Route path="project/:id" element={<ProjectDetails />} />
              <Route path="unit/:id" element={<UnitDetails />} />
              {getFeature('Show_Support_Page__c', true) && <Route path="contact" element={<Contact />} />}
              <Route path="commercial-rental" element={<Navigate to="/latest-releases" replace />} />
              <Route path="residential-projects" element={<ResidentialProjects />} />
              {getFeature('Show_About_Us_Page__c', true) && <Route path="about-us" element={<AboutUs />} />}
              {getFeature('Show_Our_Achievements_Page__c', true) && <Route path="achievements" element={<Achievements />} />}
              {getFeature('Show_Latest_Releases_Page__c', true) && <Route path="latest-releases" element={<LatestReleases />} />}
              {getFeature('Show_Our_News_Page__c', true) && (
                <>
                  <Route path="news" element={<News />} />
                  <Route path="news/:id" element={<NewsArticle />} />
                  <Route path="our-news" element={<Navigate to="/news" replace />} />
                </>
              )}
              <Route path="collaboration-coming-soon" element={<CollaborationComingSoon />} />
              {getFeature('Show_My_Community_Page__c', true) && (
                <Route
                  path="community"
                  element={
                    <ProtectedRoute>
                      <Community />
                    </ProtectedRoute>
                  }
                />
              )}
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toast />
        </SiteContentProvider>
      </MaintenanceGate>
    </Suspense>
  )
}

export default App;
