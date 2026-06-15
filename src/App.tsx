import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useAppStore } from './lib/store'
import { useFeatureSwitchStore } from './lib/store/feature-switch-store'
import { getCurrentUser } from './lib/api-client'
import { getFeatureSwitchesOnLoad } from './lib/featureSwitches'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import UnitDetails from './pages/UnitDetails'
import ProjectDetails from './pages/ProjectDetails'
import Login from './pages/Login'
import Community from './pages/Community'
import Contact from './pages/Contact'
import CommercialRental from './pages/CommercialRental'
import Offline from './pages/Offline'
import ComingSoon from './pages/ComingSoon'
import AboutUs from './pages/AboutUs'
import Achievements from './pages/Achievements'
import LatestReleases from './pages/LatestReleases'
import News from './pages/News'
import NewsArticle from './pages/NewsArticle'
import CollaborationComingSoon from './pages/CollaborationComingSoon'
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
        const res = await getCurrentUser()
        if (!mounted) return
        if (res.success && res.data) {
          setAuth(res.data, null)
        } else {
          // Keep the cached auth session from localStorage intact!
          // This keeps the user logged in until they explicitly click log out, even on flaky networks or offline states.
          console.log('[Auth] Keep using cached session from localStorage.')
        }
      } catch {
        // Keep the cached session on network errors
        console.log('[Auth] Network error, maintaining cached session.')
      }

      try {
        const featureRes = await getFeatureSwitchesOnLoad();
        if (!mounted) return;
        if (featureRes?.payload?.data?.values) {
          setFeatures(featureRes.payload.data.values, featureRes.payload.data.fields || []);
        }
      } catch (err) {
        console.error('[Feature Switches] Failed to load feature switches', err);
        if (mounted) {
          setFeatures({}, []); // Ensure app loads even if feature switches fail
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    hydrate()
    return () => {
      mounted = false
    }
  }, [setAuth, setLoading])

  if (!isReady) {
    return null; // Or a loading spinner
  }

  return (
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
  )
}

export default App;
