import {
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Project, UnitFilters } from '../../lib/types'

export const SEARCH_PRICE_FLOOR = 270000

export const SEARCH_UNIT_TYPES = [
  { value: 'Villa', labelKey: 'search.options.standaloneVilla' },
  { value: 'Townhouse', labelKey: 'search.options.townhouse' },
  { value: 'Apartment', labelKey: 'search.options.apartment' },
] as const

export type SearchSupportAvailable = '' | 'yes' | 'no'

export type SearchFilterFormValues = {
  projectId: string
  city: string
  unitType: string
  minPrice: string
  maxPrice: string
  supportAvailable: SearchSupportAvailable
}

export function filtersToFormValues(filters: UnitFilters): SearchFilterFormValues {
  return {
    projectId: filters.projectId || '',
    city: filters.city || '',
    unitType: filters.unitType || '',
    minPrice: typeof filters.minPrice === 'number' ? String(filters.minPrice) : '',
    maxPrice: typeof filters.maxPrice === 'number' ? String(filters.maxPrice) : '',
    supportAvailable:
      filters.eligibleForSubsidies === true ? 'yes' : filters.eligibleForSubsidies === false ? 'no' : '',
  }
}

function parsePrice(value: string): number | undefined {
  const trimmed = value.trim().replace(/,/g, '')
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export function formValuesToFilters(values: SearchFilterFormValues): Pick<
  UnitFilters,
  'projectId' | 'city' | 'unitType' | 'minPrice' | 'maxPrice' | 'eligibleForSubsidies'
> {
  return {
    projectId: values.projectId || undefined,
    city: values.city || undefined,
    unitType: values.unitType || undefined,
    minPrice: parsePrice(values.minPrice),
    maxPrice: parsePrice(values.maxPrice),
    eligibleForSubsidies:
      values.supportAvailable === 'yes' ? true : values.supportAvailable === 'no' ? false : undefined,
  }
}

export function uniqueProjectCities(projects: Project[]): string[] {
  const seen = new Set<string>()
  const cities: string[] = []
  for (const project of projects) {
    const city = project.city?.trim()
    if (!city || seen.has(city)) continue
    seen.add(city)
    cities.push(city)
  }
  return cities.sort((a, b) => a.localeCompare(b))
}

type SearchFilterFieldsProps = {
  values: SearchFilterFormValues
  projects: Project[]
  onChange: (values: SearchFilterFormValues) => void
}

export default function SearchFilterFields({ values, projects, onChange }: SearchFilterFieldsProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const priceFloorLabel = new Intl.NumberFormat(isAr ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(SEARCH_PRICE_FLOOR)

  const cities = uniqueProjectCities(projects)
  const projectOptions = projects.filter((project) => !values.city || project.city?.trim() === values.city)

  const update = (patch: Partial<SearchFilterFormValues>) => {
    const next = { ...values, ...patch }
    if (patch.city !== undefined && patch.city !== values.city) {
      const selected = projects.find((project) => project.id === next.projectId)
      if (selected && patch.city && selected.city?.trim() !== patch.city) {
        next.projectId = ''
      }
    }
    onChange(next)
  }

  return (
    <Stack spacing={2}>
      <TextField
        select
        label={t('search.projectName')}
        value={values.projectId}
        onChange={(e) => update({ projectId: e.target.value })}
        fullWidth
      >
        <MenuItem value="">{t('search.options.allProjects')}</MenuItem>
        {projectOptions.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {isAr ? project.nameAr : project.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('search.city')}
        value={values.city}
        onChange={(e) => update({ city: e.target.value })}
        fullWidth
      >
        <MenuItem value="">{t('search.options.allCities')}</MenuItem>
        {cities.map((city) => (
          <MenuItem key={city} value={city}>
            {city}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('search.propertyType')}
        value={values.unitType}
        onChange={(e) => update({ unitType: e.target.value })}
        fullWidth
      >
        <MenuItem value="">{t('search.options.all')}</MenuItem>
        {SEARCH_UNIT_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        type="number"
        label={t('search.minPrice')}
        value={values.minPrice}
        onChange={(e) => update({ minPrice: e.target.value })}
        fullWidth
        helperText={t('search.priceStartingFrom', { price: priceFloorLabel })}
        InputProps={{
          startAdornment: <InputAdornment position="start">{t('search.currency')}</InputAdornment>,
        }}
        inputProps={{ min: 0, step: 1000 }}
      />

      <TextField
        type="number"
        label={t('search.maxPrice')}
        value={values.maxPrice}
        onChange={(e) => update({ maxPrice: e.target.value })}
        fullWidth
        InputProps={{
          startAdornment: <InputAdornment position="start">{t('search.currency')}</InputAdornment>,
        }}
        inputProps={{ min: 0, step: 1000 }}
      />

      <TextField
        select
        label={t('search.supportAvailable')}
        value={values.supportAvailable}
        onChange={(e) => update({ supportAvailable: e.target.value as SearchSupportAvailable })}
        fullWidth
      >
        <MenuItem value="">{t('search.options.all')}</MenuItem>
        <MenuItem value="yes">{t('search.options.yes')}</MenuItem>
        <MenuItem value="no">{t('search.options.no')}</MenuItem>
      </TextField>
    </Stack>
  )
}
