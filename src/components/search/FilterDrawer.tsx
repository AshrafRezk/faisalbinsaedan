import { useEffect, useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Close, Refresh as RefreshIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'
import { getProjects } from '../../lib/api-client'
import { UNIT_MODEL_OPTIONS } from '../../lib/constants/unitModels'
import { Project } from '../../lib/types'

export default function FilterDrawer() {
  const { t, i18n } = useTranslation()
  const { isFilterDrawerOpen, setFilterDrawerOpen, filters, setFilters, clearFilters } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])

  const [localFilters, setLocalFilters] = useState({
    projectId: filters.projectId || '',
    projectType: filters.projectType || '',
    model: filters.model || '',
    bedrooms: filters.bedrooms?.toString() || '',
    priceRange: '',
    eligibleForSubsidies: filters.eligibleForSubsidies === true,
  })

  useEffect(() => {
    async function loadProjects() {
      const response = await getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    setLocalFilters({
      projectId: filters.projectId || '',
      projectType: filters.projectType || '',
      model: filters.model || '',
      bedrooms: filters.bedrooms?.toString() || '',
      priceRange: '',
      eligibleForSubsidies: filters.eligibleForSubsidies === true,
    })
  }, [filters])

  const bedroomOptions = [
    { value: '', label: t('search.options.all') },
    { value: '1', label: t('search.options.oneRoom') },
    { value: '2', label: t('search.options.twoRooms') },
    { value: '3', label: t('search.options.threeRooms') },
    { value: '4', label: t('search.options.fourRooms') },
    { value: '5', label: t('search.options.fivePlusRooms') },
  ]

  const priceOptions = [
    { value: '', label: t('search.options.all') },
    { value: '0-1000000', label: t('search.options.price.opt1') },
    { value: '1000000-2000000', label: t('search.options.price.opt2') },
    { value: '2000000-3000000', label: t('search.options.price.opt3') },
    { value: '3000000-5000000', label: t('search.options.price.opt4') },
    { value: '5000000-999999999', label: t('search.options.price.opt5') },
  ]

  const projectOptions = [
    { value: '', label: t('search.options.allProjects') },
    ...projects.map((p) => ({ value: p.id, label: i18n.language.startsWith('ar') ? p.nameAr : p.name })),
  ]

  const modelOptions = [
    { value: '', label: t('search.options.all') },
    ...UNIT_MODEL_OPTIONS.map((m) => ({ value: m, label: m })),
  ]

  const propertyTypeOptions = [
    { value: '', label: t('search.options.all') },
    { value: 'Residential', label: t('unit.residential') },
    { value: 'Commercial', label: t('unit.commercial') },
  ]

  const handleApply = () => {
    const [minPrice, maxPrice] = localFilters.priceRange
      ? localFilters.priceRange.split('-').map(Number)
      : [undefined, undefined]

    setFilters({
      projectId: localFilters.projectId || undefined,
      projectType: localFilters.projectType || undefined,
      model: localFilters.model || undefined,
      bedrooms: localFilters.bedrooms ? parseInt(localFilters.bedrooms) : undefined,
      minPrice,
      maxPrice,
      eligibleForSubsidies: localFilters.eligibleForSubsidies ? true : undefined,
      page: 1,
    })
    setFilterDrawerOpen(false)
  }

  const handleReset = () => {
    setLocalFilters({
      projectId: '',
      projectType: '',
      model: '',
      bedrooms: '',
      priceRange: '',
      eligibleForSubsidies: false,
    })
    clearFilters()
  }

  const hasActiveFilters =
    localFilters.projectId !== '' ||
    localFilters.projectType !== '' ||
    localFilters.model !== '' ||
    localFilters.bedrooms !== '' ||
    localFilters.priceRange !== '' ||
    localFilters.eligibleForSubsidies

  return (
    <Drawer
      anchor="bottom"
      open={isFilterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      PaperProps={{
        sx: (theme) => ({
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '85vh',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }),
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 6,
              bgcolor: 'grey.300',
              borderRadius: 3,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="semibold">
          {t('search.filterResults')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              sx={{ fontSize: '0.875rem' }}
            >
              {t('search.reset')}
            </Button>
          )}
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 2, overflowY: 'auto', maxHeight: '60vh' }}>
        <Stack spacing={2}>
          <TextField
            select
            label={t('search.project')}
            value={localFilters.projectId}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                projectId: e.target.value,
              })
            }
            fullWidth
          >
            {projectOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('search.propertyType')}
            value={localFilters.projectType}
            onChange={(e) => setLocalFilters({ ...localFilters, projectType: e.target.value })}
            fullWidth
          >
            {propertyTypeOptions.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('search.model')}
            value={localFilters.model}
            onChange={(e) => setLocalFilters({ ...localFilters, model: e.target.value })}
            fullWidth
          >
            {modelOptions.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('search.bedrooms')}
            value={localFilters.bedrooms}
            onChange={(e) => setLocalFilters({ ...localFilters, bedrooms: e.target.value })}
            fullWidth
          >
            {bedroomOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('search.priceRange')}
            value={localFilters.priceRange}
            onChange={(e) => setLocalFilters({ ...localFilters, priceRange: e.target.value })}
            fullWidth
          >
            {priceOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.eligibleForSubsidies}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, eligibleForSubsidies: e.target.checked })
                }
              />
            }
            label={t('search.eligibleForSubsidies')}
          />
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }} className="safe-bottom">
        <Button variant="contained" fullWidth onClick={handleApply} size="large">
          {t('search.applyFilters')}
        </Button>
      </Box>
    </Drawer>
  )
}
