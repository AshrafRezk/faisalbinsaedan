import { useEffect, useState } from 'react'
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import { Send } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { createLead, getProjects } from '../../lib/api-client'
import { friendlyLeadErrorMessage } from '../../lib/salesforce/friendlyError'
import {
  DEFAULT_LEAD_COUNTRY_CODE,
  LEAD_COUNTRY_CODES,
  countryCodeLabel,
} from '../../lib/leadCountryCodes'
import type { Project } from '../../lib/types'

const getSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(2, t('registerInterest.firstNameRequired')),
      companyName: z.string().optional(),
      email: z.union([z.string().email(t('registerInterest.emailInvalid')), z.literal('')]).optional(),
      countryCode: z.string().min(2),
      phone: z.string().min(9, t('registerInterest.phoneInvalid')),
      projectId: z.string().optional(),
      rentalBudget: z.string().optional(),
      numberOfRooms: z.string().optional(),
      rentalStartDate: z.string().optional(),
      rentalEndDate: z.string().optional(),
      propertyType: z.string().optional(),
      message: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.rentalStartDate && data.rentalEndDate && data.rentalEndDate < data.rentalStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('commercial.invalidDateRange'),
          path: ['rentalEndDate'],
        })
      }
    })

type FormData = z.infer<ReturnType<typeof getSchema>>

function parseOptionalNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export default function CommercialLeadForm() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(t)),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      countryCode: DEFAULT_LEAD_COUNTRY_CODE,
      phone: '',
      projectId: '',
      rentalBudget: '',
      numberOfRooms: '',
      rentalStartDate: '',
      rentalEndDate: '',
      propertyType: '',
      message: '',
    },
  })

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await getProjects()
        if (response.success && response.data) {
          setProjects(response.data)
        }
      } catch (err) {
        console.error('Error loading projects for commercial form:', err)
      }
    }
    loadProjects()
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const parts = data.name.trim().split(/\s+/).filter(Boolean)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || firstName

      const selectedProject = projects.find((p) => p.id === data.projectId)
      const projectLabel = selectedProject
        ? isAr
          ? selectedProject.nameAr || selectedProject.name
          : selectedProject.name
        : ''

      const meta = [
        'Lead Type: Commercial/Rental',
        data.companyName ? `Company: ${data.companyName}` : null,
        data.propertyType ? `Property Type: ${data.propertyType}` : null,
        projectLabel ? `Project: ${projectLabel}` : null,
      ].filter(Boolean)

      const message = `${data.message || 'Interested in commercial & rental properties'}\n\n${meta.join('\n')}`

      const response = await createLead({
        profile: 'Customer',
        firstName,
        lastName,
        phone: data.phone,
        countryCode: data.countryCode,
        email: data.email || '',
        company: data.companyName || undefined,
        message,
        unitType: 'Rental',
        region: selectedProject?.provinceRegion || undefined,
        city: selectedProject?.city || undefined,
        interestedProjectName: projectLabel || undefined,
        interestedProjectId: data.projectId || undefined,
        rentalProjectId: data.projectId || undefined,
        rentalBudget: parseOptionalNumber(data.rentalBudget),
        numberOfRooms: parseOptionalNumber(data.numberOfRooms),
        rentalStartDate: data.rentalStartDate || undefined,
        rentalEndDate: data.rentalEndDate || undefined,
      })

      if (response.success) {
        setIsSuccess(true)
        reset()
        setTimeout(() => setIsSuccess(false), 5000)
      } else {
        setError(friendlyLeadErrorMessage(response.error, t('contact.errorOccurred')))
      }
    } catch {
      setError(t('contact.errorOccurred'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {t('contact.messageSent')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('contact.willContactSoon')}
        </Typography>
      </Box>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('name')}
            label={t('contact.name')}
            placeholder={t('contact.namePlaceholder')}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('companyName')}
            label={t('contact.profileOptions.company', 'Company Name')}
            placeholder={t('contact.notSpecified')}
            fullWidth
            error={!!errors.companyName}
            helperText={errors.companyName?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('email')}
            label={t('contact.email')}
            type="email"
            placeholder={t('contact.emailPlaceholder')}
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="countryCode"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required>
                <InputLabel>{t('contact.countryCode')}</InputLabel>
                <Select
                  label={t('contact.countryCode')}
                  {...field}
                  value={field.value || DEFAULT_LEAD_COUNTRY_CODE}
                >
                  {LEAD_COUNTRY_CODES.map((code) => (
                    <MenuItem key={code.value} value={code.value}>
                      {countryCodeLabel(code, isAr)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            {...register('phone')}
            label={t('contact.phone')}
            type="tel"
            placeholder={t('contact.phonePlaceholder')}
            fullWidth
            required
            error={!!errors.phone}
            helperText={errors.phone?.message || t('contact.phoneHint')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>{t('commercial.project')}</InputLabel>
                <Select label={t('commercial.project')} {...field} value={field.value || ''}>
                  <MenuItem value="">{t('search.options.allProjects')}</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {isAr ? p.nameAr || p.name : p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="propertyType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>{t('commercial.propertyType')}</InputLabel>
                <Select label={t('commercial.propertyType')} {...field} value={field.value || ''}>
                  <MenuItem value="">{t('search.options.all')}</MenuItem>
                  <MenuItem value="office">{t('commercial.propertyOptions.office')}</MenuItem>
                  <MenuItem value="retail">{t('commercial.propertyOptions.retail')}</MenuItem>
                  <MenuItem value="warehouse">{t('commercial.propertyOptions.warehouse')}</MenuItem>
                  <MenuItem value="other">{t('commercial.propertyOptions.other')}</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('rentalBudget')}
            label={t('commercial.rentalBudget')}
            placeholder={t('commercial.rentalBudgetPlaceholder')}
            fullWidth
            type="number"
            inputProps={{ min: 0, step: 1000 }}
            error={!!errors.rentalBudget}
            helperText={errors.rentalBudget?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('numberOfRooms')}
            label={t('commercial.numberOfRooms')}
            placeholder={t('commercial.numberOfRoomsPlaceholder')}
            fullWidth
            type="number"
            inputProps={{ min: 0, step: 1 }}
            error={!!errors.numberOfRooms}
            helperText={errors.numberOfRooms?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('rentalStartDate')}
            label={t('commercial.rentalStartDate')}
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            error={!!errors.rentalStartDate}
            helperText={errors.rentalStartDate?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('rentalEndDate')}
            label={t('commercial.rentalEndDate')}
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            error={!!errors.rentalEndDate}
            helperText={errors.rentalEndDate?.message}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            {...register('message')}
            label={t('contact.message')}
            placeholder={t('contact.messagePlaceholder')}
            fullWidth
            multiline
            rows={4}
            error={!!errors.message}
            helperText={errors.message?.message}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting}
        startIcon={<Send size={20} />}
        sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
      >
        {isSubmitting ? t('contact.submitting') : t('contact.send')}
      </Button>
    </form>
  )
}
