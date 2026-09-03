import { Box, Card, CardContent, Chip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { CalendarDays, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CurrencyIcon from '../ui/CurrencyIcon'
import type { MyInstallment, MyOpportunity } from '../../lib/api-client'

type InstallmentRow = MyInstallment & {
  contractName?: string
  contractNumber?: string
  unitNumber?: string | null
}

function formatAmount(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)
}

function statusColor(status?: string | null): 'default' | 'success' | 'warning' | 'info' {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return 'success'
  if (s.includes('partial')) return 'warning'
  if (s === 'pending') return 'info'
  return 'default'
}

export default function InstallmentList({ contracts }: { contracts: MyOpportunity[] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'

  const rows: InstallmentRow[] = contracts.flatMap((contract) =>
    (contract.installments || []).map((inst) => ({
      ...inst,
      contractName: contract.name,
      contractNumber: contract.contractNumber || contract.stageName,
      unitNumber: contract.unitNumber || contract.units?.[0]?.unitNumber,
    }))
  )

  rows.sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
    return aDate - bDate
  })

  if (rows.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Wallet size={56} color="#CBD5E1" style={{ margin: '0 auto 16px', display: 'block' }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('community.noInstallments')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('community.noInstallmentsDescription')}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {rows.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <Card
            elevation={0}
            sx={(theme) => ({
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            })}
          >
            <CardContent sx={{ p: 2.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800} color="primary.main">
                    {item.name || item.type || t('community.installment')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {[item.contractNumber, item.contractName, item.unitNumber || item.unitLabel]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
                {item.status && (
                  <Chip
                    size="small"
                    label={t(`community.installmentStatus.${normalizeStatusKey(item.status)}`, {
                      defaultValue: item.status,
                    })}
                    color={statusColor(item.status)}
                    sx={{ fontWeight: 600, flexShrink: 0 }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('community.installmentAmount')}
                  </Typography>
                  <Typography fontWeight={700}>
                    {item.amount != null ? (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        {formatAmount(item.amount, locale)}
                        <CurrencyIcon className="mx-1" />
                      </Box>
                    ) : (
                      '—'
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('community.installmentType')}
                  </Typography>
                  <Typography fontWeight={600}>{item.type || '—'}</Typography>
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('community.dueDate')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarDays size={14} />
                    <Typography fontWeight={600}>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {item.percentage != null && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('community.installmentPercentage', { value: item.percentage })}
                </Typography>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  )
}

function normalizeStatusKey(status: string) {
  return status
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}
