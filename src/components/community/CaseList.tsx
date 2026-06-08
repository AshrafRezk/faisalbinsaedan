import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Case } from '../../lib/types'

export default function CaseList({ cases }: { cases: Case[] }) {
  const { t, i18n } = useTranslation()

  const statusConfig: Record<
    Case['status'],
    { label: string; color: 'info' | 'warning' | 'success' | 'default'; icon: React.ElementType }
  > = {
    New: { label: t('cases.status.new'), color: 'info', icon: AlertCircle },
    InProgress: { label: t('cases.status.inProgress'), color: 'warning', icon: Clock },
    Resolved: { label: t('cases.status.resolved'), color: 'success', icon: CheckCircle2 },
    Closed: { label: t('cases.status.closed'), color: 'default', icon: CheckCircle2 },
  }

  const categoryLabels: Record<string, string> = {
    Maintenance: t('cases.category.maintenance'),
    Inquiry: t('cases.category.inquiry'),
    Complaint: t('cases.category.complaint'),
    Documentation: t('cases.category.documentation'),
    Other: t('cases.category.other'),
  }

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <MessageSquare size={48} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
        <Typography variant="h6" fontWeight="semibold" gutterBottom>
          {t('cases.empty.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('cases.empty.description')}
        </Typography>
      </Box>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {cases.map((caseItem, index) => {
        const status = statusConfig[caseItem.status]
        const StatusIcon = status.icon

        return (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              sx={(theme) => ({
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(16px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              })}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {caseItem.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {categoryLabels[caseItem.category]} • {formatDate(caseItem.createdAt)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<StatusIcon size={12} />}
                    label={status.label}
                    color={status.color}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                  {caseItem.description}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </Box>
  )
}

