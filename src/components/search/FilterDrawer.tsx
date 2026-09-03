import { useEffect, useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Close, Refresh as RefreshIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'
import { getProjects } from '../../lib/api-client'
import { Project } from '../../lib/types'
import SearchFilterFields, {
  filtersToFormValues,
  formValuesToFilters,
  type SearchFilterFormValues,
} from './SearchFilterFields'

const EMPTY_VALUES: SearchFilterFormValues = {
  projectId: '',
  city: '',
  unitType: '',
  minPrice: '',
  maxPrice: '',
  supportAvailable: 'yes',
}

export default function FilterDrawer() {
  const { t } = useTranslation()
  const { isFilterDrawerOpen, setFilterDrawerOpen, filters, setFilters, clearFilters } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [localFilters, setLocalFilters] = useState<SearchFilterFormValues>(filtersToFormValues(filters))

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
    setLocalFilters(filtersToFormValues(filters))
  }, [filters])

  const handleApply = () => {
    setFilters({
      ...filters,
      ...formValuesToFilters(localFilters),
      page: 1,
    })
    setFilterDrawerOpen(false)
  }

  const handleReset = () => {
    setLocalFilters(EMPTY_VALUES)
    clearFilters()
  }

  const hasActiveFilters = Object.entries(formValuesToFilters(localFilters)).some(
    ([, value]) => value !== undefined
  )

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
        <SearchFilterFields values={localFilters} projects={projects} onChange={setLocalFilters} />
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }} className="safe-bottom">
        <Button variant="contained" fullWidth onClick={handleApply} size="large">
          {t('search.applyFilters')}
        </Button>
      </Box>
    </Drawer>
  )
}
