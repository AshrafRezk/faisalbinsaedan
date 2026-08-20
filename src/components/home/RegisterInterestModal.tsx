import { Dialog, DialogTitle, DialogContent, Button, Box, Typography } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import LeadInterestForm from './LeadInterestForm'
import CommercialLeadForm from '../commercial/CommercialLeadForm'

interface RegisterInterestModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
  phaseId?: string
  unitId?: string
  unitNumber?: string
  projectName?: string
  fallbackProvinceRegion?: string
  fallbackCity?: string
  /** Commercial project pages use the rental interest form instead of the general lead form */
  isCommercial?: boolean
}

export default function RegisterInterestModal({
  isOpen,
  onClose,
  projectId,
  phaseId,
  unitId,
  unitNumber,
  projectName,
  fallbackProvinceRegion,
  fallbackCity,
  isCommercial = false,
}: RegisterInterestModalProps) {
  const { t } = useTranslation()

  const handleClose = () => {
    onClose()
  }

  const formTitle = isCommercial ? t('commercial.formTitle') : t('contact.formTitle')
  const formSubtitle = isCommercial ? t('commercial.formCta') : undefined

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h6">{formTitle}</Typography>
            {projectName && (
              <Typography variant="body2" color="text.secondary">
                {projectName}
              </Typography>
            )}
            {formSubtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {formSubtitle}
              </Typography>
            )}
          </Box>
          <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }} aria-label={t('common.close')}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isCommercial ? (
          <CommercialLeadForm
            mode="dialog"
            active={isOpen}
            projectId={projectId}
            projectName={projectName}
            fallbackProvinceRegion={fallbackProvinceRegion}
            fallbackCity={fallbackCity}
            onCancel={handleClose}
            onDialogFlowComplete={onClose}
          />
        ) : (
          <LeadInterestForm
            mode="dialog"
            active={isOpen}
            projectId={projectId}
            phaseId={phaseId}
            unitId={unitId}
            unitNumber={unitNumber}
            projectName={projectName}
            fallbackProvinceRegion={fallbackProvinceRegion}
            fallbackCity={fallbackCity}
            allowedProfiles={['Individual']}
            onCancel={handleClose}
            onDialogFlowComplete={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
