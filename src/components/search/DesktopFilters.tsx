import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Refresh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'
import { getProjects } from '../../lib/api-client'
import { UNIT_MODEL_OPTIONS } from '../../lib/constants/unitModels'
import { Project } from '../../lib/types'

export default function DesktopFilters() {
  const { t, i18n } = useTranslation()
  const { filters, setFilters, clearFilters } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function loadProjects() {
      const response = await getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    }
    loadProjects()
  }, [])

  const bedroomOptions = [
    { value: '', label: t('search.options.all') },
    { value: '1', label: t('search.options.oneRoom') },
    { value: '2', label: t('search.options.twoRooms') },
    { value: '3', label: t('search.options.threeRooms') },
    { value: '4', label: t('search.options.fourRooms') },
    { value: '5', label: t('search.options.fivePlusRooms') },
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

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== undefined && value !== false && key !== 'page' && key !== 'pageSize'
  )

  return (
    <Card
      sx={(theme) => ({
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(16px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
      })}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="semibold">
            {t('search.filterResults')}
          </Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={clearFilters}
              sx={{ fontSize: '0.875rem' }}
            >
              {t('search.reset')}
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          <TextField
            select
            label={t('search.project')}
            value={filters.projectId || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                projectId: e.target.value || undefined,
                page: 1,
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
            value={filters.projectType || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                projectType: e.target.value || undefined,
                page: 1,
              })
            }
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
            value={filters.model || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                model: e.target.value || undefined,
                page: 1,
              })
            }
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
            value={filters.bedrooms?.toString() || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                bedrooms: e.target.value ? parseInt(e.target.value) : undefined,
                page: 1,
              })
            }
            fullWidth
          >
            {bedroomOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.eligibleForSubsidies === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    eligibleForSubsidies: e.target.checked ? true : undefined,
                    page: 1,
                  })
                }
              />
            }
            label={t('search.eligibleForSubsidies')}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
