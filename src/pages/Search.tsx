import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import { Badge } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { LayoutGrid, List, Map as MapIcon, SlidersHorizontal, Search as SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import UnitCard from '../components/search/UnitCard'
import FilterDrawer from '../components/search/FilterDrawer'
import DesktopFilters from '../components/search/DesktopFilters'
import SearchAutocomplete from '../components/search/SearchAutocomplete'
import { useAppStore } from '../lib/store'
import { getProjects, searchUnits } from '../lib/api-client'
import { Project, Unit } from '../lib/types'
import ProjectsMap from '../components/home/ProjectsMap'

const PROJECTS_PAGE_SIZE = 4

export default function Search() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isAr = i18n.language.startsWith('ar')
  const { filters, setFilters, setFilterDrawerOpen } = useAppStore()
  const [units, setUnits] = useState<Unit[]>([])
  const [pagination, setPagination] = useState<{ hasNextPage: boolean; hasPreviousPage: boolean } | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'projects'>('grid')
  const [projects, setProjects] = useState<Project[]>([])
  const [mapProjects, setMapProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projectsTotalCount, setProjectsTotalCount] = useState(0)
  const [projectsPagination, setProjectsPagination] = useState<{
    hasNextPage: boolean
    hasPreviousPage: boolean
  } | null>(null)
  const projectTypeFilter = searchParams.get('projectType') || undefined
  const usageTypeFilter =
    searchParams.get('usageType') ||
    searchParams.get('projectType') ||
    undefined
  const projectsPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const prevUsageTypeRef = useRef(usageTypeFilter)

  // Set initial filter and view from URL params
  useEffect(() => {
    const projectId = searchParams.get('projectId')
    const usageType = searchParams.get('usageType') || searchParams.get('projectType')
    const view = searchParams.get('view')
    if (view === 'projects') {
      setViewMode('projects')
    }
    if (projectId || usageType) {
      setFilters((prev) => ({
        ...prev,
        ...(projectId ? { projectId } : {}),
        ...(usageType ? { usageType, projectType: undefined } : {}),
        page: 1,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (prevUsageTypeRef.current === usageTypeFilter) return
    prevUsageTypeRef.current = usageTypeFilter
    if (!searchParams.get('page')) return
    const params = new URLSearchParams(searchParams)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }, [usageTypeFilter, searchParams, setSearchParams])

  // Fetch units when filters change (filtering happens on backend)
  useEffect(() => {
    async function loadUnits() {
      setIsLoading(true)
      try {
        const response = await searchUnits({ ...filters, page: filters.page || 1, pageSize: filters.pageSize || 12 })
        if (response.success && response.data) {
          setUnits(response.data)
          setTotalCount(response.totalCount ?? response.data.length)
          setPagination({
            hasNextPage: !!response.pagination?.hasNextPage,
            hasPreviousPage: !!response.pagination?.hasPreviousPage,
          })
        } else {
          setTotalCount(0)
        }
      } catch (error) {
        console.error('Error loading units:', error)
        setTotalCount(0)
      } finally {
        setIsLoading(false)
      }
    }
    loadUnits()
  }, [filters])

  useEffect(() => {
    async function loadProjects() {
      if (viewMode !== 'projects') return
      setIsLoadingProjects(true)
      try {
        const [listRes, mapRes] = await Promise.all([
          getProjects({
            projectType: projectTypeFilter,
            page: projectsPage,
            pageSize: PROJECTS_PAGE_SIZE,
          }),
          getProjects({
            projectType: projectTypeFilter,
            forMap: true,
          }),
        ])
        if (listRes.success && listRes.data) {
          setProjects(listRes.data)
          setProjectsTotalCount(listRes.totalCount ?? listRes.data.length)
          setProjectsPagination(
            listRes.pagination
              ? {
                  hasNextPage: listRes.pagination.hasNextPage,
                  hasPreviousPage: listRes.pagination.hasPreviousPage,
                }
              : {
                  hasNextPage: projectsPage * PROJECTS_PAGE_SIZE < (listRes.totalCount ?? listRes.data.length),
                  hasPreviousPage: projectsPage > 1,
                }
          )
        } else {
          setProjects([])
          setProjectsTotalCount(0)
          setProjectsPagination(null)
        }
        if (mapRes.success && mapRes.data) {
          setMapProjects(mapRes.data)
        } else {
          setMapProjects([])
        }
      } catch (e) {
        console.error('Error loading projects:', e)
        setProjects([])
        setMapProjects([])
        setProjectsTotalCount(0)
        setProjectsPagination(null)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    loadProjects()
  }, [viewMode, projectTypeFilter, projectsPage])

  const setProjectsPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== false &&
      key !== 'page' &&
      key !== 'pageSize'
  ).length

  const handleProjectClick = (projectId: string) => {
    if (filters.projectId === projectId) {
      navigate(`/project/${projectId}`)
    } else {
      setFilters({ ...filters, projectId, page: 1 })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      {/* Header */}
      <Paper
        sx={(theme) => ({
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(16px)',
        })}
        elevation={0}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="semibold">
                  {t('search.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewMode === 'projects'
                    ? isLoadingProjects
                      ? t('search.searching')
                      : t('search.projectsFound', { count: projectsTotalCount })
                    : isLoading
                      ? t('search.searching')
                      : t('search.unitsFound', { count: totalCount })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* View Toggle - Desktop */}
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                >
                  <ToggleButton value="grid">
                    <LayoutGrid size={16} />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <List size={16} />
                  </ToggleButton>
                  <ToggleButton value="projects">
                    <MapIcon size={16} />
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Filter Button - Mobile */}
                <Badge badgeContent={activeFiltersCount} color="primary">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFilterDrawerOpen(true)}
                    startIcon={<SlidersHorizontal size={16} />}
                    sx={{ display: { xs: 'flex', md: 'none' } }}
                  >
                    {t('search.filter')}
                  </Button>
                </Badge>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <SearchAutocomplete
                onSelect={(value) => {
                  // Handle search selection
                  console.log('Search selected:', value)
                }}
              />
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {viewMode === 'projects' ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              {isLoadingProjects ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : projects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" fontWeight="semibold" gutterBottom>
                    {t('home.latestProjects')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.noResults')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {projects.map((p) => {
                    const isSelected = filters.projectId === p.id
                    return (
                      <Card
                        key={p.id}
                        sx={(theme) => ({
                          cursor: 'pointer',
                          position: 'relative',
                          border: '2px solid',
                          borderColor: isSelected ? 'secondary.main' : 'transparent',
                          bgcolor: isSelected ? alpha(theme.palette.secondary.main, 0.04) : 'background.paper',
                          boxShadow: isSelected ? '0 8px 24px rgba(201, 162, 39, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isSelected ? '0 12px 28px rgba(201, 162, 39, 0.18)' : '0 4px 12px rgba(0,0,0,0.08)',
                          },
                        })}
                        onClick={() => handleProjectClick(p.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography fontWeight={700} color={isSelected ? 'secondary.main' : 'text.primary'}>
                            {p.nameAr || p.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {p.locationAr || p.location}
                          </Typography>
                          
                          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFilters({ ...filters, projectId: p.id, page: 1 })
                                setViewMode('grid')
                              }}
                              sx={(theme) => ({
                                borderColor: isSelected ? 'secondary.main' : 'divider',
                                color: isSelected ? 'secondary.main' : 'text.primary',
                                '&:hover': {
                                  borderColor: 'secondary.dark',
                                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                },
                              })}
                            >
                              {t('home.viewUnits')}
                            </Button>

                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isSelected ? 'secondary.main' : 'text.secondary',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            >
                              {isSelected ? (
                                isAr ? 'انقر مجدداً لعرض التفاصيل ←' : 'Click again to view details ←'
                              ) : (
                                isAr ? 'تحديد وزوم' : 'Select & Zoom'
                              )}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    )
                  })}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, pt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={isLoadingProjects || !projectsPagination?.hasPreviousPage}
                      onClick={() => setProjectsPage(projectsPage - 1)}
                    >
                      {t('search.previous')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={isLoadingProjects || !projectsPagination?.hasNextPage}
                      onClick={() => setProjectsPage(projectsPage + 1)}
                    >
                      {t('search.next')}
                    </Button>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ width: '100%', height: { xs: 360, sm: 480, md: 600 } }}>
                <ProjectsMap
                  projects={mapProjects}
                  highlightedProjectId={filters.projectId || null}
                  onProjectSelect={(id) => id && handleProjectClick(id)}
                />
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {/* Desktop Sidebar */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'sticky', top: 100 }}>
                <DesktopFilters />
              </Box>
            </Grid>

            {/* Units Grid */}
            <Grid size={{ xs: 12, md: 9 }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : units.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SearchIcon size={64} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                  <Typography variant="h6" fontWeight="semibold" gutterBottom>
                    {t('search.noResults')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('search.noResultsDescription')}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setFilterDrawerOpen(true)}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                  >
                    {t('search.modifyFilters')}
                  </Button>
                </Box>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {units.map((unit, index) => (
                      <Grid size={{ xs: 12, sm: 6, lg: viewMode === 'grid' ? 4 : 12 }} key={unit.id}>
                        <UnitCard unit={unit} index={index} variant={viewMode === 'list' ? 'list' : 'grid'} />
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3 }}>
                    <Button
                      variant="outlined"
                      disabled={isLoading || !pagination?.hasPreviousPage}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          page: Math.max(1, (filters.page || 1) - 1),
                          pageSize: filters.pageSize || 12,
                        })
                      }}
                    >
                      {t('search.previous')}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={isLoading || !pagination?.hasNextPage}
                      onClick={() => {
                        setFilters({ ...filters, page: (filters.page || 1) + 1, pageSize: filters.pageSize || 12 })
                      }}
                    >
                      {t('search.next')}
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Mobile Filter Drawer */}
      <FilterDrawer />
    </Box>
  )
}

