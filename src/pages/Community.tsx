import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Grid,
  Avatar,
  Paper,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Building2, Plus, FileText, LayoutDashboard, MessageSquare, FileSignature, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import DashboardUnitCard from '../components/community/DashboardUnitCard'
import CaseForm from '../components/community/CaseForm'
import CaseList from '../components/community/CaseList'
import ContractList from '../components/community/ContractList'
import InstallmentList from '../components/community/InstallmentList'
import { useAuthStore } from '../lib/store'
import { getMyOpportunities, getCases, type MyOpportunity } from '../lib/api-client'
import { Unit, Case } from '../lib/types'

type CommunityTab = 'units' | 'contracts' | 'installments' | 'cases'

export default function Community() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'
  const { user, clearAuth } = useAuthStore()
  const [units, setUnits] = useState<Unit[]>([])
  const [opportunities, setOpportunities] = useState<MyOpportunity[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CommunityTab>('units')
  const [isCaseFormOpen, setIsCaseFormOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    async function loadData() {
      setIsLoading(true)
      try {
        const [oppRes, casesRes] = await Promise.all([getMyOpportunities(), getCases()])

        if (oppRes.status === 401 || casesRes.status === 401) {
          clearAuth()
          navigate('/login', { replace: true })
          return
        }

        if (oppRes.success && oppRes.data) {
          setOpportunities(oppRes.data)
          setUnits(oppRes.data.flatMap((o) => o.units || []))
        }
        if (casesRes.success && casesRes.data) {
          setCases(casesRes.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, navigate, clearAuth])

  const refreshCases = async () => {
    const casesRes = await getCases()
    if (casesRes.success && casesRes.data) {
      setCases(casesRes.data)
    }
  }

  const installmentCount = useMemo(
    () => opportunities.reduce((sum, opp) => sum + (opp.installments?.length || 0), 0),
    [opportunities]
  )

  if (!user) return null

  const activeCasesCount = cases.filter((c) => c.status === 'New' || c.status === 'InProgress').length

  const tabSx = {
    minWidth: { xs: 110, sm: 140 },
    borderRadius: 2.5,
    fontWeight: 'bold',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    '&.Mui-selected': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      <Box
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, 0.8),
          backdropFilter: 'blur(20px)',
          color: 'white',
          pt: 6,
          pb: 12,
          position: 'relative',
          overflow: 'hidden',
        })}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            [isRtl ? 'left' : 'right']: -20,
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        >
          <Building2 size={300} />
        </Box>

        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  mb: 2,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                <LayoutDashboard size={40} />
              </Avatar>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                {t('community.welcome')}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                {t('community.welcomeMessage')}
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -6, mb: 6, position: 'relative', zIndex: 10 }}>
        <Grid container spacing={2}>
          {[
            { icon: Building2, value: units.length, label: t('community.unitsCount') },
            { icon: FileSignature, value: opportunities.length, label: t('community.contractsCount') },
            { icon: Wallet, value: installmentCount, label: t('community.installmentsCount') },
            { icon: FileText, value: cases.length, label: t('community.casesCount') },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  height: '100%',
                }}
              >
                <stat.icon size={28} color="#1a365d" style={{ margin: '0 auto 10px' }} />
                <Typography variant="h4" fontWeight="800" color="primary.main">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 0.5,
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.03)',
              display: 'inline-flex',
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v: CommunityTab) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTabs-indicator': { display: 'none' } }}
            >
              <Tab value="units" label={t('community.myUnits')} sx={tabSx} />
              <Tab value="contracts" label={t('community.myContracts')} sx={tabSx} />
              <Tab value="installments" label={t('community.myInstallments')} sx={tabSx} />
              <Tab
                value="cases"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t('community.myCases')}
                    {activeCasesCount > 0 && (
                      <Badge
                        badgeContent={activeCasesCount}
                        color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                      />
                    )}
                  </Box>
                }
                sx={tabSx}
              />
            </Tabs>
          </Paper>
        </Box>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={40} thickness={4} />
              </Box>
            </motion.div>
          ) : activeTab === 'units' ? (
            <motion.div
              key="units"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {opportunities.length === 0 ? (
                <Paper
                  sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'transparent',
                    border: '2px dashed',
                    borderColor: 'divider',
                  }}
                  elevation={0}
                >
                  <Building2 size={64} color="#CBD5E1" style={{ margin: '0 auto 20px' }} />
                  <Typography variant="h6" fontWeight="bold">
                    {t('community.noUnits')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    {t('community.noUnitsDescription')}
                  </Typography>
                  <Button component={Link} to="/demo/search" variant="contained" size="large">
                    {t('community.exploreUnits')}
                  </Button>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {opportunities.map((opp) => (
                    <Box key={opp.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'white',
                          border: '1px solid',
                          borderColor: 'divider',
                          mb: 2,
                        }}
                      >
                        <Typography fontWeight={800} color="primary.main">
                          {opp.name || t('community.myUnits')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(opp.stageName || '').trim()}
                          {opp.contractStatus ? ` · ${opp.contractStatus}` : ''}
                        </Typography>
                      </Paper>

                      <Grid container spacing={4}>
                        {(opp.units || []).map((unit) => (
                          <Grid size={{ xs: 12, md: 6 }} key={unit.id}>
                            <DashboardUnitCard unit={unit} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </motion.div>
          ) : activeTab === 'contracts' ? (
            <motion.div
              key="contracts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ContractList contracts={opportunities} />
            </motion.div>
          ) : activeTab === 'installments' ? (
            <motion.div
              key="installments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <InstallmentList contracts={opportunities} />
            </motion.div>
          ) : (
            <motion.div
              key="cases"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setIsCaseFormOpen(true)}
                  startIcon={<Plus size={18} />}
                  sx={{
                    bgcolor: 'primary.main',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(26, 54, 93, 0.25)',
                  }}
                >
                  {t('community.newRequest')}
                </Button>
              </Box>

              {cases.length === 0 ? (
                <Paper
                  sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  elevation={0}
                >
                  <MessageSquare size={64} color="#CBD5E1" style={{ margin: '0 auto 20px' }} />
                  <Typography variant="h6" fontWeight="bold">
                    {t('community.noRequests')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('community.noRequestsDescription')}
                  </Typography>
                </Paper>
              ) : (
                <CaseList cases={cases} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      <CaseForm
        isOpen={isCaseFormOpen}
        onClose={() => setIsCaseFormOpen(false)}
        units={units}
        onSuccess={refreshCases}
      />
    </Box>
  )
}
