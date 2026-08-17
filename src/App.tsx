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
const CommercialRental = lazy(() => import('./pages/CommercialRental'))
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
  const { setFeatures, getFeature, isReady } = useFeatureSwitchStore()

  useEffect(() => {
    let mounted = true
    async function hydrate() {
      setLoading(true)
      
      try {
        // Run auth and feature switches fetches in parallel to cut load time in half
        const [authResult, featureResult] = await Promise.allSettled([
          getCurrentUser(),
          getFeatureSwitchesOnLoad()
        ]);

        if (!mounted) return;

        // Handle Auth
        if (authResult.status === 'fulfilled') {
          const res = authResult.value;
          if (res.success && res.data) {
            setAuth(res.data, null)
          } else {
            console.log('[Auth] Keep using cached session from localStorage.')
          }
        } else {
          console.log('[Auth] Network error, maintaining cached session.')
        }

        // Handle Feature Switches
        if (featureResult.status === 'fulfilled') {
          const featureRes = featureResult.value;
          if (featureRes?.payload?.data?.values) {
            setFeatures(featureRes.payload.data.values, featureRes.payload.data.fields || []);
          } else {
            setFeatures({}, []);
          }
        } else {
          console.error('[Feature Switches] Failed to load feature switches', featureResult.reason);
          setFeatures({}, []); // Ensure app loads even if feature switches fail
        }

      } catch (err) {
        console.error('[Hydration Error] Unexpected error during hydration', err);
        if (mounted) setFeatures({}, []);
      } finally {
        if (mounted) setLoading(false)
      }
    }
    hydrate()
    return () => {
      mounted = false
    }
  }, [setAuth, setLoading, setFeatures])

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

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
              <Route path="commercial-rental" element={<CommercialRental />} />
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
