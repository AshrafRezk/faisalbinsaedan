import { useState } from 'react'
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
import { createLead } from '../../lib/api-client'

const getSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t('registerInterest.firstNameRequired')),
    companyName: z.string().optional(),
    email: z.union([z.string().email(t('registerInterest.emailInvalid')), z.literal('')]).optional(),
    phone: z.string().min(9, t('registerInterest.phoneInvalid')),
    propertyType: z.string().min(1, t('contact.profileRequired')),
    budget: z.string().min(1, t('contact.profileRequired')),
    area: z.string().optional(),
    message: z.string().optional(),
  })

type FormData = z.infer<ReturnType<typeof getSchema>>

export default function CommercialLeadForm() {
  const { t } = useTranslation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      phone: '',
      propertyType: '',
      budget: '',
      area: '',
      message: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const parts = data.name.trim().split(/\s+/).filter(Boolean)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || firstName

      const meta = [
        `Lead Type: Commercial/Rental`,
        data.companyName ? `Company: ${data.companyName}` : null,
        `Property Type: ${data.propertyType}`,
        `Budget: ${data.budget}`,
        data.area ? `Required Area: ${data.area} sqm` : null,
      ].filter(Boolean)
      
      const message = `${data.message || 'Interested in commercial properties'}\n\n${meta.join('\n')}`

      const response = await createLead({
        profile: 'Customer', // Default to Customer or can be dynamically mapped
        firstName,
        lastName,
        phone: data.phone,
        email: data.email || '',
        message,
      })

      if (response.success) {
        setIsSuccess(true)
        reset()
        setTimeout(() => setIsSuccess(false), 5000)
      } else {
        setError(response.error || t('contact.errorOccurred'))
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('phone')}
            label={t('contact.phone')}
            type="tel"
            placeholder={t('contact.phonePlaceholder')}
            fullWidth
            required
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="propertyType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.propertyType}>
                <InputLabel>{t('commercial.propertyType')}</InputLabel>
                <Select label={t('commercial.propertyType')} {...field}>
                  <MenuItem value="office">{t('commercial.propertyOptions.office')}</MenuItem>
                  <MenuItem value="retail">{t('commercial.propertyOptions.retail')}</MenuItem>
                  <MenuItem value="warehouse">{t('commercial.propertyOptions.warehouse')}</MenuItem>
                  <MenuItem value="other">{t('commercial.propertyOptions.other')}</MenuItem>
                </Select>
                {errors.propertyType?.message ? <FormHelperText>{errors.propertyType.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.budget}>
                <InputLabel>{t('commercial.budget')}</InputLabel>
                <Select label={t('commercial.budget')} {...field}>
                  <MenuItem value="under100k">{t('commercial.budgetOptions.under100k')}</MenuItem>
                  <MenuItem value="100kTo500k">{t('commercial.budgetOptions.100kTo500k')}</MenuItem>
                  <MenuItem value="500kTo1m">{t('commercial.budgetOptions.500kTo1m')}</MenuItem>
                  <MenuItem value="above1m">{t('commercial.budgetOptions.above1m')}</MenuItem>
                </Select>
                {errors.budget?.message ? <FormHelperText>{errors.budget.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            {...register('area')}
            label={t('commercial.area')}
            placeholder={t('commercial.areaPlaceholder')}
            fullWidth
            type="number"
            error={!!errors.area}
            helperText={errors.area?.message}
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
