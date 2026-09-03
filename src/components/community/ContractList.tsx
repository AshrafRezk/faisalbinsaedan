import { Box, Button, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { FileSignature, Building2, Download, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CurrencyIcon from '../ui/CurrencyIcon'
import type { MyContractAttachment, MyOpportunity } from '../../lib/api-client'

function formatAmount(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)
}

function statusColor(status?: string | null): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const s = String(status || '').toLowerCase()
  if (s.includes('signed') || s.includes('verified')) return 'success'
  if (s.includes('cancel') || s.includes('reject') || s.includes('expir')) return 'error'
  if (s.includes('draft')) return 'default'
  if (s.includes('bank') || s.includes('verif') || s.includes('pending') || s.includes('sent')) return 'warning'
  return 'info'
}

function downloadAttachment(file: MyContractAttachment) {
  const anchor = document.createElement('a')
  anchor.href = file.url
  anchor.download = file.filename || file.title || 'contract'
  anchor.rel = 'noopener'
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export default function ContractList({ contracts }: { contracts: MyOpportunity[] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'

  if (contracts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <FileSignature size={56} color="#CBD5E1" style={{ margin: '0 auto 16px', display: 'block' }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('community.noContracts')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('community.noContractsDescription')}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {contracts.map((contract, index) => {
        const progress = Number(contract.paymentProgress || 0)
        const installmentCount = contract.installments?.length || 0
        const paidCount = (contract.installments || []).filter(
          (i) => String(i.status || '').toLowerCase() === 'paid'
        ).length
        const attachments = contract.attachments || []
        const primaryAttachment = attachments[0]

        return (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              elevation={0}
              sx={(theme) => ({
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              })}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
                      {contract.contractNumber || contract.stageName || t('community.contract')}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main" noWrap>
                      {contract.name}
                    </Typography>
                    {(contract.unitNumber || contract.units?.[0]?.unitNumber) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                        <Building2 size={14} />
                        <Typography variant="body2" color="text.secondary">
                          {t('community.unit')}: {contract.unitNumber || contract.units?.[0]?.unitNumber}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {contract.contractStatus && (
                    <Chip
                      size="small"
                      label={contract.contractStatus}
                      color={statusColor(contract.contractStatus)}
                      sx={{ fontWeight: 600, flexShrink: 0 }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('community.contractAmount')}
                    </Typography>
                    <Typography fontWeight={700}>
                      {contract.amount != null ? (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          {formatAmount(contract.amount, locale)}
                          <CurrencyIcon className="mx-1" />
                        </Box>
                      ) : (
                        '—'
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('community.paymentMethod')}
                    </Typography>
                    <Typography fontWeight={600}>{contract.paymentMethod || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('community.installmentsCount')}
                    </Typography>
                    <Typography fontWeight={600}>
                      {t('community.installmentsPaidOfTotal', { paid: paidCount, total: installmentCount })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('community.paymentPlan')}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, progress))}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box
                  sx={{
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                      {t('community.contractDocuments')}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!primaryAttachment}
                      startIcon={<Download size={16} />}
                      onClick={() => primaryAttachment && downloadAttachment(primaryAttachment)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2,
                      }}
                    >
                      {t('community.downloadContract')}
                    </Button>
                  </Box>

                  {attachments.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      {t('community.noContractDocuments')}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {attachments.map((file) => (
                        <Box
                          key={file.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            px: 1.25,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <FileText size={16} color="#1a365d" />
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {file.filename || file.title}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            onClick={() => downloadAttachment(file)}
                            startIcon={<Download size={14} />}
                            sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
                          >
                            {t('community.download')}
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </Box>
  )
}
