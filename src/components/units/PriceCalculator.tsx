import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Slider,
  Paper,
  Grid,
  Divider,
} from '@mui/material'
import { Calculator, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Unit } from '../../lib/types'
import CurrencyIcon from '../ui/CurrencyIcon'
import { getUnitDisplayPrice, getUnitPriceBreakdown } from '../../lib/unitPrice'

interface PriceCalculatorProps {
  unit: Unit
  isOpen: boolean
  onClose: () => void
}

export default function PriceCalculator({ unit, isOpen, onClose }: PriceCalculatorProps) {
  const { t, i18n } = useTranslation()
  const [downPayment, setDownPayment] = useState(20)
  const [loanTerm, setLoanTerm] = useState(20)
  const [interestRate, setInterestRate] = useState(4.5)
  const displayPrice = getUnitDisplayPrice(unit)
  const { original, afterSubsidy, showBoth } = getUnitPriceBreakdown(unit)

  const loanAmount = displayPrice * (1 - downPayment / 100)
  const monthlyRate = interestRate / 100 / 12
  const numberOfPayments = loanTerm * 12

  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      : 0

  const totalInterest = monthlyPayment * numberOfPayments - loanAmount
  const totalAmount = displayPrice + totalInterest

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount)
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {formatted}
        <CurrencyIcon theme="light" className="mx-1" />
      </Box>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calculator size={24} />
            <Typography variant="h6">{t('calculator.title')}</Typography>
          </Box>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            <X size={20} />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {showBoth ? (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('calculator.priceBeforeSubsidy')}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 1.5, textDecoration: 'line-through' }}
              >
                {formatCurrency(original)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('calculator.priceAfterSubsidy')}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(afterSubsidy)}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('calculator.unitPrice')}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(displayPrice)}
              </Typography>
            </>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Down Payment */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" gutterBottom>
              {t('calculator.downPayment')}: {downPayment}%
            </Typography>
            <Slider
              value={downPayment}
              onChange={(_, value) => setDownPayment(value as number)}
              min={10}
              max={50}
              step={5}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => t('calculator.downPaymentValue', { value })}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formatCurrency(displayPrice * (downPayment / 100))}
            </Typography>
          </Grid>

          {/* Loan Term */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" gutterBottom>
              {t('calculator.loanTerm')}: {loanTerm} {i18n.language === 'ar' ? 'سنة' : 'years'}
            </Typography>
            <Slider
              value={loanTerm}
              onChange={(_, value) => setLoanTerm(value as number)}
              min={5}
              max={30}
              step={5}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => t('calculator.loanTermValue', { value })}
            />
          </Grid>

          {/* Interest Rate */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t('calculator.interestRate')}
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0, max: 10, step: 0.1 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Results */}
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('calculator.loanAmount')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(loanAmount)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('calculator.monthlyPayment')}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatCurrency(monthlyPayment)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('calculator.totalInterest')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totalInterest)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('calculator.totalAmount')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('calculator.close')}</Button>
        <Button variant="contained" onClick={onClose}>
          {t('calculator.print')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

