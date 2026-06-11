import { Dialog, DialogTitle, DialogContent, Button, Box, Typography } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import LeadInterestForm from './LeadInterestForm'

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
}: RegisterInterestModalProps) {
  const { t } = useTranslation()

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h6">{t('contact.formTitle')}</Typography>
            {projectName && (
              <Typography variant="body2" color="text.secondary">
                {projectName}
              </Typography>
            )}
          </Box>
          <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }} aria-label={t('common.close')}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
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
          onCancel={handleClose}
          onDialogFlowComplete={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
