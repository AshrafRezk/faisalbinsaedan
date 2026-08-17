import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import CurrencyIcon from '../ui/CurrencyIcon'
import { getUnitPriceBreakdown, type PricedUnit } from '../../lib/unitPrice'

type Variant = 'compact' | 'detailed'

interface UnitPriceDisplayProps {
  unit: PricedUnit
  variant?: Variant
  currencyTheme?: 'light' | 'dark'
}

function formatAmount(price: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price)
}

function PriceAmount({
  amount,
  locale,
  currencyTheme,
}: {
  amount: number
  locale: string
  currencyTheme: 'light' | 'dark'
}) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {formatAmount(amount, locale)}
      <CurrencyIcon theme={currencyTheme} className="mx-1" />
    </Box>
  )
}

export default function UnitPriceDisplay({
  unit,
  variant = 'compact',
  currencyTheme = 'light',
}: UnitPriceDisplayProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'
  const { original, afterSubsidy, showBoth } = getUnitPriceBreakdown(unit)

  if (!showBoth) {
    const typo = variant === 'detailed' ? 'h3' : 'h6'
    return (
      <Typography
        variant={typo}
        fontWeight="bold"
        color="primary.main"
        sx={{
          display: 'flex',
          alignItems: 'center',
          fontSize: variant === 'detailed' ? { xs: '2rem', md: '2.5rem' } : undefined,
        }}
      >
        <PriceAmount amount={original} locale={locale} currencyTheme={currencyTheme} />
      </Typography>
    )
  }

  if (variant === 'detailed') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
            {t('unit.priceBeforeSubsidy')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'line-through', fontWeight: 500 }}
          >
            <PriceAmount amount={original} locale={locale} currencyTheme={currencyTheme} />
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
            {t('unit.priceAfterSubsidy')}
          </Typography>
          <Typography
            variant="h3"
            fontWeight="bold"
            color="primary.main"
            sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            <PriceAmount amount={afterSubsidy} locale={locale} currencyTheme={currencyTheme} />
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
        {t('unit.priceBeforeSubsidy')}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'line-through' }}
      >
        <PriceAmount amount={original} locale={locale} currencyTheme={currencyTheme} />
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
        {t('unit.priceAfterSubsidy')}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center' }}>
        <PriceAmount amount={afterSubsidy} locale={locale} currencyTheme={currencyTheme} />
      </Typography>
    </Box>
  )
}
