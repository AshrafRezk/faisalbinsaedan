import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Button, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Refresh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../lib/store'
import { getProjects } from '../../lib/api-client'
import { Project } from '../../lib/types'
import SearchFilterFields, {
  filtersToFormValues,
  formValuesToFilters,
} from './SearchFilterFields'

export default function DesktopFilters() {
  const { t } = useTranslation()
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

  const values = filtersToFormValues(filters)
  const hasActiveFilters = Object.entries(formValuesToFilters(values)).some(([, value]) => value !== undefined)

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

        <SearchFilterFields
          values={values}
          projects={projects}
          onChange={(next) =>
            setFilters({
              ...filters,
              ...formValuesToFilters(next),
              page: 1,
            })
          }
        />
      </CardContent>
    </Card>
  )
}
