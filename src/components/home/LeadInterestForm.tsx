import { useState, useEffect, useMemo, useId } from 'react'
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Link,
} from '@mui/material'
import { CheckCircle, UploadFile } from '@mui/icons-material'
import { Send, FileDown } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { createLead, getProjects } from '../../lib/api-client'
import { salesforceIdsEqual } from '../../lib/salesforceIds'
import { friendlyLeadErrorMessage } from '../../lib/salesforce/friendlyError'
import { SUPPLIER_GUIDE_PDF_URL } from '../../lib/contact'
import {
  DEFAULT_LEAD_COUNTRY_CODE,
  LEAD_COUNTRY_CODES,
  countryCodeLabel,
} from '../../lib/leadCountryCodes'
import type { Project } from '../../lib/types'

const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log('[LeadInterestForm]', ...args)
}

export type LeadInterestFormProps = {
  /** `inline` = Contact page (always visible). `dialog` = modal (fetch when `active`). */
  mode: 'inline' | 'dialog'
  /** When mode is `dialog`, pass open state so projects load only while open */
  active?: boolean
  projectId?: string
  phaseId?: string
  unitId?: string
  unitNumber?: string
  projectName?: string
  /** From unit page `Project__r` when list match fails or loads late */
  fallbackProvinceRegion?: string
  fallbackCity?: string
  /** Form id for external submit buttons (dialog actions) */
  formId?: string
  /** Cancel / close (dialog footer only) */
  onCancel?: () => void
  /** Called after success so the dialog can close (only used with `dialog` mode) */
  onDialogFlowComplete?: () => void
}

type FormData = z.infer<ReturnType<typeof getSchema>>

const MAX_SUPPLIER_PDF_BYTES = 5 * 1024 * 1024

const getSchema = (t: (key: string) => string) =>
  z
    .object({
      profile: z.enum(['Investor', 'Individual', 'Supplier']),
      name: z.string().min(2, t('registerInterest.firstNameRequired')),
      email: z.union([z.string().email(t('registerInterest.emailInvalid')), z.literal('')]).optional(),
      countryCode: z.string().min(2),
      phone: z.string().min(9, t('registerInterest.phoneInvalid')),
      region: z.string().optional(),
      city: z.string().optional(),
      project: z.string().optional(),
      message: z.string().trim().min(3, t('contact.messageTooShort')),
      commercialRegistrationNumber: z.string().optional(),
      taxRegistrationNumber: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.profile !== 'Supplier') return
      const cr = (data.commercialRegistrationNumber || '').trim()
      const tax = (data.taxRegistrationNumber || '').trim()
      if (!cr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['commercialRegistrationNumber'],
          message: t('contact.commercialRegistrationRequired'),
        })
      } else if (cr.length > 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['commercialRegistrationNumber'],
          message: t('contact.commercialRegistrationTooLong'),
        })
      }
      if (!tax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['taxRegistrationNumber'],
          message: t('contact.taxRegistrationRequired'),
        })
      } else if (tax.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['taxRegistrationNumber'],
          message: t('contact.taxRegistrationTooLong'),
        })
      }
    })

function buildEmptyDefaults(projectId?: string): FormData {
  return {
    profile: 'Investor',
    name: '',
    email: '',
    countryCode: DEFAULT_LEAD_COUNTRY_CODE,
    phone: '',
    region: '',
    city: '',
    project: projectId ?? '',
    message: '',
    commercialRegistrationNumber: '',
    taxRegistrationNumber: '',
  }
}

export default function LeadInterestForm({
  mode,
  active = true,
  projectId,
  phaseId,
  unitId,
  unitNumber,
  projectName,
  fallbackProvinceRegion,
  fallbackCity,
  formId = 'lead-interest-form',
  onCancel,
  onDialogFlowComplete,
}: LeadInterestFormProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const uid = useId()
  const regionLabelId = `${uid}-region`
  const cityLabelId = `${uid}-city`
  const projectLabelId = `${uid}-project`
  const countryLabelId = `${uid}-country`

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supplierPdf, setSupplierPdf] = useState<File | null>(null)
  const [supplierPdfError, setSupplierPdfError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  const projectLocked = Boolean(projectId)
  const isInline = mode === 'inline'

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(t)),
    defaultValues: buildEmptyDefaults(projectId),
  })

  const regionWatch = watch('region')
  const cityWatch = watch('city')
  const profileWatch = watch('profile')
  const isSupplier = profileWatch === 'Supplier'

  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) {
      if (p.provinceRegion) set.add(p.provinceRegion)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [projects])

  const cities = useMemo(() => {
    const pool = regionWatch ? projects.filter((p) => p.provinceRegion === regionWatch) : projects
    const set = new Set<string>()
    for (const p of pool) {
      if (p.city) set.add(p.city)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [projects, regionWatch])

  const projectsForSelect = useMemo(() => {
    return projects
      .filter((p) => {
        if (regionWatch && p.provinceRegion !== regionWatch) return false
        if (cityWatch && p.city !== cityWatch) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [projects, regionWatch, cityWatch])

  /** Resolved project row when `projectId` is preset — match list by SF id, else synthetic row from unit fallbacks. */
  const lockedProject = useMemo((): Project | undefined => {
    if (!projectId) return undefined
    const found = projects.find((p) => salesforceIdsEqual(p.id, projectId))
    if (found) return found
    const pr = (fallbackProvinceRegion ?? '').trim()
    const ct = (fallbackCity ?? '').trim()
    if (pr || ct || (projectName ?? '').trim()) {
      return {
        id: projectId,
        name: projectName || '',
        nameAr: projectName || '',
        provinceRegion: pr || undefined,
        city: ct || undefined,
        location: '',
        locationAr: '',
        coverImageUrl: '',
        featuredVideoUrl: '',
        status: 'Active',
        phases: [],
      }
    }
    return undefined
  }, [projectId, projects, fallbackProvinceRegion, fallbackCity, projectName])

  useEffect(() => {
    let cancelled = false
    if (!active) {
      log('getProjects: skip (active=false)')
      return
    }
    log('getProjects: fetch start', { mode, active, projectId })
    setProjectsLoading(true)
    getProjects()
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          log('getProjects: success', {
            count: res.data.length,
            projectIdsHead: res.data.slice(0, 3).map((p) => p.id),
            sampleFields: res.data[0]
              ? {
                  id: res.data[0].id,
                  name: res.data[0].name,
                  provinceRegion: res.data[0].provinceRegion,
                  city: res.data[0].city,
                }
              : null,
          })
          setProjects(res.data)
        } else {
          log('getProjects: no data or !success', { success: res.success, hasData: Boolean((res as { data?: unknown }).data) })
        }
      })
      .catch((err) => {
        log('getProjects: error', err)
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, mode, projectId])

  useEffect(() => {
    if (mode === 'dialog' && !active) {
      log('reset: skip (dialog closed)')
      return
    }
    log('reset: run', { mode, active, projectId, unitId, defaults: buildEmptyDefaults(projectId) })
    reset(buildEmptyDefaults(projectId))
    setError(null)
    setIsSuccess(false)
    setSupplierPdf(null)
    setSupplierPdfError(null)
  }, [active, projectId, reset, mode, unitId])

  // When project is pre-selected (e.g. unit page), fill region & city from project list or unit fallbacks
  useEffect(() => {
    if (!active) {
      log('syncRegionCity: skip (!active)')
      return
    }
    if (!projectId) {
      log('syncRegionCity: skip (no projectId)')
      return
    }

    const apply = (regionVal: string, cityVal: string, reason: string, extra?: Record<string, unknown>) => {
      log('syncRegionCity: applying', { reason, projectId, regionVal, cityVal, ...extra })
      setValue('region', regionVal, { shouldDirty: false, shouldValidate: false })
      setValue('city', cityVal, { shouldDirty: false, shouldValidate: false })
    }

    const row = projects.find((pr) => salesforceIdsEqual(pr.id, projectId))
    if (row) {
      apply((row.provinceRegion ?? '').trim(), (row.city ?? '').trim(), 'from getProjects row', {
        raw: { provinceRegion: row.provinceRegion, city: row.city },
      })
      return
    }

    const fbR = (fallbackProvinceRegion ?? '').trim()
    const fbC = (fallbackCity ?? '').trim()
    if (fbR || fbC) {
      apply(fbR, fbC, 'from unit Project__r fallbacks')
      return
    }

    if (projects.length === 0) {
      log('syncRegionCity: wait (projects empty, no fallbacks)', { projectId })
      return
    }

    log('syncRegionCity: project NOT in list & no fallbacks', {
      projectId,
      listHasIds: projects.map((x) => x.id).slice(0, 12),
      total: projects.length,
      idMatchProbe: projects.some((x) => salesforceIdsEqual(x.id, projectId)),
    })
  }, [active, projectId, projects, setValue, fallbackProvinceRegion, fallbackCity])

  useEffect(() => {
    if (!projectLocked) return
    log('locked form snapshot', {
      regionWatch,
      cityWatch,
      fallbackProvinceRegion,
      fallbackCity,
      lockedProject: lockedProject
        ? {
            id: lockedProject.id,
            provinceRegion: lockedProject.provinceRegion,
            city: lockedProject.city,
            name: lockedProject.name,
          }
        : null,
    })
  }, [projectLocked, regionWatch, cityWatch, lockedProject, fallbackProvinceRegion, fallbackCity])

  const validateSupplierPdf = (file: File | null): string | null => {
    if (!file) return t('contact.supplierPdfRequired')
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) return t('contact.supplierPdfInvalid')
    if (file.size > MAX_SUPPLIER_PDF_BYTES) return t('contact.supplierPdfTooLarge')
    return null
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    setSupplierPdfError(null)

    if (data.profile === 'Supplier') {
      const pdfError = validateSupplierPdf(supplierPdf)
      if (pdfError) {
        setSupplierPdfError(pdfError)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const parts = data.name.trim().split(/\s+/).filter(Boolean)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || firstName
      const effectiveProjectId = projectLocked ? projectId! : data.project || undefined
      const selectedProject = effectiveProjectId ? projects.find((p) => p.id === effectiveProjectId) : undefined
      const projectLabel = selectedProject
        ? i18n.language.startsWith('ar')
          ? selectedProject.nameAr || selectedProject.name
          : selectedProject.name
        : projectName || ''
      const meta = [
        data.region ? `Region: ${data.region}` : null,
        data.city ? `City: ${data.city}` : null,
        projectLabel ? `Project: ${projectLabel}` : null,
        unitNumber ? `Unit: ${unitNumber}` : null,
        unitId && !unitNumber ? `Unit ID: ${unitId}` : null,
      ].filter(Boolean)
      const message = meta.length ? `${data.message}\n\n${meta.join('\n')}` : data.message

      const response = await createLead(
        {
          profile: data.profile,
          firstName,
          lastName,
          phone: data.phone,
          countryCode: data.countryCode,
          email: data.email || '',
          message,
          region: data.region || lockedProject?.provinceRegion || fallbackProvinceRegion || undefined,
          city: data.city || lockedProject?.city || fallbackCity || undefined,
          interestedProjectName: projectLabel || undefined,
          interestedProjectId: effectiveProjectId || undefined,
          interestedPhaseId: phaseId,
          interestedUnitId: unitId,
          commercialRegistrationNumber:
            data.profile === 'Supplier' ? data.commercialRegistrationNumber?.trim() : undefined,
          taxRegistrationNumber: data.profile === 'Supplier' ? data.taxRegistrationNumber?.trim() : undefined,
        },
        data.profile === 'Supplier' && supplierPdf ? { supplierPdf } : undefined
      )

      if (response.success) {
        setIsSuccess(true)
        setSupplierPdf(null)
        reset(buildEmptyDefaults(projectId))
        if (isInline) {
          setTimeout(() => setIsSuccess(false), 5000)
        } else {
          setTimeout(() => {
            onDialogFlowComplete?.()
            setIsSuccess(false)
          }, 2000)
        }
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
      <Box sx={{ textAlign: 'center', py: isInline ? 4 : 2 }}>
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
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            {t('contact.profileQuestion')}
          </Typography>
          <Controller
            name="profile"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                value={field.value}
                onChange={(_, next) => {
                  if (!next) return
                  field.onChange(next)
                  if (next !== 'Supplier') {
                    setSupplierPdf(null)
                    setSupplierPdfError(null)
                    setValue('commercialRegistrationNumber', '')
                    setValue('taxRegistrationNumber', '')
                  }
                }}
                fullWidth
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 999,
                  overflow: 'hidden',
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    py: 1.25,
                    px: { xs: 1, sm: 1.5 },
                    border: 0,
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    color: 'text.secondary',
                  },
                  '& .MuiToggleButton-root.Mui-selected': {
                    bgcolor: 'action.selected',
                    color: 'text.primary',
                  },
                  '& .MuiToggleButton-root.Mui-selected:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
                aria-label={t('contact.profileQuestion')}
              >
                <ToggleButton value="Investor">{t('contact.profileOptions.investor')}</ToggleButton>
                <ToggleButton value="Individual">{t('contact.profileOptions.individual')}</ToggleButton>
                <ToggleButton value="Supplier">{t('contact.profileOptions.supplier')}</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
          {errors.profile?.message && (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
              {errors.profile.message}
            </Typography>
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            {...register('name')}
            label={t('contact.name')}
            placeholder={t('contact.namePlaceholder')}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
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
        {isSupplier && (
          <>
            <Grid size={{ xs: 12 }}>
              <TextField
                {...register('commercialRegistrationNumber')}
                label={t('contact.commercialRegistrationNumber')}
                fullWidth
                required
                inputProps={{ maxLength: 15 }}
                error={!!errors.commercialRegistrationNumber}
                helperText={errors.commercialRegistrationNumber?.message}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                {...register('taxRegistrationNumber')}
                label={t('contact.taxRegistrationNumber')}
                fullWidth
                required
                inputProps={{ maxLength: 20 }}
                error={!!errors.taxRegistrationNumber}
                helperText={errors.taxRegistrationNumber?.message}
              />
            </Grid>
            {SUPPLIER_GUIDE_PDF_URL ? (
              <Grid size={{ xs: 12 }}>
                <Link
                  href={SUPPLIER_GUIDE_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 600 }}
                >
                  <FileDown size={18} />
                  {t('contact.supplierGuidePdf')}
                </Link>
              </Grid>
            ) : null}
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                {t('contact.supplierPdfLabel')}
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFile />}
                fullWidth
                sx={{ py: 1.5, justifyContent: 'flex-start', textTransform: 'none' }}
              >
                {supplierPdf
                  ? t('contact.supplierPdfSelected', { name: supplierPdf.name })
                  : t('contact.supplierPdfLabel')}
                <input
                  type="file"
                  hidden
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setSupplierPdf(file)
                    setSupplierPdfError(file ? validateSupplierPdf(file) : t('contact.supplierPdfRequired'))
                    e.target.value = ''
                  }}
                />
              </Button>
              <FormHelperText error={!!supplierPdfError}>{supplierPdfError || t('contact.supplierPdfHint')}</FormHelperText>
            </Grid>
          </>
        )}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="countryCode"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required>
                <InputLabel id={countryLabelId}>{t('contact.countryCode')}</InputLabel>
                <Select
                  labelId={countryLabelId}
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
        <Grid size={{ xs: 12 }}>
          {projectLocked ? (
            <>
              <input type="hidden" {...register('region')} />
              <TextField
                label={t('contact.region')}
                value={
                  `${regionWatch || lockedProject?.provinceRegion || fallbackProvinceRegion || ''}`.trim() ||
                  t('contact.notSpecified')
                }
                disabled
                fullWidth
              />
            </>
          ) : (
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.region} disabled={projectsLoading}>
                  <InputLabel id={regionLabelId}>{t('contact.region')}</InputLabel>
                  <Select
                    labelId={regionLabelId}
                    label={t('contact.region')}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      setValue('city', '')
                      setValue('project', '')
                    }}
                  >
                    <MenuItem value="">{t('contact.notSpecified')}</MenuItem>
                    {regions.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.region?.message ? <FormHelperText>{errors.region.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
          {projectLocked ? (
            <>
              <input type="hidden" {...register('city')} />
              <TextField
                label={t('contact.city')}
                value={
                  `${cityWatch || lockedProject?.city || fallbackCity || ''}`.trim() ||
                  t('contact.notSpecified')
                }
                disabled
                fullWidth
              />
            </>
          ) : (
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.city} disabled={projectsLoading}>
                  <InputLabel id={cityLabelId}>{t('contact.city')}</InputLabel>
                  <Select
                    labelId={cityLabelId}
                    label={t('contact.city')}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      setValue('project', '')
                    }}
                  >
                    <MenuItem value="">{t('contact.notSpecified')}</MenuItem>
                    {cities.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.city?.message ? <FormHelperText>{errors.city.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
          {projectLocked ? (
            <>
              <input type="hidden" {...register('project')} />
              <TextField
                label={t('contact.project')}
                value={
                  projectName ||
                  (lockedProject
                    ? i18n.language.startsWith('ar')
                      ? lockedProject.nameAr
                      : lockedProject.name
                    : '')
                }
                disabled
                fullWidth
              />
            </>
          ) : (
            <Controller
              name="project"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.project} disabled={projectsLoading}>
                  <InputLabel id={projectLabelId}>{t('contact.project')}</InputLabel>
                  <Select
                    labelId={projectLabelId}
                    label={t('contact.project')}
                    {...field}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  >
                    <MenuItem value="">{t('contact.notSpecified')}</MenuItem>
                    {projectsForSelect.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {i18n.language.startsWith('ar') ? p.nameAr : p.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {projectsLoading ? (
                    <FormHelperText>{t('contact.loadingProjects')}</FormHelperText>
                  ) : errors.project?.message ? (
                    <FormHelperText>{errors.project.message}</FormHelperText>
                  ) : null}
                </FormControl>
              )}
            />
          )}
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

      {isInline && (
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          startIcon={<Send size={20} />}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? t('contact.submitting') : t('contact.send')}
        </Button>
      )}

      {!isInline && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 2, flexWrap: 'wrap' }}>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={<Send size={20} />}>
            {isSubmitting ? t('contact.submitting') : t('contact.send')}
          </Button>
        </Box>
      )}
    </form>
  )
}
